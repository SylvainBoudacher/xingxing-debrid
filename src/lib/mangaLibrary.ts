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
  /** Tome importe depuis un fichier local : aucun lien AllDebrid derriere. */
  source?: "local";
}

/** infoHash conventionnel des tomes importes, qui ne viennent d'aucun torrent. */
export const LOCAL_INFO_HASH = "local";

export type ReadingDirection = "rtl" | "ltr";

/**
 * Torrent envoye a AllDebrid dont les fichiers ne sont pas encore disponibles
 * (debridage en cours). Il n'a donc pas encore de tomes : l'entree le garde en
 * attente pour pouvoir reessayer plus tard.
 */
export interface PendingTorrent {
  infoHash: string;
  magnetId: number;
  torrentName: string;
  addedAt: number;
}

export interface MangaEntry {
  mangaId: string;
  meta: MangaMeta;
  volumes: MangaVolume[];
  pending?: PendingTorrent[];
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

/**
 * Reconstruit un MangaItem a partir d'une entree de bibliotheque, pour
 * rechercher d'autres tomes sans repasser par MangaDex. Le titre memorise sert
 * de titre francais : c'est celui qui a permis de trouver les releases.
 */
export function itemFromEntry(entry: MangaEntry): MangaItem {
  return {
    id: entry.mangaId,
    title: entry.meta.title,
    titleFr: entry.meta.title,
    titleEn: null,
    titleRomaji: null,
    coverFileName: entry.meta.coverFileName,
    year: entry.meta.year,
    status: entry.meta.status,
    lastVolume: entry.meta.lastVolume,
    description: entry.meta.description,
    tags: entry.meta.tags,
  };
}

// Ids MangaDex deja presents dans la bibliotheque, pour le badge "Dans la
// bibliotheque" sur les suggestions de recherche.
export function ownedMangaIds(entries: MangaEntry[]): Set<string> {
  return new Set(entries.map((e) => e.mangaId));
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
  // Un tome importe a la main a ete choisi explicitement : il l'emporte sur la
  // version issue d'un torrent, quelle que soit sa taille.
  if ((a.source === "local") !== (b.source === "local")) return a.source === "local" ? a : b;
  if (!!a.localPath !== !!b.localPath) return a.localPath ? a : b;
  return a.fileSize >= b.fileSize ? a : b;
}

/**
 * Ajoute ou complete l'entree d'une oeuvre avec les tomes d'un torrent. Un
 * torrent encore en cours de debridage n'apporte pas de tomes : il est place en
 * attente et resolu plus tard par `resolvePendingTorrent`.
 */
export async function upsertMangaRelease(
  item: MangaItem,
  { volumes = [], pending }: { volumes?: MangaVolume[]; pending?: PendingTorrent },
): Promise<MangaEntry> {
  const entries = cache ?? (await loadMangaLibrary());
  const existing = entries.find((e) => e.mangaId === item.id);
  const next: MangaEntry = {
    mangaId: item.id,
    meta: metaFromItem(item),
    volumes: mergeVolumes(existing?.volumes ?? [], volumes),
    pending: mergePending(existing?.pending, pending, volumes),
    readingDirection: existing?.readingDirection,
    addedAt: existing?.addedAt ?? Date.now(),
    updatedAt: Date.now(),
  };
  await saveMangaLibrary(
    existing ? entries.map((e) => (e.mangaId === item.id ? next : e)) : [...entries, next],
  );
  return next;
}

// Un torrent dont les tomes viennent d'arriver quitte la liste d'attente.
function mergePending(
  existing: PendingTorrent[] | undefined,
  incoming: PendingTorrent | undefined,
  volumes: MangaVolume[],
): PendingTorrent[] | undefined {
  const resolved = new Set(volumes.map((v) => v.infoHash));
  const kept = (existing ?? []).filter((p) => !resolved.has(p.infoHash));
  const all = incoming ? [...kept.filter((p) => p.infoHash !== incoming.infoHash), incoming] : kept;
  return all.length > 0 ? all : undefined;
}

/** Rattache les tomes d'un torrent qui etait en attente de debridage. */
export async function resolvePendingTorrent(
  mangaId: string,
  infoHash: string,
  volumes: MangaVolume[],
): Promise<void> {
  const entries = cache ?? (await loadMangaLibrary());
  await saveMangaLibrary(
    entries.map((entry) =>
      entry.mangaId !== mangaId
        ? entry
        : {
            ...entry,
            volumes: mergeVolumes(entry.volumes, volumes),
            pending: mergePending(entry.pending, undefined, [
              ...volumes,
              // Un torrent sans aucun CBZ ne doit pas rester en attente.
              { infoHash } as MangaVolume,
            ]),
            updatedAt: Date.now(),
          },
    ),
  );
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

/** Retire un tome de l'oeuvre, sans toucher au fichier sur le disque. */
export async function removeVolume(
  mangaId: string,
  fileName: string,
  infoHash: string,
): Promise<void> {
  const entries = cache ?? (await loadMangaLibrary());
  await saveMangaLibrary(
    entries.map((entry) =>
      entry.mangaId !== mangaId
        ? entry
        : {
            ...entry,
            updatedAt: Date.now(),
            volumes: entry.volumes.filter(
              (v) => !(v.fileName === fileName && v.infoHash === infoHash),
            ),
          },
    ),
  );
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
