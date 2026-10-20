import { STACK } from "../inventory";
import type { FlowerStack, PotagerSave } from "../types";
import { CHEST_SIZES, STALL_SIZES } from "./catalog";

export const stallCapacity = (save: PotagerSave) => STALL_SIZES[save.stallLevel];
export const chestCapacity = (save: PotagerSave) => CHEST_SIZES[save.chestLevel];

const same = (a: FlowerStack, b: FlowerStack) =>
  a.species === b.species && a.color === b.color && a.quality === b.quality;

// la pile du sac complète les piles identiques, le reste ouvre de nouvelles piles
export function stockStall(save: PotagerSave, slotIndex: number): PotagerSave | null {
  const src = save.inventory[slotIndex];
  if (src?.kind !== "flowers") return null;
  let left = src.count;
  const stall = save.stall.map((p) => {
    if (!same(p, src) || p.count >= STACK) return p;
    const add = Math.min(STACK - p.count, left);
    left -= add;
    return { ...p, count: p.count + add };
  });
  while (left > 0) {
    if (stall.length >= stallCapacity(save)) return null;
    const n = Math.min(STACK, left);
    stall.push({ ...src, count: n });
    left -= n;
  }
  const inventory = [...save.inventory];
  inventory[slotIndex] = null;
  return { ...save, inventory, stall };
}

export function unstockStall(save: PotagerSave, stallIndex: number): PotagerSave | null {
  const p = save.stall[stallIndex];
  const free = save.inventory.indexOf(null);
  if (!p || free < 0) return null;
  const inventory = [...save.inventory];
  inventory[free] = p;
  return { ...save, inventory, stall: save.stall.filter((_, i) => i !== stallIndex) };
}
