import type { TmdbRawResult } from "@/lib/services/tmdb";
import { mapTmdb, type TmdbItem } from "@/lib/tmdbItem";

// TMDB trie par popularite : au-dela de la 15e page on tombe dans des titres
// que personne ne reconnait, ce qui casse le plaisir du tirage.
export const MAX_POOL_PAGE = 15;
// En dessous, le ruban tournerait sur trop peu de films distincts.
export const POOL_MIN = 10;

export function pickPoolPage(totalPages: number, random: number = Math.random()): number {
  const max = Math.max(1, Math.min(totalPages, MAX_POOL_PAGE));
  return Math.min(max, Math.floor(random * max) + 1);
}

export function usablePool(results: TmdbRawResult[]): TmdbItem[] {
  return results.filter((r) => !!r.poster_path).map((r) => mapTmdb(r, "movie"));
}
