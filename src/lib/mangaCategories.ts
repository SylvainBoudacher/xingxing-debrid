import { EMPTY_CATEGORIES, type CategoryConfig } from "@/lib/libraryCategories";
import { LazyStore } from "@tauri-apps/plugin-store";

// Catégories des mangas : même structure que celles des films et séries, mais
// stockage séparé (une catégorie ne mélange pas les deux onglets) et
// affectation indexée par mangaId au lieu d'infoHash.
export {
  createCategory,
  deleteCategory,
  moveCategory,
  renameCategory,
  UNCLASSIFIED,
  UNCLASSIFIED_LABEL,
} from "@/lib/libraryCategories";
export type { CategoryConfig, LibraryCategory } from "@/lib/libraryCategories";

const STORE_KEY = "manga_categories";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

let cache: CategoryConfig | null = null;

/** Lecture synchrone : null tant que loadMangaCategories n'a pas résolu. */
export function getCachedMangaCategories(): CategoryConfig | null {
  return cache;
}

export async function loadMangaCategories(): Promise<CategoryConfig> {
  return (cache = (await store.get<CategoryConfig>(STORE_KEY)) ?? EMPTY_CATEGORIES);
}

export async function saveMangaCategories(config: CategoryConfig): Promise<void> {
  cache = config;
  await store.set(STORE_KEY, config);
  await store.save();
}

// categoryId null = retour aux non classés.
export function assignMangas(
  config: CategoryConfig,
  mangaIds: string[],
  categoryId: string | null,
): CategoryConfig {
  const assign = { ...config.assign };
  for (const id of mangaIds) {
    if (categoryId === null) delete assign[id];
    else assign[id] = categoryId;
  }
  return { ...config, assign };
}

export function mangaCategoryOf(config: CategoryConfig, mangaId: string): string | null {
  const id = config.assign[mangaId];
  return id && config.categories.some((c) => c.id === id) ? id : null;
}
