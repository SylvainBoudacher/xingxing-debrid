import {
  assignMangas,
  createCategory,
  deleteCategory,
  getCachedMangaCategories,
  loadMangaCategories,
  moveCategory,
  renameCategory,
  saveMangaCategories,
  UNCLASSIFIED,
  type CategoryConfig,
} from "@/lib/mangaCategories";
import { EMPTY_CATEGORIES } from "@/lib/libraryCategories";
import { pruneMangaCategories } from "@/lib/mangaSections";
import { useCallback, useEffect, useState } from "react";

// Gestion des catégories manga : lecture au montage puis écritures optimistes,
// l'affichage ne doit pas attendre le store.
export function useMangaCategories(existingIds: Set<string>) {
  const [rawConfig, setConfig] = useState<CategoryConfig>(
    () => getCachedMangaCategories() ?? EMPTY_CATEGORIES,
  );

  useEffect(() => {
    let cancelled = false;
    loadMangaCategories().then((c) => {
      if (!cancelled) setConfig(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const apply = useCallback((next: CategoryConfig) => {
    setConfig(next);
    void saveMangaCategories(next);
  }, []);

  // Les oeuvres retirées de la bibliothèque laisseraient sinon des
  // affectations orphelines : on les élague en dérivé (jamais en setState
  // dans un effet), et l'effet ne fait que persister le résultat.
  const config = existingIds.size === 0 ? rawConfig : pruneMangaCategories(rawConfig, existingIds);

  useEffect(() => {
    if (config !== rawConfig) void saveMangaCategories(config);
  }, [config, rawConfig]);

  return {
    config,
    create: useCallback(
      (name: string, mangaIds: string[] = []) => {
        const next = createCategory(config, name);
        if (next === config) return;
        const created = next.categories[next.categories.length - 1];
        apply(mangaIds.length > 0 ? assignMangas(next, mangaIds, created.id) : next);
      },
      [config, apply],
    ),
    rename: useCallback(
      (id: string, name: string) => apply(renameCategory(config, id, name)),
      [config, apply],
    ),
    remove: useCallback((id: string) => apply(deleteCategory(config, id)), [config, apply]),
    move: useCallback(
      (id: string, delta: number) => apply(moveCategory(config, id, delta)),
      [config, apply],
    ),
    classify: useCallback(
      (mangaIds: string[], categoryId: string) =>
        apply(assignMangas(config, mangaIds, categoryId === UNCLASSIFIED ? null : categoryId)),
      [config, apply],
    ),
  };
}
