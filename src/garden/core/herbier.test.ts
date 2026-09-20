import { describe, expect, it } from "vitest";
import { herbierProgress, latestSpecies, pressFlower, speciesProgress } from "./herbier";
import { createStarterSave } from "./starter";
import type { Flower, GardenSave } from "./types";

const NOW = 1_000_000;

const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};
const rose: Flower = { species: "cosmos", color: "pink", rarity: "commune" };
const aster: Flower = { species: "aster", color: "violet", rarity: "commune" };

function withBasket(basket: Flower[], herbier: GardenSave["herbier"] = {}): GardenSave {
  const s = createStarterSave();
  return { ...s, herbier, inventory: { ...s.inventory, basket } };
}

describe("pressFlower", () => {
  it("retire la fleur, compte le spécimen et le geste", () => {
    const save = withBasket([rose, aster], {
      "cosmos:pink": { discoveredAt: 5, pressed: 2, variants: [] },
    });
    const r = pressFlower(save, 0, NOW, () => 0.9)!;
    expect(r.seed).toBeNull();
    expect(r.save.inventory.basket).toEqual([aster]);
    expect(r.save.herbier["cosmos:pink"]).toEqual({ discoveredAt: 5, pressed: 3, variants: [] });
    expect(r.save.progress.counters.pressed).toBe(1);
    expect(r.save.inventory.seeds).toEqual(save.inventory.seeds);
  });

  it("crée l'entrée absente et ajoute la graine tombée", () => {
    // tirage, couleur, variante (aucune)
    const r = pressFlower(withBasket([aster]), 0, NOW, seq(0, 0, 0.5))!;
    expect(r.save.herbier["aster:violet"]).toEqual({ discoveredAt: NOW, pressed: 1, variants: [] });
    expect(r.seed).toEqual({ species: "aster", color: "lilac", rarity: "commune" });
    const { seeds } = r.save.inventory;
    expect(seeds[seeds.length - 1]).toEqual(r.seed);
  });

  it("index invalide : rien", () => {
    expect(pressFlower(withBasket([rose]), 3, NOW, () => 0)).toBeNull();
  });
});

describe("avancement", () => {
  const herbier = {
    "cosmos:pink": { discoveredAt: 10, pressed: 0, variants: [] },
    "cosmos:black": { discoveredAt: 30, pressed: 0, variants: [] },
    "aster:violet": { discoveredAt: 20, pressed: 0, variants: [] },
    "pissenlit:yellow": { discoveredAt: 99, pressed: 0, variants: [] },
    "cosmos:lilac": { discoveredAt: 98, pressed: 0, variants: [] },
  };
  const save = withBasket([], herbier);

  it("par espèce et au total, entrées hors catalogue ignorées", () => {
    expect(speciesProgress(save, "cosmos")).toEqual({ found: 2, total: 6 });
    expect(speciesProgress(save, "sedum")).toEqual({ found: 0, total: 4 });
    expect(herbierProgress(save)).toEqual({ found: 3, total: 65 });
  });

  it("espèce de la dernière découverte, Tournesol par défaut", () => {
    expect(latestSpecies(save)).toBe("cosmos");
    expect(latestSpecies(withBasket([]))).toBe("tournesol");
  });
});
