import { describe, expect, it } from "vitest";
import { collectDiscoveries, entryId } from "./discovery";
import { createStarterSave } from "./starter";
import { HOUR } from "./time";
import type { GardenSave, Interval, PlantTile, Seed } from "./types";

const noRain = (): Interval[] => [];
const NOW = new Date(2026, 9, 1, 12).getTime();

const plant = (seed: Seed, age: number): PlantTile => ({
  kind: "plant",
  seed,
  sownAt: NOW - age,
  watered: [],
});

const cosmos: Seed = { species: "cosmos", color: "pink", rarity: "commune" };
const aster: Seed = { species: "aster", color: "violet", rarity: "rare" };

function withTiles(tiles: GardenSave["tiles"], herbier: GardenSave["herbier"] = {}): GardenSave {
  return { ...createStarterSave(), tiles, herbier };
}

describe("collectDiscoveries", () => {
  it("inscrit les plantes écloses absentes de l'Herbier", () => {
    const s = withTiles({
      "1,1": plant(cosmos, 9 * HOUR),
      "2,1": plant(aster, 13 * HOUR),
      "3,1": plant({ ...cosmos, color: "white" }, 1 * HOUR),
    });
    const { save, found } = collectDiscoveries(s, NOW, noRain);
    expect(found).toEqual([cosmos, aster]);
    expect(save.herbier[entryId("cosmos", "pink")]).toEqual({
      discoveredAt: NOW,
      pressed: 0,
      variants: [],
    });
    expect(save.herbier["cosmos:white"]).toBeUndefined();
    expect(s.herbier).toEqual({});
  });

  it("ne compte qu'une fois deux plantes identiques", () => {
    const s = withTiles({ "1,1": plant(cosmos, 9 * HOUR), "2,1": plant(cosmos, 9 * HOUR) });
    expect(collectDiscoveries(s, NOW, noRain).found).toHaveLength(1);
  });

  it("renvoie la même sauvegarde quand tout est déjà connu", () => {
    const s = withTiles(
      { "1,1": plant(cosmos, 9 * HOUR) },
      { "cosmos:pink": { discoveredAt: 1, pressed: 0, variants: [] } },
    );
    const out = collectDiscoveries(s, NOW, noRain);
    expect(out.save).toBe(s);
    expect(out.found).toEqual([]);
  });

  it("ajoute une variante à une entrée existante sans nouvelle découverte", () => {
    const s = withTiles(
      { "1,1": plant({ ...cosmos, variant: "doree" }, 9 * HOUR) },
      { "cosmos:pink": { discoveredAt: 1, pressed: 2, variants: [] } },
    );
    const out = collectDiscoveries(s, NOW, noRain);
    expect(out.found).toEqual([]);
    expect(out.save.herbier["cosmos:pink"]).toEqual({
      discoveredAt: 1,
      pressed: 2,
      variants: ["doree"],
    });
  });

  it("une nouvelle entrée avec variante la note directement", () => {
    const s = withTiles({ "1,1": plant({ ...cosmos, variant: "givree" }, 9 * HOUR) });
    const out = collectDiscoveries(s, NOW, noRain);
    expect(out.found).toEqual([{ ...cosmos, variant: "givree" }]);
    expect(out.save.herbier["cosmos:pink"].variants).toEqual(["givree"]);
  });
});
