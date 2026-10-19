import { describe, expect, it } from "vitest";
import { ROLL_HARVEST } from "./catalog/rarity";
import { rarityOf } from "./catalog/species";
import { entryKey, rollRarity, rollSeed, seededRng } from "./seeds";

describe("graines", () => {
  it("tire la rareté selon la table", () => {
    expect(rollRarity(ROLL_HARVEST, () => 0)).toBe("commune");
    expect(rollRarity(ROLL_HARVEST, () => 0.999)).toBe("legendaire");
  });

  it("tire une entrée du catalogue de la bonne rareté", () => {
    const s = rollSeed("rare", seededRng(3));
    expect(s.rarity).toBe("rare");
    expect(rarityOf(s.species, s.color)).toBe("rare");
  });

  it("rejoue la même suite pour la même graine", () => {
    const a = seededRng(1),
      b = seededRng(1);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("identifie une entrée par espèce et couleur", () => {
    expect(entryKey("tournesol", "yellow")).toBe("tournesol:yellow");
  });
});
