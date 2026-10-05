import { GROWTH_MS } from "./growth";
import { LEAF_SLOT_MS } from "./leaves";
import type { GardenSave } from "./types";

// La première graine est déjà en terre : elle éclot pendant la première session.
const FIRST_BLOOM_MS = 5 * 60_000;

export function createStarterSave(): GardenSave {
  const now = Date.now();
  return {
    version: 1,
    tiles: {
      "0,1": { kind: "decor", id: "lanterne" },
      "7,1": { kind: "decor", id: "lanterne" },
      "8,2": { kind: "decor", id: "citrouille" },
      "8,3": { kind: "decor", id: "paille" },
      "0,4": { kind: "decor", id: "citrouille" },
      "3,2": {
        kind: "plant",
        seed: { species: "cosmos", color: "white", rarity: "commune" },
        sownAt: now - GROWTH_MS.commune + FIRST_BLOOM_MS,
        watered: [],
      },
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
    sachets: { lastDailyAt: 0, pending: ["quotidien", "quotidien"] },
    progress: { nodes: {}, counters: {}, baskets: {} },
    atelier: { brew: null },
    leaves: { checkedAt: Math.floor(now / LEAF_SLOT_MS) * LEAF_SLOT_MS },
  };
}
