import { describe, expect, it } from "vitest";
import { pickSeedChance, rollPickSeed } from "./rolls";
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
