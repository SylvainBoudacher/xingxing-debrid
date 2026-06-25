import { LazyStore } from "@tauri-apps/plugin-store";
import { isVideoFile, type DebridFile } from "@/lib/debrid";

export type LibraryProvider = "c411" | "nyaa" | "discover";

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
}

const STORE_KEY = "library";
const WHOLE = "__whole__";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

export async function loadLibrary(): Promise<LibraryEntry[]> {
  return (await store.get<LibraryEntry[]>(STORE_KEY)) ?? [];
}

export async function saveLibrary(entries: LibraryEntry[]): Promise<void> {
  await store.set(STORE_KEY, entries);
  await store.save();
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

export function videoFiles(entry: LibraryEntry): DebridFile[] {
  return entry.files.filter((f) => isVideoFile(f.name));
}

export function isSeries(entry: LibraryEntry): boolean {
  return entry.enriched && videoFiles(entry).length > 1;
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
  return videoFiles(entry).find((f) => !entry.watched[f.name]) ?? null;
}

// Ratio de visionnage entre 0 et 1.
export function progressRatio(entry: LibraryEntry): number {
  const total = totalCount(entry);
  if (total === 0) return isWholeWatched(entry) ? 1 : 0;
  return watchedCount(entry) / total;
}
