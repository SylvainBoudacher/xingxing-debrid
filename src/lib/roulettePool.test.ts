import { describe, it, expect } from "vitest";
import {
  pickPoolPage,
  reachablePool,
  usablePool,
  MAX_POOL_PAGE,
  TMDB_MAX_PAGE,
  TMDB_PAGE_SIZE,
} from "./roulettePool";
import type { TmdbRawResult } from "./services/tmdb";

function raw(id: number, poster: string | null): TmdbRawResult {
  return {
    id,
    title: `Film ${id}`,
    original_title: `Film ${id}`,
    poster_path: poster,
    release_date: "2019-05-02",
    vote_average: 7.4,
    overview: "resume",
    genre_ids: [28],
  };
}

describe("pickPoolPage", () => {
  it("reste dans 1..MAX_POOL_PAGE", () => {
    expect(pickPoolPage(500, 0)).toBe(1);
    expect(pickPoolPage(500, 0.999)).toBe(MAX_POOL_PAGE);
  });

  it("ne depasse jamais le nombre de pages disponibles", () => {
    expect(pickPoolPage(7, 0.999)).toBe(7);
    expect(pickPoolPage(1, 0.999)).toBe(1);
  });

  it("renvoie 1 quand TMDB annonce zero page", () => {
    expect(pickPoolPage(0, 0.5)).toBe(1);
  });

  it("tire toujours une page valide sans random injecte", () => {
    for (let i = 0; i < 200; i++) {
      const p = pickPoolPage(40);
      expect(p).toBeGreaterThanOrEqual(1);
      expect(p).toBeLessThanOrEqual(MAX_POOL_PAGE);
    }
  });
});

describe("MAX_POOL_PAGE", () => {
  it("laisse la place a la page suivante sous le plafond TMDB", () => {
    expect(MAX_POOL_PAGE + 1).toBeLessThanOrEqual(TMDB_MAX_PAGE);
  });
});

describe("reachablePool", () => {
  it("plafonne a la profondeur du tirage, pas au catalogue annonce", () => {
    expect(reachablePool(743, 14843)).toBe((MAX_POOL_PAGE + 1) * TMDB_PAGE_SIZE);
  });

  it("rend le total quand le catalogue tient sous la profondeur", () => {
    expect(reachablePool(18, 346)).toBe(346);
  });

  it("ne compte pas de page vide sur un catalogue minuscule", () => {
    expect(reachablePool(1, 7)).toBe(7);
    expect(reachablePool(0, 0)).toBe(0);
  });
});

describe("usablePool", () => {
  it("ecarte les films sans jaquette", () => {
    const pool = usablePool([raw(1, "/a.jpg"), raw(2, null), raw(3, "/c.jpg")]);
    expect(pool.map((p) => p.id)).toEqual([1, 3]);
  });

  it("mappe vers des TmdbItem de type movie", () => {
    const [item] = usablePool([raw(42, "/a.jpg")]);
    expect(item.mediaType).toBe("movie");
    expect(item.title).toBe("Film 42");
    expect(item.year).toBe("2019");
  });

  it("accepte une liste vide", () => {
    expect(usablePool([])).toEqual([]);
  });
});
