export type ViewMode = "simple" | "detailed";

/** Préférence d'une page : "default" suit le réglage global. */
export type ViewModePref = "default" | ViewMode;

export type ViewPage = "search" | "magnets" | "library";

export const VIEW_MODE_KEYS: Record<ViewPage, string> = {
  search: "search_view_mode",
  magnets: "view_mode",
  library: "library_view_mode",
};

export const DEFAULT_VIEW_MODE_KEY = "default_view_mode";

interface ReadableStore {
  get<T>(key: string): Promise<T | null | undefined>;
}

function resolve(pref: ViewModePref | null | undefined, fallback: ViewMode): ViewMode {
  return pref && pref !== "default" ? pref : fallback;
}

/** Mode effectif d'une seule page (surcharge sinon défaut global). */
export async function resolvePageViewMode(store: ReadableStore, page: ViewPage): Promise<ViewMode> {
  const [def, pref] = await Promise.all([
    store.get<ViewMode>(DEFAULT_VIEW_MODE_KEY),
    store.get<ViewModePref>(VIEW_MODE_KEYS[page]),
  ]);
  return resolve(pref, def ?? "simple");
}

/** Modes effectifs des trois pages, en une seule passe (lecture au démarrage). */
export async function resolveAllViewModes(
  store: ReadableStore,
): Promise<Record<ViewPage, ViewMode>> {
  const [def, search, magnets, library] = await Promise.all([
    store.get<ViewMode>(DEFAULT_VIEW_MODE_KEY),
    store.get<ViewModePref>(VIEW_MODE_KEYS.search),
    store.get<ViewModePref>(VIEW_MODE_KEYS.magnets),
    store.get<ViewModePref>(VIEW_MODE_KEYS.library),
  ]);
  const fallback = def ?? "simple";
  return {
    search: resolve(search, fallback),
    magnets: resolve(magnets, fallback),
    library: resolve(library, fallback),
  };
}
