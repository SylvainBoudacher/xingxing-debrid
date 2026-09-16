import { collectDiscoveries } from "../core/discovery";
import { spawnLeaves } from "../core/leaves";
import { planMove } from "../core/move";
import type { Flower, GardenSave, TileKey } from "../core/types";

export interface GardenState {
  save: GardenSave | null;
  // seq change à chaque lot de découvertes, pour déclencher le toast une seule fois
  discoveries: { seq: number; found: Flower[] };
}

export const INITIAL_GARDEN: GardenState = { save: null, discoveries: { seq: 0, found: [] } };

export type GardenAction =
  | { type: "load"; save: GardenSave }
  | { type: "set"; save: GardenSave }
  | { type: "move"; from: TileKey; to: TileKey }
  | { type: "tick"; now: number };

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
    case "tick": {
      const { save, found } = collectDiscoveries(spawnLeaves(state.save, action.now), action.now);
      if (save === state.save) return state;
      return {
        save,
        discoveries: found.length ? { seq: state.discoveries.seq + 1, found } : state.discoveries,
      };
    }
  }
}
