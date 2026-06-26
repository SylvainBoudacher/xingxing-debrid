import { LazyStore } from "@tauri-apps/plugin-store";
import { isVideoFile, type DebridFile } from "@/lib/debrid";

export type LibraryProvider = "c411" | "nyaa" | "discover";

// Métadonnées TMDB conservées pour les entrées issues de la page Découverte :
// servent à afficher l'affiche et quelques infos dans la vue grille.
export interface TmdbMeta {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  year: string;
  voteAverage: number;
  overview: string;
}

export interface LibraryEntry {
  infoHash: string;
  title: string;
  provider: LibraryProvider;
  category: number;
  size: number;
  addedAt: number;
  magnetId?: number;
  files: DebridFile[];
  enriched: boolean;
  // Clé = nom de fichier. WHOLE sert au cas non enrichi (un seul interrupteur).
  watched: Record<string, boolean>;
  // Présent uniquement pour les entrées provenant de Découverte.
  tmdb?: TmdbMeta;
}

const STORE_KEY = "library";
const WHOLE = "__whole__";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

// Cache mémoire alimenté au lancement (pendant le splash) pour que la page
// bibliothèque s'ouvre instantanément sans flash d'écran vide.
let cache: LibraryEntry[] | null = null;

export async function loadLibrary(): Promise<LibraryEntry[]> {
  cache = (await store.get<LibraryEntry[]>(STORE_KEY)) ?? [];
  return cache;
}

// Lecture synchrone du cache : null tant que loadLibrary/prefetchLibrary
// n'a pas résolu au moins une fois.
export function getCachedLibrary(): LibraryEntry[] | null {
  return cache;
}

// Réchauffe le cache au lancement. À appeler pendant le splash.
export function prefetchLibrary(): Promise<LibraryEntry[]> {
  return loadLibrary();
}

export async function saveLibrary(entries: LibraryEntry[]): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  cache = entries;
  await store.set(STORE_KEY, entries);
  await store.save();
}

// Écriture disque différée : met le cache à jour immédiatement mais ne flushe
// le fichier qu'après une période de silence, pour regrouper les rafales de
// coches en une seule écriture.
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DELAY = 400;

export function saveLibraryDebounced(entries: LibraryEntry[]): void {
  cache = entries;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void saveLibrary(entries);
  }, SAVE_DELAY);
}

// Force l'écriture en attente (ex. à la fermeture de la page).
export function flushLibrary(): void {
  if (!saveTimer || cache === null) return;
  clearTimeout(saveTimer);
  saveTimer = null;
  void saveLibrary(cache);
}

export interface RecordDownloadInput {
  infoHash: string;
  title: string;
  provider: LibraryProvider;
  category: number;
  size: number;
  magnetId?: number;
  files: DebridFile[];
  enriched: boolean;
  tmdb?: TmdbMeta;
}

// Upsert par infoHash. Préserve l'état de visionnage d'une entrée existante et
// migre la coche globale vers le fichier vidéo unique dès l'enrichissement.
export async function recordDownload(input: RecordDownloadInput): Promise<void> {
  const entries = await loadLibrary();
  const existing = entries.find((e) => e.infoHash === input.infoHash);

  const next: LibraryEntry = {
    infoHash: input.infoHash,
    title: input.title,
    provider: input.provider,
    category: input.category,
    size: input.size,
    addedAt: existing?.addedAt ?? Date.now(),
    magnetId: input.magnetId ?? existing?.magnetId,
    files: input.enriched ? input.files : (existing?.files ?? input.files),
    enriched: input.enriched || (existing?.enriched ?? false),
    watched: { ...(existing?.watched ?? {}) },
    tmdb: input.tmdb ?? existing?.tmdb,
  };

  migrateWholeToSingle(next);

  const updated = existing
    ? entries.map((e) => (e.infoHash === input.infoHash ? next : e))
    : [...entries, next];
  await saveLibrary(updated);
}

// Si l'entrée vient d'être enrichie avec un seul fichier vidéo, reporte la
// coche globale (__whole__) sur ce fichier puis nettoie la clé sentinelle.
function migrateWholeToSingle(entry: LibraryEntry): void {
  if (!entry.enriched) return;
  const vids = videoFiles(entry);
  if (vids.length === 1 && entry.watched[WHOLE] !== undefined) {
    entry.watched[vids[0].name] = entry.watched[WHOLE];
  }
  delete entry.watched[WHOLE];
}

