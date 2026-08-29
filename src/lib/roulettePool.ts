import type { TmdbRawResult } from "@/lib/services/tmdb";
import { mapTmdb, type TmdbItem } from "@/lib/tmdbItem";

// TMDB rend 20 resultats par page et refuse les pages au-dela de 500 (HTTP 400).
export const TMDB_PAGE_SIZE = 20;
export const TMDB_MAX_PAGE = 500;

// Profondeur du tirage dans le classement par popularite. A 200 pages, la queue
// tourne encore autour de Midnight Express ou Highlander 3 ; c'est plus bas que
// les titres deviennent confidentiels (page 500 : ~300 votes par film). Doit
// rester sous TMDB_MAX_PAGE, la page suivante etant chargee avec.
export const MAX_POOL_PAGE = 200;
// En dessous, le ruban tournerait sur trop peu de films distincts.
export const POOL_MIN = 10;

// maxPage est la profondeur du vivier tire : MAX_POOL_PAGE pour le catalogue,
// bien plus court pour un classement ferme.
export function pickPoolPage(
  totalPages: number,
  random: number = Math.random(),
  maxPage: number = MAX_POOL_PAGE,
): number {
  const max = Math.max(1, Math.min(totalPages, maxPage));
  return Math.min(max, Math.floor(random * max) + 1);
}

// Ce que la roulette peut reellement sortir, page suivante comprise. Le
// total_results de TMDB porte sur tout le catalogue filtre, y compris la part
// que la profondeur du tirage n'atteint jamais : l'annoncer tel quel gonflerait
// le vivier d'un facteur 4.
export function reachablePool(totalPages: number, totalResults: number): number {
  const pages = Math.min(totalPages, MAX_POOL_PAGE + 1);
  return Math.min(totalResults, pages * TMDB_PAGE_SIZE);
}

export function usablePool(results: TmdbRawResult[]): TmdbItem[] {
  return results.filter((r) => !!r.poster_path).map((r) => mapTmdb(r, "movie"));
}
