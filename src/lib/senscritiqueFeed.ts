import { SENSCRITIQUE_TOP } from "@/lib/data/senscritiqueTop";
import { mapManga, type MangaItem } from "@/lib/mangaItem";
import { MANGA_PAGE_SIZE } from "@/lib/services/mangadex";

// Source "Top 100 SensCritique" : classement figé, servi depuis le bundle. On
// le découpe en pages pour réutiliser le scroll infini de la grille manga.
export const SENSCRITIQUE_FEED = "senscritique";
export const SENSCRITIQUE_COUNT = SENSCRITIQUE_TOP.length;

/** Rang au classement, par oeuvre MangaDex. */
export const SENSCRITIQUE_RANKS = new Map(SENSCRITIQUE_TOP.map((e) => [e.manga.id, e.rank]));

export function senscritiquePage(page: number): MangaItem[] {
  const start = page * MANGA_PAGE_SIZE;
  return SENSCRITIQUE_TOP.slice(start, start + MANGA_PAGE_SIZE).map((e) => mapManga(e.manga));
}
