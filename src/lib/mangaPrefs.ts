import { LazyStore } from "@tauri-apps/plugin-store";

export type MangaFilter = "all" | "todo" | "done";
export type MangaLayout = "list" | "grid";
export type MangaSort = "recent" | "title" | "size";
export type MangaGrouping = "none" | "category";

// Réglages d'affichage de l'onglet Mangas, distincts de ceux des films et
// séries : les deux onglets ne se trient pas de la même façon.
export interface MangaPrefs {
  layout: MangaLayout;
  grouping: MangaGrouping;
  sort: MangaSort;
  filter: MangaFilter;
}

export const DEFAULT_MANGA_PREFS: MangaPrefs = {
  layout: "grid",
  grouping: "none",
  sort: "recent",
  filter: "all",
};

const KEYS = {
  layout: "manga_layout",
  grouping: "manga_grouping",
  sort: "manga_sort",
  filter: "manga_filter",
} as const;

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

let cache: MangaPrefs | null = null;

/** Lecture synchrone : null tant que loadMangaPrefs n'a pas résolu. */
export function getCachedMangaPrefs(): MangaPrefs | null {
  return cache;
}

export async function loadMangaPrefs(): Promise<MangaPrefs> {
  const [layout, grouping, sort, filter] = await Promise.all([
    store.get<MangaLayout>(KEYS.layout),
    store.get<MangaGrouping>(KEYS.grouping),
    store.get<MangaSort>(KEYS.sort),
    store.get<MangaFilter>(KEYS.filter),
  ]);

  cache = {
    layout: layout ?? DEFAULT_MANGA_PREFS.layout,
    grouping: grouping ?? DEFAULT_MANGA_PREFS.grouping,
    sort: sort ?? DEFAULT_MANGA_PREFS.sort,
    filter: filter ?? DEFAULT_MANGA_PREFS.filter,
  };
  return cache;
}

export function saveMangaPref<K extends keyof MangaPrefs>(key: K, value: MangaPrefs[K]): void {
  if (cache) cache = { ...cache, [key]: value };
  void store.set(KEYS[key], value).then(() => store.save());
}
