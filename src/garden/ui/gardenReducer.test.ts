import { describe, expect, it } from "vitest";
import { LEAF_SLOT_MS } from "../core/leaves";
import { createStarterSave } from "../core/starter";
import { HOUR } from "../core/time";
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
