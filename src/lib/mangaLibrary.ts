import type { DebridFile } from "@/lib/debrid";
import type { MangaItem, MangaStatus } from "@/lib/mangaItem";
import { volumeFromFileName } from "@/lib/parseVolume";
import { LazyStore } from "@tauri-apps/plugin-store";

// Bibliotheque manga, volontairement separee de library.ts : l'unite y est
// l'oeuvre et non le torrent, et un meme manga agrege les tomes de plusieurs
// releases (un lot T01-T41, puis les tomes suivants un par un).
const STORE_KEY = "manga_library";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

export interface MangaMeta {
  title: string;
  coverFileName: string | null;
  year: string;
  status: MangaStatus;
  lastVolume: number | null;
  description: string;
  tags: string[];
}

export interface MangaVolume {
  /** null quand le nom de fichier ne permet pas d'identifier le tome. */
  number: number | null;
  /** Torrent d'ou provient le fichier. */
  infoHash: string;
  magnetId?: number;
  /** Nom du fichier dans le torrent, cle d'identite au sein d'une release. */
  fileName: string;
  fileSize: number;
  /** Lien AllDebrid, a debloquer avant telechargement. */
  link: string;
  /** Chemin local, renseigne une fois le tome telecharge. */
  localPath?: string;
  pageCount?: number;
  lastPage?: number;
  read?: boolean;
}

export type ReadingDirection = "rtl" | "ltr";

export interface MangaEntry {
  mangaId: string;
  meta: MangaMeta;
  volumes: MangaVolume[];
  readingDirection?: ReadingDirection;
  addedAt: number;
  updatedAt?: number;
}

let cache: MangaEntry[] | null = null;

export async function loadMangaLibrary(): Promise<MangaEntry[]> {
  cache = (await store.get<MangaEntry[]>(STORE_KEY)) ?? [];
  return cache;
}

export function getCachedMangaLibrary(): MangaEntry[] | null {
  return cache;
}

export function prefetchMangaLibrary(): Promise<MangaEntry[]> {
  return loadMangaLibrary();
}

export async function saveMangaLibrary(entries: MangaEntry[]): Promise<void> {
  cache = entries;
  await store.set(STORE_KEY, entries);
  await store.save();
}

export function metaFromItem(item: MangaItem): MangaMeta {
  return {
    title: item.title,
    coverFileName: item.coverFileName,
    year: item.year,
    status: item.status,
    lastVolume: item.lastVolume,
    description: item.description,
    tags: item.tags,
  };
}

// Les .cbz sont les seuls fichiers lisibles par le lecteur. Les .cbr (RAR) et
// les PDF presents dans certaines releases sont ignores a l'ajout.
export function isReadableFile(name: string): boolean {
  return name.toLowerCase().endsWith(".cbz");
}

/** Convertit les fichiers d'un torrent en tomes, tries et numerotes. */
export function volumesFromFiles(
  files: DebridFile[],
  infoHash: string,
  magnetId?: number,
): MangaVolume[] {
  return files
    .filter((f) => isReadableFile(f.name))
    .map((f) => ({
      number: volumeFromFileName(f.name),
      infoHash,
      magnetId,
      fileName: f.name,
      fileSize: f.size,
      link: f.link,
    }))
    .sort(compareVolumes);
}

export function compareVolumes(a: MangaVolume, b: MangaVolume): number {
  if (a.number === null && b.number === null) return a.fileName.localeCompare(b.fileName);
  // Les tomes non identifies vont en fin de liste.
  if (a.number === null) return 1;
  if (b.number === null) return -1;
  return a.number - b.number;
}

/**
 * Fusionne des tomes dans une liste existante.
 *
 * Deux tomes portant le meme numero sont des doublons (deux releases
 * concurrentes du meme volume) : on garde celui deja telecharge, sinon le plus
 * volumineux, qui est en pratique le mieux scanne. Un tome deja present et
 * reimporte conserve sa progression de lecture.
 */
