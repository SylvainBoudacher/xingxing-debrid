import { LETTERBOXD_TOP } from "@/lib/data/letterboxdTop";
import { TMDB_PAGE_SIZE } from "@/lib/roulettePool";
import type { RarityScale } from "@/lib/rouletteRarity";
import { mapTmdb, type TmdbItem } from "@/lib/tmdbItem";

// Trois viviers possibles : le catalogue TMDB filtre par genres, le haut du
// classement Letterboxd servi depuis le bundle, ou le bas du classement TMDB.
// Les deux classements sont exclusifs du filtre par genres : ce sont deja des
// selections, les recouper les viderait.
export type RouletteSource = "tmdb" | "letterboxd" | "worst";

export const LETTERBOXD_POOL_SIZE = 200;
export const WORST_POOL_SIZE = 200;

// Le vivier des pires tient en WORST_POOL_SIZE / TMDB_PAGE_SIZE pages. Le
// tirage en charge deux consecutives : partir au-dela de l'avant-derniere
// depasserait le classement.
export const WORST_MAX_PAGE = WORST_POOL_SIZE / TMDB_PAGE_SIZE - 1;

// Seul le catalogue brut se filtre par genres : les deux classements sont deja
// des selections.
export function genresApply(source: RouletteSource): boolean {
  return source === "tmdb";
}

// Sur le vivier des pires, c'est la note la plus basse qui vaut le jackpot.
export function scaleOf(source: RouletteSource): RarityScale {
  return source === "worst" ? "worst" : "rating";
}

const TOP = LETTERBOXD_TOP.slice(0, LETTERBOXD_POOL_SIZE);

// Le rang ne tient pas dans TmdbItem : la carte gagnante le relit ici.
const RANKS = new Map(TOP.map((e) => [e.id, e.rank]));

export function letterboxdRank(id: number): number | undefined {
  return RANKS.get(id);
}

export function letterboxdPool(): TmdbItem[] {
  return TOP.map((e) => mapTmdb(e, "movie"));
}
