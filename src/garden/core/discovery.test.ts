import { describe, expect, it } from "vitest";
import { collectDiscoveries, entryId, knownEntries } from "./discovery";
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

  it("renvoie la même sauvegarde quand tout est déjà connu et déjà compté", () => {
    const s = withTiles(
      { "1,1": { ...plant(cosmos, 9 * HOUR), bloomedAt: NOW - HOUR } },
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

describe("knownEntries", () => {
  it("réunit l'Herbier, les graines en inventaire et les plantes en terre", () => {
    const base = createStarterSave();
    const save: GardenSave = {
      ...base,
      herbier: { "aster:violet": { discoveredAt: 1, pressed: 0, variants: [] } },
      inventory: {
        ...base.inventory,
        seeds: [{ species: "dahlia", color: "red", rarity: "commune" }],
      },
      tiles: {
        ...base.tiles,
        "1,1": {
          kind: "plant",
          seed: { species: "cosmos", color: "white", rarity: "commune" },
          sownAt: 0,
          watered: [],
        },
      },
    };
    const known = knownEntries(save);
    expect(known.has("aster:violet")).toBe(true);
    expect(known.has("dahlia:red")).toBe(true);
    expect(known.has("cosmos:white")).toBe(true);
    expect(known.has("tournesol:yellow")).toBe(false);
  });
});

describe("comptage des éclosions", () => {
  it("compte chaque plante éclose une seule fois", () => {
    const s = withTiles({
      "1,1": plant(cosmos, 9 * HOUR),
      "2,1": plant(aster, 13 * HOUR),
      "3,1": plant({ ...cosmos, color: "white" }, 1 * HOUR),
    });
    const once = collectDiscoveries(s, NOW, noRain).save;
    expect(once.progress.counters.bloomed).toBe(2);
    expect((once.tiles["1,1"] as PlantTile).bloomedAt).toBe(NOW);
    const twice = collectDiscoveries(once, NOW + HOUR, noRain).save;
    expect(twice.progress.counters.bloomed).toBe(2);
    expect(twice.tiles["1,1"]).toEqual(once.tiles["1,1"]);
  });

  it("compte aussi une éclosion déjà connue de l'Herbier", () => {
    const s = withTiles(
      { "1,1": plant(cosmos, 9 * HOUR) },
      { [entryId("cosmos", "pink")]: { discoveredAt: 1, pressed: 0, variants: [] } },
    );
    const { save, found } = collectDiscoveries(s, NOW, noRain);
    expect(found).toEqual([]);
    expect(save.progress.counters.bloomed).toBe(1);
  });

  it("compte à part les fleurs écloses à partir de 18 h", () => {
    const night = new Date(2026, 9, 1, 19).getTime();
    const s = withTiles({ "1,1": plant(cosmos, 0) });
    const late = {
      ...s,
      tiles: { "1,1": { ...(s.tiles["1,1"] as PlantTile), sownAt: night - 9 * HOUR } },
    };
    const save = collectDiscoveries(late, night, noRain).save;
    expect(save.progress.counters.bloomed).toBe(1);
    expect(save.progress.counters.nightBloom).toBe(1);
  });

  it("ne compte pas la nuit une éclosion de l'après-midi", () => {
    const s = withTiles({ "1,1": plant(cosmos, 9 * HOUR) });
    const save = collectDiscoveries(s, NOW, noRain).save;
    expect(save.progress.counters.nightBloom).toBeUndefined();
  });
});
