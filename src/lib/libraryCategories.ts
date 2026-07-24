import type { DisplayItem } from "@/lib/library";
import { LazyStore } from "@tauri-apps/plugin-store";

// Catégorie créée par l'utilisateur : son propre "type" de titre, à côté de
// Films / Séries et des genres TMDB.
export interface LibraryCategory {
  id: string;
  name: string;
  createdAt: number;
}

// Un titre appartient à une seule catégorie (c'est un type, pas une étiquette).
// L'affectation est indexée par infoHash : une série regroupée inscrit toutes
// ses saisons pour rester classée quand une nouvelle saison arrive.
export interface CategoryConfig {
  categories: LibraryCategory[];
  assign: Record<string, string>;
}

export const UNCLASSIFIED = "__none__";
export const UNCLASSIFIED_LABEL = "Non classés";

export const EMPTY_CATEGORIES: CategoryConfig = { categories: [], assign: {} };

const STORE_KEY = "library_categories";
const LEGACY_LISTS_KEY = "library_lists";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

interface LegacyList {
  id: string;
  name: string;
  hashes: string[];
  createdAt: number;
}

// Reprend les anciennes listes : chaque liste devient une catégorie. Un titre
// présent dans plusieurs listes rejoint la première (une seule catégorie par
// titre).
export function fromLegacyLists(lists: LegacyList[]): CategoryConfig {
  const assign: Record<string, string> = {};
  for (const l of lists) {
    for (const h of l.hashes) if (!(h in assign)) assign[h] = l.id;
  }
  return {
    categories: lists.map((l) => ({ id: l.id, name: l.name, createdAt: l.createdAt })),
    assign,
  };
}

// Cache mémoire alimenté au lancement (pendant le splash) : le regroupement
// « Personnalisé » s'affiche déjà classé au premier rendu.
let cache: CategoryConfig | null = null;

/** Lecture synchrone : null tant que loadCategories n'a pas résolu. */
export function getCachedCategories(): CategoryConfig | null {
  return cache;
}

export async function loadCategories(): Promise<CategoryConfig> {
  const stored = await store.get<CategoryConfig>(STORE_KEY);
  if (stored) return (cache = stored);
  const legacy = await store.get<LegacyList[]>(LEGACY_LISTS_KEY);
  return (cache = legacy && legacy.length > 0 ? fromLegacyLists(legacy) : EMPTY_CATEGORIES);
}

export async function saveCategories(config: CategoryConfig): Promise<void> {
  cache = config;
  await store.set(STORE_KEY, config);
  await store.delete(LEGACY_LISTS_KEY);
  await store.save();
}

export function createCategory(config: CategoryConfig, name: string): CategoryConfig {
  const trimmed = name.trim();
  if (trimmed === "") return config;
  const category: LibraryCategory = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed,
    createdAt: Date.now(),
  };
  return { ...config, categories: [...config.categories, category] };
}

export function renameCategory(config: CategoryConfig, id: string, name: string): CategoryConfig {
  const trimmed = name.trim();
  if (trimmed === "") return config;
  return {
    ...config,
    categories: config.categories.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
  };
}

// Supprime la catégorie : ses titres redeviennent non classés, ils ne quittent
// jamais la bibliothèque.
export function deleteCategory(config: CategoryConfig, id: string): CategoryConfig {
  const assign: Record<string, string> = {};
  for (const [hash, catId] of Object.entries(config.assign)) {
    if (catId !== id) assign[hash] = catId;
  }
  return { categories: config.categories.filter((c) => c.id !== id), assign };
}

// Déplace la catégorie d'un cran (réordonne les blocs affichés).
export function moveCategory(config: CategoryConfig, id: string, delta: number): CategoryConfig {
  const from = config.categories.findIndex((c) => c.id === id);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= config.categories.length) return config;
  const categories = [...config.categories];
  const [moved] = categories.splice(from, 1);
  categories.splice(to, 0, moved);
  return { ...config, categories };
}

// categoryId null = retour aux non classés.
export function assignHashes(
  config: CategoryConfig,
  hashes: string[],
  categoryId: string | null,
): CategoryConfig {
  const assign = { ...config.assign };
  for (const h of hashes) {
    if (categoryId === null) delete assign[h];
    else assign[h] = categoryId;
  }
  return { ...config, assign };
}

export function itemHashes(item: DisplayItem): string[] {
  return item.type === "group" ? item.group.entries.map((e) => e.infoHash) : [item.entry.infoHash];
}

// Catégorie d'un titre : la première trouvée parmi ses entrées, pour qu'une
// série reste classée même si une saison récente n'a pas encore d'affectation.
export function categoryOf(config: CategoryConfig, item: DisplayItem): string | null {
  for (const h of itemHashes(item)) {
    const id = config.assign[h];
    if (id && config.categories.some((c) => c.id === id)) return id;
  }
  return null;
}

// Retire les affectations dont l'entrée n'existe plus dans la bibliothèque.
export function pruneCategories(config: CategoryConfig, existing: Set<string>): CategoryConfig {
  const assign: Record<string, string> = {};
  let changed = false;
  for (const [hash, id] of Object.entries(config.assign)) {
    if (existing.has(hash)) assign[hash] = id;
    else changed = true;
  }
  return changed ? { ...config, assign } : config;
}

export function categoryCounts(config: CategoryConfig, items: DisplayItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const id = categoryOf(config, item) ?? UNCLASSIFIED;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}