export function mergeVolumes(existing: MangaVolume[], incoming: MangaVolume[]): MangaVolume[] {
  const byFile = new Map(existing.map((v) => [`${v.infoHash}:${v.fileName}`, v]));
  for (const volume of incoming) {
    const key = `${volume.infoHash}:${volume.fileName}`;
    const before = byFile.get(key);
    byFile.set(key, before ? { ...volume, ...readingState(before) } : volume);
  }

  const kept = new Map<string, MangaVolume>();
  for (const volume of byFile.values()) {
    // Les tomes non numerotes ne peuvent pas etre dedupliques entre eux.
    const key =
      volume.number === null ? `file:${volume.infoHash}:${volume.fileName}` : `n:${volume.number}`;
    const rival = kept.get(key);
    if (!rival || preferVolume(volume, rival) === volume) kept.set(key, volume);
  }
  return [...kept.values()].sort(compareVolumes);
}

function readingState(v: MangaVolume): Partial<MangaVolume> {
  return { localPath: v.localPath, pageCount: v.pageCount, lastPage: v.lastPage, read: v.read };
}

function preferVolume(a: MangaVolume, b: MangaVolume): MangaVolume {
  if (!!a.localPath !== !!b.localPath) return a.localPath ? a : b;
  return a.fileSize >= b.fileSize ? a : b;
}

/** Ajoute ou complete l'entree d'une oeuvre avec les tomes d'un torrent. */
export async function upsertMangaVolumes(
  item: MangaItem,
  volumes: MangaVolume[],
): Promise<MangaEntry> {
  const entries = cache ?? (await loadMangaLibrary());
  const existing = entries.find((e) => e.mangaId === item.id);
  const next: MangaEntry = {
    mangaId: item.id,
    meta: metaFromItem(item),
    volumes: mergeVolumes(existing?.volumes ?? [], volumes),
    readingDirection: existing?.readingDirection,
    addedAt: existing?.addedAt ?? Date.now(),
    updatedAt: Date.now(),
  };
  await saveMangaLibrary(
    existing ? entries.map((e) => (e.mangaId === item.id ? next : e)) : [...entries, next],
  );
  return next;
}

/** Met a jour un tome en place (progression, chemin local, etat lu). */
export async function updateVolume(
  mangaId: string,
  fileName: string,
  infoHash: string,
  patch: Partial<MangaVolume>,
): Promise<void> {
  const entries = cache ?? (await loadMangaLibrary());
  const updated = entries.map((entry) =>
    entry.mangaId !== mangaId
      ? entry
      : {
          ...entry,
          updatedAt: Date.now(),
          volumes: entry.volumes.map((v) =>
            v.fileName === fileName && v.infoHash === infoHash ? { ...v, ...patch } : v,
          ),
        },
  );
  await saveMangaLibrary(updated);
}

export async function removeMangaEntry(mangaId: string): Promise<void> {
  const entries = cache ?? (await loadMangaLibrary());
  await saveMangaLibrary(entries.filter((e) => e.mangaId !== mangaId));
}

export async function setReadingDirection(
  mangaId: string,
  direction: ReadingDirection,
): Promise<void> {
  const entries = cache ?? (await loadMangaLibrary());
  await saveMangaLibrary(
    entries.map((e) =>
      e.mangaId === mangaId ? { ...e, readingDirection: direction, updatedAt: Date.now() } : e,
    ),
  );
}

export interface MangaProgress {
  total: number;
  downloaded: number;
  read: number;
}

export function mangaProgress(entry: MangaEntry): MangaProgress {
  return {
    total: entry.volumes.length,
    downloaded: entry.volumes.filter((v) => v.localPath).length,
    read: entry.volumes.filter((v) => v.read).length,
  };
}

/** Prochain tome a lire : le premier non lu, sinon le dernier de la liste. */
export function nextVolume(entry: MangaEntry): MangaVolume | null {
  if (entry.volumes.length === 0) return null;
  return entry.volumes.find((v) => !v.read) ?? entry.volumes[entry.volumes.length - 1];
}
