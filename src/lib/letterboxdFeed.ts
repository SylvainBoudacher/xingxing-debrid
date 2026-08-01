import { LETTERBOXD_TOP } from "@/lib/data/letterboxdTop";
import { mapTmdb, type TmdbItem } from "@/lib/tmdbItem";

// Source "Top Letterboxd" : classement figé, servi depuis le bundle. On le
// découpe en pages pour réutiliser le scroll infini de la grille TMDB.
export const LETTERBOXD_FEED = "letterboxd";
export const LETTERBOXD_COUNT = LETTERBOXD_TOP.length;

const PAGE_SIZE = 20;
export const LETTERBOXD_TOTAL_PAGES = Math.ceil(LETTERBOXD_COUNT / PAGE_SIZE);

export function letterboxdPage(page: number): TmdbItem[] {
  const start = (page - 1) * PAGE_SIZE;
  return LETTERBOXD_TOP.slice(start, start + PAGE_SIZE).map((e) => mapTmdb(e, "movie"));
}
