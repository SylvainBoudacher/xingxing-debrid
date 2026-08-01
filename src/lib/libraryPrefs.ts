import type { GroupMode } from "@/lib/librarySections";
import { LazyStore } from "@tauri-apps/plugin-store";

export type LibraryFilter = "all" | "todo" | "done";
export type LibraryLayout = "list" | "grid";
export type LibrarySort = "manual" | "recent" | "title" | "size" | "progress";

// Réglages d'affichage de la bibliothèque. Lus au lancement (pendant le
// splash) pour que la page s'ouvre déjà triée et rangée, sans recalcul visible.
export interface LibraryPrefs {
  layout: LibraryLayout;
  grouping: GroupMode;
  sort: LibrarySort;
  filter: LibraryFilter;
  genres: string[];
}

export const DEFAULT_LIBRARY_PREFS: LibraryPrefs = {
  layout: "grid",
  grouping: "type",
  sort: "recent",
  filter: "all",
  genres: [],
};

const KEYS = {
  layout: "library_layout",
  grouping: "library_grouping",
  sort: "library_sort",
  filter: "library_filter",
  genres: "library_genres",
  legacySplit: "library_split",
} as const;

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

let cache: LibraryPrefs | null = null;

/** Lecture synchrone : null tant que loadLibraryPrefs n'a pas résolu. */
export function getCachedLibraryPrefs(): LibraryPrefs | null {
  return cache;
}

export async function loadLibraryPrefs(): Promise<LibraryPrefs> {
  const [layout, grouping, sort, filter, genres, legacySplit] = await Promise.all([
    store.get<LibraryLayout>(KEYS.layout),
    store.get<GroupMode>(KEYS.grouping),
    store.get<LibrarySort>(KEYS.sort),
    store.get<LibraryFilter>(KEYS.filter),
    store.get<string[]>(KEYS.genres),
    // Ancien réglage films/séries (booléen) : repli tant que le nouveau mode
    // de regroupement n'a jamais été choisi.
    store.get<boolean>(KEYS.legacySplit),
  ]);

  const legacyGrouping: GroupMode | null =
    legacySplit === null || legacySplit === undefined ? null : legacySplit ? "type" : "none";

  cache = {
    layout: layout ?? DEFAULT_LIBRARY_PREFS.layout,
    grouping: grouping ?? legacyGrouping ?? DEFAULT_LIBRARY_PREFS.grouping,
    sort: sort ?? DEFAULT_LIBRARY_PREFS.sort,
    filter: filter ?? DEFAULT_LIBRARY_PREFS.filter,
    genres: genres ?? DEFAULT_LIBRARY_PREFS.genres,
  };
  return cache;
}

/** Écrit une préférence et met à jour le cache mémoire. */
export function saveLibraryPref<K extends keyof LibraryPrefs>(
  key: K,
  value: LibraryPrefs[K],
): void {
  if (cache) cache = { ...cache, [key]: value };
  void store.set(KEYS[key], value).then(() => store.save());
}
