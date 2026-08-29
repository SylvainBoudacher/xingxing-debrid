import { LETTERBOXD_TOP } from "@/lib/data/letterboxdTop";
import { TMDB_PAGE_SIZE } from "@/lib/roulettePool";
import {
  LETTERBOXD_POOL_SIZE,
  WORST_MAX_PAGE,
  WORST_POOL_SIZE,
  genresApply,
  letterboxdPool,
  letterboxdRank,
  scaleOf,
} from "@/lib/rouletteSource";
import { describe, expect, it } from "vitest";

describe("letterboxdPool", () => {
  it("s'arrete au haut du classement", () => {
    const pool = letterboxdPool();
    expect(pool).toHaveLength(LETTERBOXD_POOL_SIZE);
    expect(pool[0].id).toBe(LETTERBOXD_TOP[0].id);
    expect(pool[LETTERBOXD_POOL_SIZE - 1].id).toBe(LETTERBOXD_TOP[LETTERBOXD_POOL_SIZE - 1].id);
  });

  it("ne sert que des films exploitables par le ruban", () => {
    expect(letterboxdPool().every((m) => m.mediaType === "movie" && m.posterPath)).toBe(true);
  });
});

describe("letterboxdRank", () => {
  it("rend le rang d'un film classe", () => {
    expect(letterboxdRank(LETTERBOXD_TOP[0].id)).toBe(1);
    expect(letterboxdRank(LETTERBOXD_TOP[41].id)).toBe(42);
  });

  it("ignore les films hors du top servi", () => {
    expect(letterboxdRank(LETTERBOXD_TOP[LETTERBOXD_POOL_SIZE].id)).toBeUndefined();
    expect(letterboxdRank(-1)).toBeUndefined();
  });
});

describe("genresApply", () => {
  it("n'autorise les puces que sur le catalogue brut", () => {
    expect(genresApply("tmdb")).toBe(true);
    expect(genresApply("letterboxd")).toBe(false);
    expect(genresApply("worst")).toBe(false);
  });
});

describe("scaleOf", () => {
  it("inverse la rarete sur le vivier des pires uniquement", () => {
    expect(scaleOf("worst")).toBe("worst");
    expect(scaleOf("tmdb")).toBe("rating");
    expect(scaleOf("letterboxd")).toBe("rating");
  });
});

describe("WORST_MAX_PAGE", () => {
  it("garde le tirage, page suivante comprise, dans le classement annonce", () => {
    expect((WORST_MAX_PAGE + 1) * TMDB_PAGE_SIZE).toBe(WORST_POOL_SIZE);
  });
});
