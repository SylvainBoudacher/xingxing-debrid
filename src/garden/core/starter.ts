import { LEAF_SLOT_MS } from "./leaves";
import type { GardenSave } from "./types";

export function createStarterSave(): GardenSave {
  return {
    version: 1,
    tiles: {
      "0,1": { kind: "decor", id: "lanterne" },
      "7,1": { kind: "decor", id: "lanterne" },
      "8,2": { kind: "decor", id: "citrouille" },
      "8,3": { kind: "decor", id: "paille" },
      "0,4": { kind: "decor", id: "citrouille" },
    },
    plots: ["p1"],
    inventory: {
      seeds: [
        { species: "tournesol", color: "yellow", rarity: "commune" },
        { species: "cosmos", color: "pink", rarity: "commune" },
        { species: "aster", color: "violet", rarity: "commune" },
      ],
      basket: [],
      potions: {},
      decor: {},
    },
    herbier: {},
    pity: { dryDiscovery: 0, dryRare: 0 },
    sachets: { lastDailyAt: 0, pending: 1 },
    progress: { nodes: {}, counters: {} },
    atelier: { brew: null },
    leaves: { checkedAt: Math.floor(Date.now() / LEAF_SLOT_MS) * LEAF_SLOT_MS },
  };
}
