import { SENSCRITIQUE_TOP } from "@/lib/data/senscritiqueTop";
import { SENSCRITIQUE_COUNT, SENSCRITIQUE_RANKS, senscritiquePage } from "@/lib/senscritiqueFeed";
import { MANGA_PAGE_SIZE } from "@/lib/services/mangadex";
import { describe, expect, it } from "vitest";

describe("snapshot SensCritique", () => {
  it("ne contient aucun doublon et se classe sans trou", () => {
    expect(new Set(SENSCRITIQUE_TOP.map((e) => e.manga.id)).size).toBe(SENSCRITIQUE_COUNT);
    expect(SENSCRITIQUE_TOP.map((e) => e.rank)).toEqual(
      Array.from({ length: SENSCRITIQUE_COUNT }, (_, i) => i + 1),
    );
  });

  it("expose une jaquette et un titre pour chaque oeuvre", () => {
    const items = Array.from({ length: totalPages() }, (_, i) => senscritiquePage(i)).flat();
    expect(items.every((i) => i.coverFileName && i.title)).toBe(true);
  });
});

describe("senscritiquePage", () => {
  it("sert les mangas dans l'ordre du classement", () => {
    const first = senscritiquePage(0);
    expect(first).toHaveLength(MANGA_PAGE_SIZE);
    expect(first[0].id).toBe(SENSCRITIQUE_TOP[0].manga.id);
    expect(SENSCRITIQUE_RANKS.get(first[0].id)).toBe(1);
  });

  it("couvre tout le classement sans trou ni chevauchement", () => {
    const all = Array.from({ length: totalPages() }, (_, i) => senscritiquePage(i));
    expect(all.flat().map((m) => m.id)).toEqual(SENSCRITIQUE_TOP.map((e) => e.manga.id));
  });

  it("renvoie une page vide au-dela du classement", () => {
    expect(senscritiquePage(totalPages())).toEqual([]);
  });
});

function totalPages(): number {
  return Math.ceil(SENSCRITIQUE_COUNT / MANGA_PAGE_SIZE);
}
