import type { GardenSave } from "./types";

export const SAVE_VERSION = 1;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export function parseSave(raw: unknown): GardenSave | null {
  if (!isObject(raw) || raw.version !== SAVE_VERSION) return null;
  const { tiles, plots, inventory, herbier, pity, sachets, progress, atelier } = raw;
  if (!isObject(tiles) || !Array.isArray(plots)) return null;
  if (!isObject(inventory) || !Array.isArray(inventory.seeds) || !Array.isArray(inventory.basket))
    return null;
  if (!isObject(inventory.potions) || !isObject(inventory.decor)) return null;
  if (!isObject(herbier) || !isObject(pity) || !isObject(sachets)) return null;
  if (!isObject(progress) || !isObject(progress.nodes) || !isObject(progress.counters)) return null;
  if (!isObject(atelier)) return null;
  const leaves =
    isObject(raw.leaves) && typeof raw.leaves.checkedAt === "number"
      ? { checkedAt: raw.leaves.checkedAt }
      : { checkedAt: 0 };
  return { ...(raw as unknown as GardenSave), leaves };
}
