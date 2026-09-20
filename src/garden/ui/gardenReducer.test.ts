import { describe, expect, it } from "vitest";
import { LEAF_SLOT_MS } from "../core/leaves";
import { createStarterSave } from "../core/starter";
import { DAY, HOUR, startOfDay } from "../core/time";
import type { GardenSave } from "../core/types";
import { gardenReducer, INITIAL_GARDEN, type GardenState } from "./gardenReducer";

const NOW = 10_000 * LEAF_SLOT_MS + HOUR;

function loaded(tiles: GardenSave["tiles"] = {}): GardenState {
  const save = { ...createStarterSave(), tiles, leaves: { checkedAt: NOW - HOUR } };
  return gardenReducer(INITIAL_GARDEN, { type: "load", save });
}

describe("gardenReducer", () => {
  it("ignore tout tant que rien n'est chargé", () => {
    expect(gardenReducer(INITIAL_GARDEN, { type: "tick", now: NOW })).toBe(INITIAL_GARDEN);
    expect(gardenReducer(INITIAL_GARDEN, { type: "move", from: "1,1", to: "2,2" })).toBe(
      INITIAL_GARDEN,
    );
  });

  it("set remplace la sauvegarde", () => {
    const state = loaded();
    const save = { ...state.save!, plots: [] };
    expect(gardenReducer(state, { type: "set", save }).save).toBe(save);
  });

  it("move applique un déplacement valide et ignore un refus", () => {
    const state = loaded({ "0,1": { kind: "decor", id: "paille" } });
    const moved = gardenReducer(state, { type: "move", from: "0,1", to: "8,0" });
    expect(moved.save!.tiles["8,0"]).toEqual({ kind: "decor", id: "paille" });
    expect(gardenReducer(state, { type: "move", from: "0,1", to: "9,0" })).toBe(state);
  });

  it("tick inscrit les découvertes et incrémente seq", () => {
    const state = loaded({
      "1,1": {
        kind: "plant",
        seed: { species: "cosmos", color: "pink", rarity: "commune" },
        sownAt: NOW - 9 * HOUR,
        watered: [],
      },
    });
    const next = gardenReducer(state, { type: "tick", now: NOW });
    expect(next.discoveries).toEqual({
      seq: 1,
      found: [{ species: "cosmos", color: "pink", rarity: "commune" }],
    });
    expect(next.save!.herbier["cosmos:pink"]).toBeDefined();
    const again = gardenReducer(next, { type: "tick", now: NOW });
    expect(again).toBe(next);
  });

  it("tick fait tomber les feuilles sans toucher aux découvertes", () => {
    const state = loaded();
    const next = gardenReducer(state, { type: "tick", now: NOW + LEAF_SLOT_MS });
    expect(Object.values(next.save!.tiles).some((t) => t?.kind === "leaves")).toBe(true);
    expect(next.discoveries).toBe(state.discoveries);
  });
});

describe("press", () => {
  const flower = { species: "cosmos", color: "pink", rarity: "commune" } as const;
  const withFlower = () => {
    const s = createStarterSave();
    return gardenReducer(INITIAL_GARDEN, {
      type: "load",
      save: { ...s, inventory: { ...s.inventory, basket: [flower] } },
    });
  };

  it("presse la fleur et signale la graine", () => {
    const next = gardenReducer(withFlower(), { type: "press", index: 0, now: 5, rng: () => 0 });
    expect(next.save!.inventory.basket).toHaveLength(0);
    expect(next.pressed).toEqual({ seq: 1, seed: true });
  });

  it("index invalide : état inchangé", () => {
    const state = withFlower();
    expect(gardenReducer(state, { type: "press", index: 4, now: 5, rng: () => 0 })).toBe(state);
  });
});

describe("sachets", () => {
  const withSachets = (lastDailyAt: number, pending: "quotidien"[]): GardenState =>
    gardenReducer(INITIAL_GARDEN, {
      type: "load",
      save: { ...createStarterSave(), sachets: { lastDailyAt, pending } },
    });

  it("ouvre un sachet, range les graines et avance le compteur de lot", () => {
    const state = withSachets(startOfDay(NOW), ["quotidien"]);
    const next = gardenReducer(state, { type: "open-sachet", now: NOW, rng: () => 0.5 });
    expect(next.opened.seq).toBe(1);
    expect(next.opened.seeds).toHaveLength(3);
    expect(next.save!.sachets.pending).toEqual([]);
    expect(next.save!.inventory.seeds).toHaveLength(6);
  });

  it("sans sachet en attente, l'état ne bouge pas", () => {
    const state = withSachets(startOfDay(NOW), []);
    expect(gardenReducer(state, { type: "open-sachet", now: NOW, rng: () => 0.5 })).toBe(state);
  });

  it("le tick crédite le sachet du jour", () => {
    const state = withSachets(startOfDay(NOW) - 2 * DAY, []);
    const next = gardenReducer(state, { type: "tick", now: NOW });
    expect(next.save!.sachets.pending).toHaveLength(2);
  });
});
