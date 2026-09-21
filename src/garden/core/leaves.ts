import { hash } from "./hash";
import { fieldTiles } from "./plots";
import { HOUR } from "./time";
import type { GardenSave } from "./types";

export const LEAF_SLOT_MS = 3 * HOUR;
export const MAX_LEAVES = 4;

// Un créneau toutes les 3 h ; chaque créneau écoulé pose un tas sur une case libre
// choisie par hachage, donc identique dans les deux fenêtres.
export function spawnLeaves(save: GardenSave, now: number): GardenSave {
  const current = Math.floor(now / LEAF_SLOT_MS);
  const first = Math.max(
    Math.floor(save.leaves.checkedAt / LEAF_SLOT_MS) + 1,
    current - MAX_LEAVES + 1,
  );
  if (first > current) return save;

  const tiles = { ...save.tiles };
  let count = Object.values(tiles).filter((t) => t?.kind === "leaves").length;
  for (let slot = first; slot <= current && count < MAX_LEAVES; slot++) {
    const free = fieldTiles(save.plots).filter((key) => !tiles[key]);
    if (!free.length) break;
    tiles[free[Math.floor(hash(slot, 17) * free.length)]] = {
      kind: "leaves",
      since: slot * LEAF_SLOT_MS,
    };
    count++;
  }
  return { ...save, tiles, leaves: { checkedAt: current * LEAF_SLOT_MS } };
}