// Applique une liste de fichiers récupérée depuis AllDebrid à une entrée non
// enrichie, en préservant la coche globale posée avant l'enrichissement.
export function applyEnrichment(entry: LibraryEntry, files: DebridFile[]): LibraryEntry {
  const next: LibraryEntry = {
    ...entry,
    files,
    enriched: true,
    watched: { ...entry.watched },
  };
  migrateWholeToSingle(next);
  return next;
}

// Cache indexé sur le tableau `files` : la référence reste stable tant que
// l'entrée n'est pas ré-enrichie (cocher un épisode ne touche que `watched`),
// donc le filtre n'est calculé qu'une fois par liste de fichiers.
const videoFilesCache = new WeakMap<DebridFile[], DebridFile[]>();

export function videoFiles(entry: LibraryEntry): DebridFile[] {
  const cached = videoFilesCache.get(entry.files);
  if (cached) return cached;
  const vids = entry.files.filter((f) => isVideoFile(f.name));
  videoFilesCache.set(entry.files, vids);
  return vids;
}

export function isSeries(entry: LibraryEntry): boolean {
  return entry.enriched && videoFiles(entry).length > 1;
}

// Les entrées C411 / Nyaa n'ont pas de métadonnées TMDB (contrairement à
// Découverte) : on propose de les compléter manuellement.
export function canEnrichTmdb(entry: LibraryEntry): boolean {
  return !entry.tmdb && (entry.provider === "c411" || entry.provider === "nyaa");
}

// Label court saison+épisode pour l'UI (ex. "S2E4", "S3"). Null si rien détecté.
export function episodeLabel(name: string): string | null {
  const base = name.split("/").pop() ?? name;
  const m = base.match(/\bS(\d{1,2})[ ._-]?E(\d{1,3})\b/i);
  if (m) return `S${parseInt(m[1], 10)}E${parseInt(m[2], 10)}`;
  const s = seasonOf(name);
  if (s !== null) return `S${s}`;
  return null;
}

// Numéro de saison déduit du nom de fichier (S01E02, Saison 1, Season 1...).
// Retourne null si aucun marqueur de saison n'est trouvé.
export function seasonOf(name: string): number | null {
  const base = name.split("/").pop() ?? name;
  const m =
    base.match(/\bS(\d{1,2})[ ._-]?E\d{1,3}\b/i) ??
    base.match(/\b(?:saison|season)[ ._-]?(\d{1,2})\b/i) ??
    base.match(/\bS(\d{1,2})\b/i);
  return m ? parseInt(m[1], 10) : null;
}

export interface SeasonGroup {
  season: number | null;
  files: DebridFile[];
}

// Regroupe les fichiers vidéo par saison, triés par numéro croissant
// (les fichiers sans saison détectée vont en dernier).
export function groupBySeason(files: DebridFile[]): SeasonGroup[] {
  const map = new Map<number | null, DebridFile[]>();
  for (const f of files) {
    const s = seasonOf(f.name);
    if (!map.has(s)) map.set(s, []);
    map.get(s)!.push(f);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] ?? Infinity) - (b[0] ?? Infinity))
    .map(([season, files]) => ({ season, files }));
}

// Vrai si l'entrée contient au moins deux saisons distinctes.
export function hasMultipleSeasons(entry: LibraryEntry): boolean {
  const groups = groupBySeason(videoFiles(entry));
  return groups.filter((g) => g.season !== null).length > 1;
}

// Marque (ou démarque) un ensemble de fichiers comme vus.
export function setFilesWatched(
  entry: LibraryEntry,
  names: string[],
  value: boolean,
): LibraryEntry {
  const watched = { ...entry.watched };
  for (const n of names) watched[n] = value;
  return { ...entry, watched };
}

export function isWholeWatched(entry: LibraryEntry): boolean {
  const vids = videoFiles(entry);
  if (vids.length === 0) return entry.watched[WHOLE] ?? false;
  return vids.every((f) => entry.watched[f.name]);
}

