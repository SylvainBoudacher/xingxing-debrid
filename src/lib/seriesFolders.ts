import {
  dominantSeason,
  episodeOf,
  groupSeasons,
  seasonOf,
  videoFiles,
  type LibraryEntry,
  type SeasonItem,
  type SeriesGroup,
} from "@/lib/library";
import { LazyStore } from "@tauri-apps/plugin-store";

// Dossiers manuels par série TMDB : une couche d'overrides persistée
// par-dessus le regroupement automatique par saison (groupSeasons).
// Tant qu'une série n'a pas de config, le comportement auto reste inchangé.

export interface SeriesFolder {
  id: string;
  name: string;
  // Saison auto-détectée que ce dossier absorbe : les fichiers ajoutés après
  // la création des dossiers y sont rangés d'office. Null = dossier manuel.
  season: number | null;
}

export interface SeriesFolderConfig {
  folders: SeriesFolder[];
  // Clé fichier (fileKey) -> id de dossier. "" = explicitement non classé.
  assignments: Record<string, string>;
}

type ConfigMap = Record<string, SeriesFolderConfig>;

const STORE_KEY = "seriesFolders";
const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

let cache: ConfigMap | null = null;

export async function loadSeriesFolders(): Promise<ConfigMap> {
  cache = (await store.get<ConfigMap>(STORE_KEY)) ?? {};
  return cache;
}

export function getCachedSeriesFolders(): ConfigMap | null {
  return cache;
}

export async function saveSeriesFolderConfig(
  tmdbId: number,
  config: SeriesFolderConfig,
): Promise<void> {
  const map = cache ?? (await loadSeriesFolders());
  map[String(tmdbId)] = config;
  await store.set(STORE_KEY, map);
  await store.save();
}

// Les noms de fichiers peuvent se répéter d'un torrent à l'autre : la clé
// combine l'infoHash de l'entrée et le nom du fichier.
export function fileKey(entry: LibraryEntry, fileName: string): string {
  return `${entry.infoHash}:${fileName}`;
}

// Convertit le regroupement automatique en dossiers explicites, au premier
// passage en mode organisation.
export function materializeFolders(group: SeriesGroup): SeriesFolderConfig {
  const folders: SeriesFolder[] = [];
  const assignments: Record<string, string> = {};
  for (const s of groupSeasons(group)) {
    const folder: SeriesFolder = {
      id: crypto.randomUUID(),
      name: s.season !== null ? `Saison ${s.season}` : "Non classés",
      season: s.season,
    };
    folders.push(folder);
    for (const it of s.items) assignments[fileKey(it.entry, it.file.name)] = folder.id;
  }
  return { folders, assignments };
}

export interface FolderSection {
  // Null = section implicite "Non classés" (fichiers sans dossier).
  folder: SeriesFolder | null;
  items: SeasonItem[];
}

// Ventile les fichiers du groupe dans les dossiers configurés, dans l'ordre
// de la config. Un fichier sans affectation explicite est routé vers le
// dossier dont `season` correspond à sa saison détectée, sinon vers la
// section implicite "Non classés" en fin de liste.
export function groupFolderSections(
  group: SeriesGroup,
  config: SeriesFolderConfig,
): FolderSection[] {
  const byId = new Map<string, SeasonItem[]>();
  const bySeason = new Map<number, string>();
  for (const f of config.folders) {
    byId.set(f.id, []);
    if (f.season !== null && !bySeason.has(f.season)) bySeason.set(f.season, f.id);
  }
  const orphans: SeasonItem[] = [];
  for (const entry of group.entries) {
    const fallback = dominantSeason(entry);
    for (const file of videoFiles(entry)) {
      const assigned = config.assignments[fileKey(entry, file.name)];
      if (assigned !== undefined && byId.has(assigned)) {
        byId.get(assigned)!.push({ entry, file });
        continue;
      }
      const season = assigned === "" ? null : (seasonOf(file.name) ?? fallback);
      const target = season !== null ? bySeason.get(season) : undefined;
      if (target !== undefined) byId.get(target)!.push({ entry, file });
      else orphans.push({ entry, file });
    }
  }
  const byEpisode = (items: SeasonItem[]) =>
    items.sort(
      (a, b) => (episodeOf(a.file.name) ?? Infinity) - (episodeOf(b.file.name) ?? Infinity),
    );
  const sections: FolderSection[] = config.folders.map((folder) => ({
    folder,
    items: byEpisode(byId.get(folder.id)!),
  }));
  if (orphans.length > 0) sections.push({ folder: null, items: byEpisode(orphans) });
  return sections;
}

// Affecte des fichiers à un dossier ("" = non classé).
export function assignFiles(
  config: SeriesFolderConfig,
  keys: string[],
  folderId: string,
): SeriesFolderConfig {
  const assignments = { ...config.assignments };
  for (const k of keys) assignments[k] = folderId;
  return { ...config, assignments };
}

// Supprime un dossier ; ses fichiers affectés deviennent non classés.
export function removeFolder(config: SeriesFolderConfig, id: string): SeriesFolderConfig {
  const assignments: Record<string, string> = {};
  for (const [k, v] of Object.entries(config.assignments)) assignments[k] = v === id ? "" : v;
  return { folders: config.folders.filter((f) => f.id !== id), assignments };
}

export function renameFolder(
  config: SeriesFolderConfig,
  id: string,
  name: string,
): SeriesFolderConfig {
  return {
    ...config,
    folders: config.folders.map((f) => (f.id === id ? { ...f, name } : f)),
  };
}

export function addFolder(config: SeriesFolderConfig, folder: SeriesFolder): SeriesFolderConfig {
  return { ...config, folders: [...config.folders, folder] };
}

// Purge les affectations de fichiers supprimés de la bibliothèque.
export function pruneAssignments(
  config: SeriesFolderConfig,
  keys: Set<string>,
): SeriesFolderConfig {
  const assignments: Record<string, string> = {};
  for (const [k, v] of Object.entries(config.assignments)) {
    if (!keys.has(k)) assignments[k] = v;
  }
  return { ...config, assignments };
}
