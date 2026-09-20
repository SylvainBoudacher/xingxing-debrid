import { collectDiscoveries } from "../core/discovery";
import { pressFlower } from "../core/herbier";
import { spawnLeaves } from "../core/leaves";
import { planMove } from "../core/move";
import type { Rng } from "../core/rolls";
import { creditDaily, openSachet } from "../core/sachets";
import type { Flower, GardenSave, Seed, TileKey } from "../core/types";

export interface GardenState {
  save: GardenSave | null;
  // seq change à chaque lot de découvertes, pour déclencher le toast une seule fois
  discoveries: { seq: number; found: Flower[] };
  pressed: { seq: number; seed: boolean };
  // seq change à chaque sachet ouvert, pour rejouer l'animation de révélation
  opened: { seq: number; seeds: Seed[] };
}

export const INITIAL_GARDEN: GardenState = {
  save: null,
  discoveries: { seq: 0, found: [] },
  pressed: { seq: 0, seed: false },
  opened: { seq: 0, seeds: [] },
};

export type GardenAction =
  | { type: "load"; save: GardenSave }
  | { type: "set"; save: GardenSave }
  | { type: "move"; from: TileKey; to: TileKey }
  | { type: "tick"; now: number }
  | { type: "press"; index: number; now: number; rng: Rng }
  | { type: "open-sachet"; now: number; rng: Rng };

export function gardenReducer(state: GardenState, action: GardenAction): GardenState {
  if (action.type === "load") return { ...state, save: action.save };
  if (!state.save) return state;
  switch (action.type) {
    case "set":
      return { ...state, save: action.save };
    case "move": {
      const r = planMove(state.save, action.from, action.to);
      return r.ok && r.save !== state.save ? { ...state, save: r.save } : state;
    }
    case "press": {
      const r = pressFlower(state.save, action.index, action.now, action.rng);
      if (!r) return state;
      return { ...state, save: r.save, pressed: { seq: state.pressed.seq + 1, seed: !!r.seed } };
    }
    case "open-sachet": {
      const r = openSachet(creditDaily(state.save, action.now), action.rng);
      if (!r) return state;
      return { ...state, save: r.save, opened: { seq: state.opened.seq + 1, seeds: r.seeds } };
    }
    case "tick": {
      const fresh = creditDaily(state.save, action.now);
      const { save, found } = collectDiscoveries(spawnLeaves(fresh, action.now), action.now);
      if (save === state.save) return state;
      return {
        ...state,
        save,
        discoveries: found.length ? { seq: state.discoveries.seq + 1, found } : state.discoveries,
      };
    }
  }
}
