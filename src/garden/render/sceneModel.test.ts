import { describe, expect, it } from "vitest";
import { HOUR } from "../core/time";
import { createStarterSave } from "../core/starter";
import type { GardenSave, Interval, TileKey } from "../core/types";
import { buildSceneModel, diffItems, itemKey, type SceneItem } from "./sceneModel";

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
    expect(m.items.get("1,1")!.rarity).toBe("legendaire");
    expect(m.wet.has("1,1")).toBe(true);
  });

  it("transmet la variante au sprite et à la clé", () => {
    const seed = {
      species: "cosmos" as const,
      color: "pink" as const,
      rarity: "rare" as const,
      variant: "doree" as const,
    };
    const save = withTiles({
      "1,1": { kind: "plant", seed, sownAt: NOW - 20 * HOUR, watered: [] },
      "2,1": {
        kind: "plant",
        seed: { ...seed, variant: undefined },
        sownAt: NOW - 20 * HOUR,
        watered: [],
      },
    });
    const m = buildSceneModel(save, NOW, noRain);
    const gold = m.items.get("1,1")!;
    expect(gold.ref).toEqual({ name: "cosmos", color: "pink", variant: "doree" });
    expect(gold.variant).toBe("doree");
    expect(itemKey(gold)).not.toBe(itemKey(m.items.get("2,1")!));
    expect(m.items.get("2,1")!.ref).toEqual({ name: "cosmos", color: "pink" });
  });

  it("une espèce inconnue s'affiche en graine", () => {
    const seed = { species: "pissenlit", color: "yellow", rarity: "commune" } as never;
    const save = withTiles({
      "1,1": { kind: "plant", seed, sownAt: NOW - 20 * HOUR, watered: [] },
    });
    const item = buildSceneModel(save, NOW, noRain).items.get("1,1")!;
    expect(item.ref.name).toBe("graine");
    expect(item.rarity).toBeNull();
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

  it("marque les plantes assoiffées et leur terre sèche", () => {
    const seed = {
      species: "aster" as const,
      color: "violet" as const,
      rarity: "commune" as const,
    };
    const save = withTiles({
      "1,1": { kind: "plant", seed, sownAt: NOW - HOUR, watered: [] },
      "2,1": {
        kind: "plant",
        seed,
        sownAt: NOW - HOUR,
        watered: [{ start: NOW - HOUR, end: NOW + HOUR }],
      },
      "3,1": { kind: "plant", seed, sownAt: NOW - 9 * HOUR, watered: [] },
      "4,1": { kind: "hole", dugAt: NOW },
    });
    const m = buildSceneModel(save, NOW, noRain);
    expect(m.items.get("1,1")!.thirsty).toBe(true);
    expect(m.items.get("2,1")!.thirsty).toBe(false);
    expect(m.items.get("3,1")!.thirsty).toBe(false);
    expect(m.items.get("4,1")!.thirsty).toBe(false);
    expect([...m.dry]).toEqual(["1,1"]);
  });

  it("la pluie désaltère tout le champ", () => {
    const seed = {
      species: "aster" as const,
      color: "violet" as const,
      rarity: "commune" as const,
    };
    const save = withTiles({ "1,1": { kind: "plant", seed, sownAt: NOW - HOUR, watered: [] } });
    const rain = (): Interval[] => [{ start: NOW - HOUR, end: NOW + HOUR }];
    const m = buildSceneModel(save, NOW, rain);
    expect(m.items.get("1,1")!.thirsty).toBe(false);
    expect(m.dry.size).toBe(0);
  });

  it("indique s'il pleut", () => {
    const rain = (): Interval[] => [{ start: NOW - HOUR, end: NOW + HOUR }];
    expect(buildSceneModel(createStarterSave(), NOW, rain).raining).toBe(true);
    expect(buildSceneModel(createStarterSave(), NOW, noRain).raining).toBe(false);
  });
});

describe("diffItems", () => {
  const item = (name: "pousse" | "jeune", thirsty = false): SceneItem => ({
    ref: { name },
    rarity: null,
    variant: null,
    sway: true,
    thirsty,
  });

  it("remplace une plante qui devient assoiffée", () => {
    const prev = new Map<TileKey, SceneItem>([["1,1", item("pousse")]]);
    const next = new Map<TileKey, SceneItem>([["1,1", item("pousse", true)]]);
    expect(diffItems(prev, next)).toEqual({ remove: ["1,1"], add: ["1,1"] });
  });

  it("retire, ajoute et remplace seulement ce qui change", () => {
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
