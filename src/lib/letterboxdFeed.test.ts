import { LETTERBOXD_TOP } from "@/lib/data/letterboxdTop";
import { LETTERBOXD_COUNT, LETTERBOXD_TOTAL_PAGES, letterboxdPage } from "@/lib/letterboxdFeed";
import { describe, expect, it } from "vitest";

describe("snapshot Letterboxd", () => {
  it("contient 500 films sans doublon, classés de 1 à 500", () => {
    expect(LETTERBOXD_COUNT).toBe(500);
    expect(new Set(LETTERBOXD_TOP.map((e) => e.id)).size).toBe(500);
    expect(LETTERBOXD_TOP.map((e) => e.rank)).toEqual(Array.from({ length: 500 }, (_, i) => i + 1));
  });
});

describe("letterboxdPage", () => {
  it("sert les films dans l'ordre du classement", () => {
    const first = letterboxdPage(1);
    expect(first[0].id).toBe(LETTERBOXD_TOP[0].id);
    expect(first[first.length - 1].id).toBe(LETTERBOXD_TOP[first.length - 1].id);
  });

  it("couvre tout le classement sans trou ni chevauchement", () => {
    const all = Array.from({ length: LETTERBOXD_TOTAL_PAGES }, (_, i) => letterboxdPage(i + 1));
    expect(all.flat().map((m) => m.id)).toEqual(LETTERBOXD_TOP.map((e) => e.id));
  });

  it("renvoie une page vide au-delà du classement", () => {
    expect(letterboxdPage(LETTERBOXD_TOTAL_PAGES + 1)).toEqual([]);
  });
});
