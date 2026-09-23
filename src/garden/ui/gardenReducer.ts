import { collectBrew, startBrew } from "../core/atelier";
import type { RecipeId } from "../core/catalog/recipes";
import type { NodeId } from "../core/catalog/tree";
import { collectDiscoveries } from "../core/discovery";
import { pressFlower } from "../core/herbier";
import { spawnLeaves } from "../core/leaves";
import { planMove } from "../core/move";
import type { Rng } from "../core/rolls";
import { claim, deposit } from "../core/progression";
import { creditDaily, openSachet } from "../core/sachets";
import { sachetsPerDay } from "../core/unlocks";
import type { Flower, GardenSave, SachetType, Seed, SpeciesId, TileKey } from "../core/types";

// Dernier lot ouvert ; seq change à chaque sachet, pour rejouer la révélation.
export interface OpenedLot {
  seq: number;
  seeds: Seed[];
  type: SachetType;
}

export interface GardenState {
  save: GardenSave | null;
  // seq change à chaque lot de découvertes, pour déclencher le toast une seule fois
  discoveries: { seq: number; found: Flower[] };
  pressed: { seq: number; seed: boolean };
  opened: OpenedLot;
  // seq change à chaque nœud récupéré, pour jouer l'éclosion et annoncer la récompense
  claimed: { seq: number; id: NodeId | null };
}

export const INITIAL_GARDEN: GardenState = {
  save: null,
  discoveries: { seq: 0, found: [] },
  pressed: { seq: 0, seed: false },
  opened: { seq: 0, seeds: [], type: "quotidien" },
  claimed: { seq: 0, id: null },
};

export type GardenAction =
  | { type: "load"; save: GardenSave }
  | { type: "set"; save: GardenSave }
  | { type: "move"; from: TileKey; to: TileKey }
  | { type: "tick"; now: number }
  | { type: "press"; index: number; now: number; rng: Rng }
  | { type: "open-sachet"; now: number; rng: Rng }
  | { type: "dev-reveal"; seeds: Seed[] }
  | { type: "claim"; id: NodeId; now: number; rng: Rng }
  | { type: "deposit"; id: NodeId; species: SpeciesId }
  | { type: "brew"; recipe: RecipeId; now: number }
  | { type: "collect-brew"; now: number };

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
    case "claim": {
      const save = claim(state.save, action.id, action.now, action.rng);
      if (!save) return state;
      return { ...state, save, claimed: { seq: state.claimed.seq + 1, id: action.id } };
    }
    case "deposit": {
      const save = deposit(state.save, action.id, action.species);
      return save ? { ...state, save } : state;
    }
    case "brew": {
      const save = startBrew(state.save, action.recipe, action.now);
      return save ? { ...state, save } : state;
    }
    case "collect-brew": {
      const save = collectBrew(state.save, action.now);
      return save ? { ...state, save } : state;
    }
    case "open-sachet": {
      const before = creditDaily(state.save, action.now, sachetsPerDay(state.save));
      const r = openSachet(before, action.rng);
      if (!r) return state;
      return {
        ...state,
        save: r.save,
        opened: {
          seq: state.opened.seq + 1,
          seeds: r.seeds,
          type: before.sachets.pending[0],
        },
      };
    }
    case "dev-reveal": {
      const { inventory } = state.save;
      return {
        ...state,
        save: {
          ...state.save,
          inventory: { ...inventory, seeds: [...inventory.seeds, ...action.seeds] },
        },
        opened: {
          seq: state.opened.seq + 1,
          seeds: action.seeds,
          type: "dore",
        },
      };
    }
    case "tick": {
      const fresh = creditDaily(state.save, action.now, sachetsPerDay(state.save));
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
