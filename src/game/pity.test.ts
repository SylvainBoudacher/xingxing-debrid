import { describe, it, expect, vi, afterEach } from "vitest";
import { BODY_COLOR_LIST, getRarity } from "@/components/duckRandom";
import { SPECIES, speciesOf, variantForSpecies } from "@/components/duckSpecies";
import type { Variant } from "@/components/duckTypes";
import { REWARDS } from "@/lib/duckRewards";
import {
  applyPity,
  dexChance,
  endgameMult,
  EMPTY_PITY,
  isNewShiny,
  isNewToDex,
  shinyChance,
  type DexSnapshot,
} from "./pity";

const S = SPECIES.length;

// un dex complet: toutes les especes, toutes leurs couleurs legales. Construit
// sans Math.random, pour rester utilisable une fois le tirage mocke.
function fullDex(): DexSnapshot {
  const entries: Record<string, string[]> = {};
  for (const s of SPECIES) {
    entries[s.id] =
      s.maxColors === 1
        ? [s.preview.body.toLowerCase()]
        : BODY_COLOR_LIST.filter((c) => speciesOf({ ...s.preview, body: c }) === s.id).map((c) =>
            c.toLowerCase(),
          );
  }
  return { entries, shiny: [] };
}

const emptyDex = (): DexSnapshot => ({ entries: {}, shiny: [] });

// force les tirages de Math.random a reussir ou echouer
function rolls(value: number) {
  vi.spyOn(Math, "random").mockReturnValue(value);
}

afterEach(() => vi.restoreAllMocks());

describe("courbes", () => {
  it("dexChance monte vite puis plafonne a 60%", () => {
    expect(dexChance(0)).toBe(0);
    expect(dexChance(1)).toBeCloseTo(0.21, 2);
    expect(dexChance(3)).toBeCloseTo(0.435, 2);
    expect(dexChance(1000)).toBeCloseTo(0.6, 5);
  });

  it("dexChance est concave: chaque palier rapporte moins que le precedent", () => {
    for (let n = 1; n < 20; n++) {
      expect(dexChance(n + 1) - dexChance(n)).toBeLessThan(dexChance(n) - dexChance(n - 1));
    }
  });

  it("endgameMult vaut 1 quand tout manque et 3 quand tout est pris", () => {
    expect(endgameMult(S)).toBe(1);
    expect(endgameMult(0)).toBe(3);
    expect(endgameMult(1)).toBeGreaterThan(endgameMult(5));
  });

  it("shinyChance part de 3% et plafonne a 15% en debut de collection", () => {
    expect(shinyChance(S, 0)).toBeCloseTo(0.03, 5);
    expect(shinyChance(S, 1000)).toBeCloseTo(0.15, 5);
  });

  it("shinyChance monte bien plus haut en fin de chasse", () => {
    expect(shinyChance(1, 0)).toBeGreaterThan(shinyChance(S, 0));
    expect(shinyChance(1, 8)).toBeGreaterThan(0.4);
    expect(shinyChance(1, 1000)).toBeCloseTo(0.15 * endgameMult(1), 5);
  });

  it("shinyChance croit avec la secheresse pour un avancement donne", () => {
    for (const m of [S, 20, 5, 1]) {
      for (let n = 0; n < 20; n++) expect(shinyChance(m, n + 1)).toBeGreaterThan(shinyChance(m, n));
    }
  });
});

describe("detection de nouveaute", () => {
  const classique = SPECIES.find((s) => s.id === "classique")!;

  it("une espece inconnue est neuve, une couleur deja prise ne l'est pas", () => {
    const v = variantForSpecies(classique);
    expect(isNewToDex(v, {})).toBe(true);
    expect(isNewToDex(v, { classique: [v.body.toLowerCase()] })).toBe(false);
    expect(isNewToDex(v, { classique: ["#ffffff"] })).toBe(true);
  });

  it("les recompenses du Canardex ne comptent jamais comme nouveaute", () => {
    for (const r of REWARDS) {
      const v: Variant = { ...r.variant(), shiny: true };
      expect(isNewToDex(v, {})).toBe(false);
      expect(isNewShiny(v, [])).toBe(false);
    }
  });

  it("un shiny ne compte que si l'espece ne l'a pas deja", () => {
    const v: Variant = { ...variantForSpecies(classique), shiny: true };
    expect(isNewShiny(v, [])).toBe(true);
    expect(isNewShiny(v, ["classique"])).toBe(false);
    expect(isNewShiny({ ...v, shiny: undefined }, [])).toBe(false);
  });
});

