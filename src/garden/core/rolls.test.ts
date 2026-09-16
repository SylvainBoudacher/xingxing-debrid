import { describe, expect, it } from "vitest";
import {
  pickSeedChance,
  pressSeedChance,
  RARITY_WEIGHT,
  rollPickSeed,
  rollPressSeed,
} from "./rolls";
import type { Flower } from "./types";

const flower: Flower = { species: "dahlia", color: "red", rarity: "rare", variant: "doree" };

describe("rollPickSeed", () => {
  it("30 % sans belle plante, 45 % avec", () => {
    expect(pickSeedChance(false)).toBe(0.3);
    expect(pickSeedChance(true)).toBe(0.45);
    expect(rollPickSeed(flower, false, () => 0.29)).not.toBeNull();
    expect(rollPickSeed(flower, false, () => 0.3)).toBeNull();
    expect(rollPickSeed(flower, true, () => 0.44)).not.toBeNull();
    expect(rollPickSeed(flower, true, () => 0.45)).toBeNull();
  });

  it("la graine reprend espèce, couleur et rareté, sans variante", () => {
    expect(rollPickSeed(flower, false, () => 0)).toEqual({
      species: "dahlia",
      color: "red",
      rarity: "rare",
    });
  });
});

const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("rollPressSeed", () => {
  const cosmos: Flower = { species: "cosmos", color: "pink", rarity: "commune" };

  it("35 % de chance", () => {
    expect(pressSeedChance).toBe(0.35);
    expect(rollPressSeed(cosmos, seq(0.34, 0))).not.toBeNull();
    expect(rollPressSeed(cosmos, seq(0.35, 0))).toBeNull();
  });

  it("pondère les autres couleurs par rareté, jamais la couleur pressée", () => {
    // autres couleurs du cosmos : white C 60, red R 25, orange R 25, yellow E 12, black L 3 = 125
    expect(RARITY_WEIGHT).toEqual({ commune: 60, rare: 25, epique: 12, legendaire: 3 });
    expect(rollPressSeed(cosmos, seq(0, 0))).toEqual({
      species: "cosmos",
      color: "white",
      rarity: "commune",
    });
    expect(rollPressSeed(cosmos, seq(0, 60 / 125))).toEqual({
      species: "cosmos",
      color: "red",
      rarity: "rare",
    });
    expect(rollPressSeed(cosmos, seq(0, 0.999))).toEqual({
      species: "cosmos",
      color: "black",
      rarity: "legendaire",
    });
    for (let r = 0; r < 1; r += 0.01)
      expect(rollPressSeed(cosmos, seq(0, r))!.color).not.toBe("pink");
  });

  it("espèce à trois couleurs : toujours une des deux autres", () => {
    const v: Flower = { species: "lanternelune", color: "blue", rarity: "legendaire" };
    const colors = new Set([0, 0.3, 0.6, 0.99].map((r) => rollPressSeed(v, seq(0, r))!.color));
    expect([...colors].sort()).toEqual(["violet", "white"]);
  });
});
