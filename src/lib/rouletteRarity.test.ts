import { describe, it, expect } from "vitest";
import { rarityOf, RARITY_STYLE, type Rarity } from "./rouletteRarity";

describe("rarityOf", () => {
  it("classe les notes basses en commun", () => {
    expect(rarityOf(0)).toBe("common");
    expect(rarityOf(5.9)).toBe("common");
  });

  it("bascule en peu commun a 6,0", () => {
    expect(rarityOf(6)).toBe("uncommon");
    expect(rarityOf(6.9)).toBe("uncommon");
  });

  it("bascule en rare a 7,0", () => {
    expect(rarityOf(7)).toBe("rare");
    expect(rarityOf(7.6)).toBe("rare");
  });

  it("bascule en tres rare a 7,7", () => {
    expect(rarityOf(7.7)).toBe("veryRare");
    expect(rarityOf(8.3)).toBe("veryRare");
  });

  it("bascule en exceptionnel a 8,4", () => {
    expect(rarityOf(8.4)).toBe("exceptional");
    expect(rarityOf(10)).toBe("exceptional");
  });
});

describe("RARITY_STYLE", () => {
  it("couvre les cinq paliers avec une couleur hexa", () => {
    const tiers: Rarity[] = ["common", "uncommon", "rare", "veryRare", "exceptional"];
    for (const t of tiers) {
      expect(RARITY_STYLE[t].label.length).toBeGreaterThan(0);
      expect(RARITY_STYLE[t].color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