describe("applyPity", () => {
  const hand = (): Variant[] => [
    variantForSpecies(SPECIES.find((s) => s.id === "classique")!),
    variantForSpecies(SPECIES.find((s) => s.id === "spots")!),
    variantForSpecies(SPECIES.find((s) => s.id === "halo")!),
  ];

  it("ne touche a rien quand le cache du dex est froid", () => {
    const h = hand();
    const out = applyPity(h, null, { dryDex: 9, dryShiny: 9 });
    expect(out.cards).toBe(h);
    expect(out.next).toEqual({ dryDex: 9, dryShiny: 9 });
  });

  it("ne modifie pas la main d'origine", () => {
    const h = hand();
    const before = JSON.stringify(h);
    rolls(0);
    applyPity(h, fullDex(), { dryDex: 5, dryShiny: 5 });
    expect(JSON.stringify(h)).toBe(before);
  });

  it("remet les compteurs a zero quand la main apporte du neuf", () => {
    const h = hand();
    h[0].shiny = true;
    const { next } = applyPity(h, emptyDex(), { dryDex: 7, dryShiny: 7 });
    expect(next).toEqual({ dryDex: 0, dryShiny: 0 });
  });

  it("incremente les compteurs quand la main n'apporte rien et que le pity echoue", () => {
    rolls(0.99);
    const { next } = applyPity(hand(), fullDex(), { dryDex: 2, dryShiny: 4 });
    expect(next).toEqual({ dryDex: 3, dryShiny: 5 });
  });

  it("cible une espece manquante du meme palier quand le pity dex passe", () => {
    const snap = fullDex();
    // seul le canard a pois manque encore, sur un dex par ailleurs complet
    delete snap.entries.spots;
    rolls(0);
    const { cards, next } = applyPity(hand(), snap, { dryDex: 5, dryShiny: 0 });
    expect(cards.map((c) => speciesOf(c))).toContain("spots");
    expect(next.dryDex).toBe(0);
  });

  it("respecte le palier de rarete de la carte remplacee", () => {
    const snap = emptyDex();
    for (let i = 0; i < 200; i++) {
      const h = hand();
      const before = h.map((c) => getRarity(c));
      rolls(0);
      const { cards } = applyPity(h, snap, { dryDex: 5, dryShiny: 0 });
      expect(cards.map((c) => getRarity(c))).toEqual(before);
    }
  });

  it("n'ameliore qu'une seule carte par main", () => {
    const snap = fullDex();
    // deux especes manquantes, aucune presente dans la main de depart
    delete snap.entries.polka;
    delete snap.entries.stripes;
    rolls(0);
    const { cards } = applyPity(hand(), snap, { dryDex: 9, dryShiny: 0 });
    expect(cards.filter((c) => isNewToDex(c, snap.entries)).length).toBe(1);
  });

  it("ne touche a rien quand le dex est complet, mais continue de compter", () => {
    const snap = fullDex();
    const before = hand();
    rolls(0);
    const { cards, next } = applyPity(before, snap, { dryDex: 9, dryShiny: 0 });
    expect(cards.map((c) => speciesOf(c))).toEqual(before.map((c) => speciesOf(c)));
    expect(next.dryDex).toBe(10);
  });

  it("fait briller une carte dont l'espece n'a pas encore son shiny", () => {
    const snap = fullDex();
    rolls(0);
    const { cards, next } = applyPity(hand(), snap, { dryDex: 0, dryShiny: 5 });
    expect(cards.some((c) => isNewShiny(c, snap.shiny))).toBe(true);
    expect(next.dryShiny).toBe(0);
  });

  it("reroute vers une espece sans shiny quand les 3 cartes l'ont deja", () => {
    const snap = fullDex();
    snap.shiny = ["classique", "spots", "halo"];
    rolls(0);
    const { cards, next } = applyPity(hand(), snap, { dryDex: 0, dryShiny: 5 });
    const fresh = cards.filter((c) => isNewShiny(c, snap.shiny));
    expect(fresh.length).toBe(1);
    expect(next.dryShiny).toBe(0);
  });

  it("ne fait rien de plus quand toute la chasse shiny est finie", () => {
    const snap = fullDex();
    snap.shiny = SPECIES.map((s) => s.id);
    rolls(0);
    const { cards, next } = applyPity(hand(), snap, { dryDex: 0, dryShiny: 9 });
    expect(cards.some((c) => c.shiny)).toBe(false);
    expect(next.dryShiny).toBe(10);
  });

  it("EMPTY_PITY demarre a zero", () => {
    expect(EMPTY_PITY).toEqual({ dryDex: 0, dryShiny: 0 });
  });
});