export function setWholeWatched(entry: LibraryEntry, value: boolean): LibraryEntry {
  const watched: Record<string, boolean> = {};
  const vids = videoFiles(entry);
  if (vids.length === 0) {
    watched[WHOLE] = value;
  } else {
    for (const f of vids) watched[f.name] = value;
  }
  return { ...entry, watched };
}

export function toggleFile(entry: LibraryEntry, name: string): LibraryEntry {
  return { ...entry, watched: { ...entry.watched, [name]: !entry.watched[name] } };
}

export function watchedCount(entry: LibraryEntry): number {
  return videoFiles(entry).filter((f) => entry.watched[f.name]).length;
}

export function totalCount(entry: LibraryEntry): number {
  return videoFiles(entry).length;
}

// Premier fichier vidéo non encore vu (pour le bouton « Reprendre »).
export function nextUnwatched(entry: LibraryEntry): DebridFile | null {
  const sorted = groupBySeason(videoFiles(entry)).flatMap((g) => g.files);
  return sorted.find((f) => !entry.watched[f.name]) ?? null;
}

// Ratio de visionnage entre 0 et 1.
export function progressRatio(entry: LibraryEntry): number {
  const total = totalCount(entry);
  if (total === 0) return isWholeWatched(entry) ? 1 : 0;
  return watchedCount(entry) / total;
}

// ---------- Series grouping ----------

export interface SeriesGroup {
  tmdbId: number;
  tmdb: TmdbMeta;
  entries: LibraryEntry[];
}

export type DisplayItem =
  | { type: "single"; entry: LibraryEntry }
  | { type: "group"; group: SeriesGroup };

// Best-guess season number for an entry: the season that has the most files.
export function dominantSeason(entry: LibraryEntry): number | null {
  const groups = groupBySeason(videoFiles(entry));
  const withSeason = groups.filter((g) => g.season !== null);
  if (withSeason.length === 0) return null;
  return withSeason.reduce(
    (best, g) => (g.files.length >= best.files.length ? g : best),
    withSeason[0],
  ).season;
}

// Groups entries sharing the same TMDB TV series id. Preserves relative order
// of first appearance; entries within each group are sorted by season.
// Single-entry groups are collapsed back to singles.
export function groupLibraryEntries(entries: LibraryEntry[]): DisplayItem[] {
  const seen = new Map<number, SeriesGroup>();
  const items: DisplayItem[] = [];

  for (const entry of entries) {
    if (entry.tmdb?.mediaType === "tv") {
      const id = entry.tmdb.id;
      if (seen.has(id)) {
        seen.get(id)!.entries.push(entry);
      } else {
        const group: SeriesGroup = { tmdbId: id, tmdb: entry.tmdb, entries: [entry] };
        seen.set(id, group);
        items.push({ type: "group", group });
      }
    } else {
      items.push({ type: "single", entry });
    }
  }

  for (const item of items) {
    if (item.type === "group" && item.group.entries.length > 1) {
      item.group.entries.sort((a, b) => (dominantSeason(a) ?? 999) - (dominantSeason(b) ?? 999));
    }
  }

  return items.map((item) =>
    item.type === "group" && item.group.entries.length === 1
      ? { type: "single" as const, entry: item.group.entries[0] }
      : item,
  );
}

export function groupWatchedCount(group: SeriesGroup): number {
  return group.entries.reduce((s, e) => s + watchedCount(e), 0);
}

export function groupTotalCount(group: SeriesGroup): number {
  return group.entries.reduce((s, e) => s + totalCount(e), 0);
}

export function groupProgressRatio(group: SeriesGroup): number {
  const total = groupTotalCount(group);
  return total === 0 ? 0 : groupWatchedCount(group) / total;
}

export function groupIsWholeWatched(group: SeriesGroup): boolean {
  return group.entries.every((e) => isWholeWatched(e));
}

export function groupNextUnwatched(
  group: SeriesGroup,
): { entry: LibraryEntry; file: DebridFile } | null {
  for (const entry of group.entries) {
    const f = nextUnwatched(entry);
    if (f) return { entry, file: f };
  }
  return null;
}

export function groupSize(group: SeriesGroup): number {
  return group.entries.reduce((s, e) => s + e.size, 0);
}

export function groupAddedAt(group: SeriesGroup): number {
  return Math.max(...group.entries.map((e) => e.addedAt));
}
