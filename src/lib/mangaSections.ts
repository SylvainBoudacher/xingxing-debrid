import { UNCLASSIFIED, UNCLASSIFIED_LABEL, type CategoryConfig } from "@/lib/libraryCategories";
import { mangaCategoryOf } from "@/lib/mangaCategories";
import type { MangaEntry } from "@/lib/mangaLibrary";
import type { MangaFilter, MangaGrouping, MangaSort } from "@/lib/mangaPrefs";

// Une oeuvre est "lue" quand tous ses tomes le sont. Une oeuvre sans tome
// (torrent encore en débridage) reste à lire : rien n'a été lu.
export function isFullyRead(entry: MangaEntry): boolean {
  return entry.volumes.length > 0 && entry.volumes.every((v) => v.read);
}

/** Poids total des tomes de l'oeuvre, téléchargés ou non. */
export function entrySize(entry: MangaEntry): number {
  return entry.volumes.reduce((sum, v) => sum + v.fileSize, 0);
}

const SORTERS: Record<MangaSort, (a: MangaEntry, b: MangaEntry) => number> = {
  recent: (a, b) => b.addedAt - a.addedAt,
  title: (a, b) => a.meta.title.localeCompare(b.meta.title, "fr"),
  size: (a, b) => entrySize(b) - entrySize(a),
};

export function mangaCounts(entries: MangaEntry[]): Record<MangaFilter, number> {
  const done = entries.filter(isFullyRead).length;
  return { all: entries.length, done, todo: entries.length - done };
}

export function visibleMangas(
  entries: MangaEntry[],
  filter: MangaFilter,
  query: string,
  sort: MangaSort,
): MangaEntry[] {
  const q = query.trim().toLowerCase();
  const filtered = entries.filter((entry) => {
    if (filter !== "all" && (filter === "done") !== isFullyRead(entry)) return false;
    return q === "" || entry.meta.title.toLowerCase().includes(q);
  });
  return [...filtered].sort(SORTERS[sort]);
}

export interface MangaBlock {
  key: string;
  label: string | null;
  count: number;
  items: MangaEntry[];
}

// Un bloc par catégorie dans l'ordre choisi, puis les non classés. Les
// catégories vides restent affichées : sans elles, impossible d'y ranger un
// titre.
export function buildMangaBlocks(
  entries: MangaEntry[],
  grouping: MangaGrouping,
  config: CategoryConfig,
): MangaBlock[] {
  if (grouping === "none")
    return [{ key: "all", label: null, count: entries.length, items: entries }];

  const buckets = new Map<string, MangaEntry[]>(config.categories.map((c) => [c.id, []]));
  buckets.set(UNCLASSIFIED, []);
  for (const entry of entries) {
    const id = mangaCategoryOf(config, entry.mangaId) ?? UNCLASSIFIED;
    buckets.get(id)!.push(entry);
  }

  const blocks = config.categories.map((c) => toBlock(c.id, c.name, buckets.get(c.id)!));
  blocks.push(toBlock(UNCLASSIFIED, UNCLASSIFIED_LABEL, buckets.get(UNCLASSIFIED)!));
  return blocks;
}

function toBlock(key: string, label: string, items: MangaEntry[]): MangaBlock {
  return { key, label, count: items.length, items };
}

/** Retire les affectations dont l'œuvre n'est plus en bibliothèque. */
export function pruneMangaCategories(
  config: CategoryConfig,
  existing: Set<string>,
): CategoryConfig {
  const assign: Record<string, string> = {};
  let changed = false;
  for (const [mangaId, id] of Object.entries(config.assign)) {
    if (existing.has(mangaId)) assign[mangaId] = id;
    else changed = true;
  }
  return changed ? { ...config, assign } : config;
}
