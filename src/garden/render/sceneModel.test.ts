import { describe, expect, it } from "vitest";
import { HOUR } from "../core/time";
import { createStarterSave } from "../core/starter";
import type { GardenSave, Interval, TileKey } from "../core/types";
import { buildSceneModel, diffItems, type SceneItem } from "./sceneModel";

const noRain = (): Interval[] => [];
const NOW = new Date(2026, 9, 1, 12).getTime();

function withTiles(tiles: GardenSave["tiles"]): GardenSave {
  return { ...createStarterSave(), tiles };
}

describe("buildSceneModel", () => {
  it("traduit chaque étape de pousse en sprite", () => {
    const seed = { species: "dahlia" as const, color: "red" as const, rarity: "commune" as const };
    const save = withTiles({
      "1,1": { kind: "plant", seed, sownAt: NOW, watered: [] },
      "2,1": { kind: "plant", seed, sownAt: NOW - 2 * HOUR, watered: [] },
      "3,1": { kind: "plant", seed, sownAt: NOW - 8 * HOUR, watered: [] },
    });
    const m = buildSceneModel(save, NOW, noRain);
    expect(m.items.get("1,1")!.ref).toEqual({ name: "graine", color: "cream" });
    expect(m.items.get("2,1")!.ref).toEqual({ name: "pousse" });
    expect(m.items.get("3,1")!.ref).toEqual({ name: "dahlia", color: "red" });
    expect(m.items.get("1,1")!.sway).toBe(false);
    expect(m.items.get("3,1")!.sway).toBe(true);
  });

  it("marque les légendaires et les cases mouillées", () => {
    const save = withTiles({
      "1,1": {
        kind: "plant",
        seed: { species: "dahlia", color: "violet", rarity: "legendaire" },
        sownAt: NOW - 40 * HOUR,
        watered: [{ start: NOW - HOUR, end: NOW + HOUR }],
      },
    });
    const m = buildSceneModel(save, NOW, noRain);
    expect(m.items.get("1,1")!.legendary).toBe(true);
    expect(m.wet.has("1,1")).toBe(true);
  });

  it("affiche décor, trous et tas de feuilles, et la terre des parcelles", () => {
    const save = withTiles({
      "0,1": { kind: "decor", id: "lanterne" },
      "2,2": { kind: "hole", dugAt: NOW },
      "0,5": { kind: "leaves", since: NOW },
    });
    const m = buildSceneModel(save, NOW, noRain);
    expect(m.items.get("0,1")!.ref.name).toBe("lanterne");
    expect(m.items.get("2,2")!.ref.name).toBe("trou");
    expect(m.items.get("0,5")!.ref.name).toBe("tas");
    expect(m.soil).toHaveLength(24);
  });

  it("indique s'il pleut", () => {
    const rain = (): Interval[] => [{ start: NOW - HOUR, end: NOW + HOUR }];
    expect(buildSceneModel(createStarterSave(), NOW, rain).raining).toBe(true);
    expect(buildSceneModel(createStarterSave(), NOW, noRain).raining).toBe(false);
  });
});

describe("diffItems", () => {
  it("retire, ajoute et remplace seulement ce qui change", () => {
    const item = (name: "pousse" | "jeune"): SceneItem => ({
      ref: { name },
      legendary: false,
      sway: true,
    });
    const prev = new Map<TileKey, SceneItem>([
      ["1,1", item("pousse")],
      ["2,1", item("pousse")],
    ]);
    const next = new Map<TileKey, SceneItem>([
      ["1,1", item("pousse")],
      ["2,1", item("jeune")],
      ["3,1", item("pousse")],
    ]);
    expect(diffItems(prev, next)).toEqual({ remove: ["2,1"], add: ["2,1", "3,1"] });
    expect(diffItems(next, new Map())).toEqual({ remove: ["1,1", "2,1", "3,1"], add: [] });
  });
});
