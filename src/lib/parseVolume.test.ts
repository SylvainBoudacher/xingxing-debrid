import { describe, expect, it } from "vitest";
import { parseMangaName, spanLabel, spanSize, volumeFromFileName } from "@/lib/parseVolume";

describe("parseMangaName", () => {
  it("lit une plage entre crochets avec marqueurs de tome", () => {
    const p = parseMangaName("One.Piece.[T01.T105].1997.2025.FR.[CBZ]-CHROMATIQUE");
    expect(p.span).toEqual({ kind: "range", from: 1, to: 105 });
    expect(p.seriesTitle).toBe("One Piece");
    expect(p.format).toBe("CBZ");
  });

  it("lit une plage ecrite en toutes lettres", () => {
    const p = parseMangaName("One.Piece.Tome.[1 à 100].3.HS.Eichiro.Oda.FR.[CBZ]-[PRiNTER]");
    expect(p.span).toEqual({ kind: "range", from: 1, to: 100 });
    expect(p.seriesTitle).toBe("One Piece");
  });

  it("lit une plage placee apres le nom de l'auteur", () => {
    const p = parseMangaName("Berserk.Kentaro.Miura.[1 à 41].FR.[CBZ]-PRiNTER-Paprika+");
    expect(p.span).toEqual({ kind: "range", from: 1, to: 41 });
  });

  it("lit un tome unique note T30", () => {
    const p = parseMangaName("Jujutsu.Kaisen.T30.Akutami.FR.[CBZ]-thor1295");
    expect(p.span).toEqual({ kind: "single", number: 30 });
    expect(p.seriesTitle).toBe("Jujutsu Kaisen");
  });

  it("lit un tome unique note Tome 42", () => {
    const p = parseMangaName("Berserk.Tome.42.Kentaro.Miura.FR.[CBZ]-NOTAG");
    expect(p.span).toEqual({ kind: "single", number: 42 });
    expect(p.seriesTitle).toBe("Berserk");
  });

  it("reconnait une integrale", () => {
    const p = parseMangaName("Naruto.[INTEGRALE].+Gaiden.[CBZ].FR-NOTAG");
    expect(p.span).toEqual({ kind: "complete" });
    expect(p.seriesTitle).toBe("Naruto");
  });

  it("reconnait une collection integrale", () => {
    const p = parseMangaName(
      "L'Attaque.des.Titans.(et.series.derivees).[COLLECTION_INTEGRALE].FR.[CBZ]-NoTAG",
    );
    expect(p.span).toEqual({ kind: "complete" });
  });

  it("detecte les formats autres que CBZ", () => {
    expect(parseMangaName("Jujutsu.Kaisen.[INTEGRALE].FR.[PDF]-NOTAG").format).toBe("PDF");
    expect(parseMangaName("Un.Roman.2026.FR.[EPUB]-G11").format).toBe("EPUB");
  });

  it("ne prend pas une plage d'annees pour une plage de tomes", () => {
    const p = parseMangaName("Asumi.1997.2025.FR.[CBZ]-NOTAG");
    expect(p.span).toBeNull();
  });

  it("ne devine pas de plage sans marqueur ni crochets", () => {
    expect(parseMangaName("Berserk.1.41.FR.[CBZ]-NOTAG").span).toBeNull();
  });

  it("rend un span nul quand aucun tome n'est indique", () => {
    const p = parseMangaName("Asumi.Miura.2021.FR.[CBZ]-NOTAG");
    expect(p.span).toBeNull();
    // Sans marqueur ou couper, le nom entier fait office de titre indicatif.
    expect(p.seriesTitle).toBe("Asumi Miura 2021 FR [CBZ]-NOTAG");
  });
});

describe("volumeFromFileName", () => {
  it("lit les formes courantes", () => {
    expect(volumeFromFileName("One Piece - Tome 03.cbz")).toBe(3);
    expect(volumeFromFileName("One.Piece.T01.cbz")).toBe(1);
    expect(volumeFromFileName("Naruto v12.cbz")).toBe(12);
    expect(volumeFromFileName("Berserk - 42.cbz")).toBe(42);
  });

  it("rend null quand le nom ne porte pas de numero", () => {
    expect(volumeFromFileName("ComicInfo.xml")).toBeNull();
    expect(volumeFromFileName("couverture.jpg")).toBeNull();
  });
});

describe("libelles et taille", () => {
  it("formate les spans", () => {
    expect(spanLabel({ kind: "single", number: 3 })).toBe("Tome 3");
    expect(spanLabel({ kind: "range", from: 1, to: 5 })).toBe("Tomes 1 à 5");
    expect(spanLabel({ kind: "complete" })).toBe("Intégrale");
    expect(spanLabel(null)).toBe("Tome inconnu");
  });

  it("classe l'integrale au-dessus de toute plage", () => {
    expect(spanSize({ kind: "complete" })).toBeGreaterThan(
      spanSize({ kind: "range", from: 1, to: 105 }),
    );
    expect(spanSize({ kind: "range", from: 1, to: 5 })).toBe(5);
    expect(spanSize(null)).toBe(0);
  });
});
