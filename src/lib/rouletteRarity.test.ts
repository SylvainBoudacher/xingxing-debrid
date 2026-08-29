import { describe, it, expect } from "vitest";
import { rarityOf, rarityTiers, type RarityScale } from "./rouletteRarity";

const SCALES: RarityScale[] = ["rating", "worst"];

describe("rarityOf, echelle par note", () => {
  it("classe les notes basses en commun", () => {
    expect(rarityOf(0).rarity).toBe("common");
    expect(rarityOf(5.9).rarity).toBe("common");
  });

  it("bascule en peu commun a 6,0", () => {
    expect(rarityOf(6).rarity).toBe("uncommon");
    expect(rarityOf(6.9).rarity).toBe("uncommon");
  });

  it("bascule en rare a 7,0", () => {
    expect(rarityOf(7).rarity).toBe("rare");
    expect(rarityOf(7.6).rarity).toBe("rare");
  });

  it("bascule en tres rare a 7,7", () => {
    expect(rarityOf(7.7).rarity).toBe("veryRare");
    expect(rarityOf(8.3).rarity).toBe("veryRare");
  });

  it("bascule en exceptionnel a 8,4", () => {
    expect(rarityOf(8.4).rarity).toBe("exceptional");
    expect(rarityOf(10).rarity).toBe("exceptional");
  });
});

describe("rarityOf, echelle des pires", () => {
  it("donne le jackpot au film le plus mal note", () => {
    expect(rarityOf(2.2, "worst").rarity).toBe("exceptional");
    expect(rarityOf(2.2, "worst").label).toBe("Culte");
    expect(rarityOf(3.1, "worst").rarity).toBe("exceptional");
  });

  it("descend en rarete a mesure que la note remonte", () => {
    expect(rarityOf(3.2, "worst").rarity).toBe("veryRare");
    expect(rarityOf(3.8, "worst").rarity).toBe("rare");
    expect(rarityOf(4.2, "worst").rarity).toBe("uncommon");
    expect(rarityOf(4.5, "worst").rarity).toBe("common");
    expect(rarityOf(4.6, "worst").rarity).toBe("common");
  });

  it("inverse bien l'echelle par note sur les memes bornes", () => {
    expect(rarityOf(2.5, "worst").rarity).toBe("exceptional");
    expect(rarityOf(2.5, "rating").rarity).toBe("common");
  });
});

describe("arrondi", () => {
  it("classe sur la note affichee, pas sur la brute", () => {
    // 3,194 s'affiche 3,2 : la pastille et la couleur doivent s'accorder.
    expect(rarityOf(3.194, "worst").rarity).toBe(rarityOf(3.2, "worst").rarity);
    expect(rarityOf(8.396).rarity).toBe(rarityOf(8.4).rarity);
  });
});

describe("rarityTiers", () => {
  it("va du plus commun au plus rare, quelle que soit l'echelle", () => {
    for (const scale of SCALES) {
      expect(rarityTiers(scale).map((t) => t.rarity)).toEqual([
        "common",
        "uncommon",
        "rare",
        "veryRare",
        "exceptional",
      ]);
    }
  });

  it("couvre toutes les notes sans trou ni chevauchement", () => {
    for (const scale of SCALES) {
      for (let n = 0; n <= 10; n += 0.1) {
        const hits = rarityTiers(scale).filter((t) => n >= t.min && n < t.max);
        expect(hits).toHaveLength(1);
      }
    }
  });

  it("annonce le meme palier que rarityOf a chaque borne basse", () => {
    for (const scale of SCALES) {
      for (const t of rarityTiers(scale)) expect(rarityOf(t.min, scale).rarity).toBe(t.rarity);
    }
  });

  it("donne a chaque palier un libelle, une borne et une couleur", () => {
    for (const scale of SCALES) {
      for (const t of rarityTiers(scale)) {
        expect(t.label.length).toBeGreaterThan(0);
        expect(t.bound.length).toBeGreaterThan(0);
        expect(t.color).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });
});
