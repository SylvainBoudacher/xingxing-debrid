import { parcelCells } from "../cells";
import { addSeed } from "../inventory";
import { rollRarity, rollSeed } from "../seeds";
import type { ChestStack, ParcelId, PotagerSave, Seed, Tool, ToolId } from "../types";
import {
  CHEST_PRICES,
  PARCEL_PRICE,
  SACHET_SIZE,
  SACHETS,
  STALL_PRICES,
  TOOL_UPGRADE_PRICE,
  type SachetId,
} from "./catalog";
import { chestCapacity } from "./stall";

export type Refusal = "po" | "place" | "deja";
type Bought = PotagerSave | { refused: Refusal };

const pay = (save: PotagerSave, price: number): Bought =>
  save.po < price ? { refused: "po" } : { ...save, po: save.po - price };

// graines au sac d'abord, le surplus au coffre (fusion par rareté, nouvelle pile si place)
export function buySachet(
  save: PotagerSave,
  id: SachetId,
  rng: () => number,
): { save: PotagerSave; seeds: Seed[]; toChest: boolean } | { refused: Refusal } {
  const sachet = SACHETS[id];
  if (save.po < sachet.price) return { refused: "po" };
  const seeds = Array.from({ length: SACHET_SIZE }, () =>
    rollSeed(rollRarity(sachet.roll, rng), rng),
  );
  let inventory = save.inventory;
  const chest: ChestStack[] = [...save.chest];
  let toChest = false;
  for (const seed of seeds) {
    const next = addSeed(inventory, seed);
    if (next) {
      inventory = next;
      continue;
    }
    const i = chest.findIndex((c) => c.kind === "seeds" && c.rarity === seed.rarity);
    if (i >= 0) {
      const c = chest[i];
      if (c.kind === "seeds") chest[i] = { ...c, seeds: [...c.seeds, seed] };
    } else if (chest.length < chestCapacity(save))
      chest.push({ kind: "seeds", rarity: seed.rarity, seeds: [seed] });
    else return { refused: "place" };
    toChest = true;
  }
  return { save: { ...save, po: save.po - sachet.price, inventory, chest }, seeds, toChest };
}

export function buyParcel(save: PotagerSave, id: ParcelId): Bought {
  if (save.parcels.includes(id)) return { refused: "deja" };
  const paid = pay(save, PARCEL_PRICE[id]);
  if ("refused" in paid) return paid;
  const cells = { ...paid.cells };
  for (const c of parcelCells(id)) cells[c.key] = { kind: "herbe" };
  return { ...paid, parcels: [...paid.parcels, id], cells };
}

export function buyTool(save: PotagerSave, id: ToolId): Bought {
  const inSlot = save.inventory.findIndex((s) => s?.kind === "tool" && s.tool.id === id);
  const inRack = save.rack.findIndex((t) => t.id === id);
  const slot = save.inventory[inSlot];
  const current = slot?.kind === "tool" ? slot.tool : save.rack[inRack];
  if (!current || current.level === 2) return { refused: "deja" };
  const paid = pay(save, TOOL_UPGRADE_PRICE);
  if ("refused" in paid) return paid;
  const tool: Tool = { ...current, level: 2 };
  if (inSlot >= 0) {
    const inventory = [...paid.inventory];
    inventory[inSlot] = { kind: "tool", tool };
    return { ...paid, inventory };
  }
  return { ...paid, rack: paid.rack.map((t, i) => (i === inRack ? tool : t)) };
}

function upgrade(save: PotagerSave, level: number, prices: number[]) {
  return level >= prices.length ? ({ refused: "deja" } as const) : pay(save, prices[level]);
}

export function buyStallUpgrade(save: PotagerSave): Bought {
  const paid = upgrade(save, save.stallLevel, STALL_PRICES);
  return "refused" in paid ? paid : { ...paid, stallLevel: save.stallLevel + 1 };
}

export function buyChestUpgrade(save: PotagerSave): Bought {
  const paid = upgrade(save, save.chestLevel, CHEST_PRICES);
  return "refused" in paid ? paid : { ...paid, chestLevel: save.chestLevel + 1 };
}
