import type { ForestItemKind, Rarity } from "./types";

// rareté de la graine donnée par un objet ramassé en forêt
export const FOREST_ROLL: Record<ForestItemKind, Record<Rarity, number>> = {
  champignon: { commune: 0.85, rare: 0.13, epique: 0.02, legendaire: 0 },
  gland: { commune: 0.55, rare: 0.33, epique: 0.1, legendaire: 0.02 },
};

export const GLAND_CHANCE = 0.35;
