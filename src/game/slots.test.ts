import { describe, it, expect, vi, afterEach } from "vitest";
import { getRarity } from "@/components/duckRandom";
import { PRIZE_ODDS, SYMBOL_OF_PRIZE, TRIPLE_RATE, rollSlot, type SlotPrize } from "./slots";

afterEach(() => vi.restoreAllMocks());

// Un tirage force: rollSlot consomme Math.random d'abord pour choisir le lot,
// puis pour habiller les rouleaux. Fixer la premiere valeur suffit a cibler un
// lot precis, les suivantes restent aleatoires.
function forcePrize(prize: SlotPrize) {
  const real = Math.random;
  let cursor = 0;
  for (const p of Object.keys(PRIZE_ODDS) as SlotPrize[]) {
    if (p === prize) break;
    cursor += PRIZE_ODDS[p];
  }
  const target = cursor + PRIZE_ODDS[prize] / 2;
  let first = true;
  vi.spyOn(Math, "random").mockImplementation(() => {
    if (!first) return real();
    first = false;
    return target;
  });
}

describe("table des lots", () => {
  it("somme a 1", () => {
    const total = Object.values(PRIZE_ODDS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it("respecte les cotes annoncees", () => {
    expect(PRIZE_ODDS.jackpot).toBe(0.005);
    expect(PRIZE_ODDS.king).toBe(0.01);
    expect(PRIZE_ODDS.legendary).toBe(0.05);
    expect(PRIZE_ODDS.rare).toBe(0.26);
    expect(PRIZE_ODDS.uncommon).toBe(0.33);
    expect(PRIZE_ODDS.none).toBeCloseTo(0.345, 10);
  });
});

describe("rollSlot", () => {
  it("tire chaque lot a sa frequence annoncee", () => {
    const counts: Record<string, number> = {};
    const runs = 200_000;
    for (let i = 0; i < runs; i++) {
      const p = rollSlot(false).prize;
      counts[p] = (counts[p] ?? 0) + 1;
    }
    for (const [prize, odds] of Object.entries(PRIZE_ODDS)) {
      expect((counts[prize] ?? 0) / runs).toBeCloseTo(odds, 2);
    }
  });

  it("le jackpot aligne trois 777", () => {
    forcePrize("jackpot");
    const r = rollSlot(false);
    expect(r.reels).toEqual(["seven", "seven", "seven"]);
    expect(r.jackpotUnlock).toBe(true);
    expect(r.variant).toBeUndefined();
  });

  it("un jackpot deja gagne paie un legendaire shiny", () => {
    forcePrize("jackpot");
    const r = rollSlot(true);
    expect(r.reels).toEqual(["seven", "seven", "seven"]);
    expect(r.jackpotUnlock).toBe(false);
    expect(getRarity(r.variant!)).toBe("legendary");
    expect(r.variant!.shiny).toBe(true);
  });

  it("une perte n'aligne aucune paire et ne donne pas de canard", () => {
    for (let i = 0; i < 2000; i++) {
      const r = rollSlot(false);
      if (r.prize !== "none") continue;
      expect(new Set(r.reels).size).toBe(3);
      expect(r.variant).toBeUndefined();
    }
  });

  it("chaque lot gagnant aligne au moins deux fois son symbole", () => {
    const seen = new Set<SlotPrize>();
    for (let i = 0; i < 20_000 && seen.size < 4; i++) {
      const r = rollSlot(false);
      if (r.prize === "none" || r.prize === "jackpot") continue;
      seen.add(r.prize);
      const symbol = SYMBOL_OF_PRIZE[r.prize];
      expect(r.reels.filter((s) => s === symbol).length).toBeGreaterThanOrEqual(2);
    }
    expect(seen.size).toBe(4);
  });

  it("le symbole de remplissage d'une paire ne cree jamais de seconde paire", () => {
    for (let i = 0; i < 5000; i++) {
      const r = rollSlot(false);
      if (r.prize === "none" || r.prize === "jackpot") continue;
      const symbol = SYMBOL_OF_PRIZE[r.prize];
      const others = r.reels.filter((s) => s !== symbol);
      expect(others.length === 0 || others.length === 1).toBe(true);
    }
  });

  it("trois symboles identiques donnent toujours un shiny, une paire jamais", () => {
    for (let i = 0; i < 5000; i++) {
      const r = rollSlot(false);
      if (r.prize === "none" || r.prize === "jackpot") continue;
      const triple = new Set(r.reels).size === 1;
      expect(!!r.variant!.shiny).toBe(triple);
    }
  });

  it("aligne trois symboles a peu pres une fois sur huit", () => {
    let wins = 0;
    let triples = 0;
    for (let i = 0; i < 100_000; i++) {
      const r = rollSlot(false);
      if (r.prize === "none" || r.prize === "jackpot") continue;
      wins++;
      if (new Set(r.reels).size === 1) triples++;
    }
    expect(triples / wins).toBeCloseTo(TRIPLE_RATE, 2);
  });

  it("paie la rarete correspondant au lot", () => {
    const expected: Partial<Record<SlotPrize, string>> = {
      king: "mythic",
      legendary: "legendary",
      rare: "rare",
      uncommon: "uncommon",
    };
    const seen = new Set<SlotPrize>();
    for (let i = 0; i < 20_000 && seen.size < 4; i++) {
      const r = rollSlot(false);
      const want = expected[r.prize];
      if (!want) continue;
      seen.add(r.prize);
      expect(getRarity(r.variant!)).toBe(want);
    }
    expect(seen.size).toBe(4);
  });
});
