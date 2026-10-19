import { colorName } from "./catalog/colors";
import { RARITY_LABEL } from "./catalog/rarity";
import { speciesOf } from "./catalog/species";
import type { ChestStack, FlowerStack, PotagerSave, Rarity, Seed, Slot, ToolId } from "./types";

export const STACK = 5;
export { SLOTS } from "./saveGarden";

type Inv = (Slot | null)[];

export const TOOL_LABEL: Record<ToolId, string> = {
  beche: "Bêche",
  arrosoir: "Arrosoir",
  serfouette: "Serfouette",
};

const sameFlower = (s: Slot | ChestStack | null, f: Omit<FlowerStack, "kind" | "count">) =>
  s?.kind === "flowers" &&
  s.species === f.species &&
  s.color === f.color &&
  s.quality === f.quality;

function put(
  inv: Inv,
  fits: (s: Slot | null) => boolean,
  merge: (s: Slot) => Slot,
  fresh: Slot,
): Inv | null {
  const i = inv.findIndex(fits);
  const j = i >= 0 ? i : inv.indexOf(null);
  if (j < 0) return null;
  const out = [...inv];
  out[j] = inv[j] ? merge(inv[j]!) : fresh;
  return out;
}

export const addSeed = (inv: Inv, seed: Seed): Inv | null =>
  put(
    inv,
    (s) => s?.kind === "seeds" && s.rarity === seed.rarity && s.seeds.length < STACK,
    (s) => (s.kind === "seeds" ? { ...s, seeds: [...s.seeds, seed] } : s),
    { kind: "seeds", rarity: seed.rarity, seeds: [seed] },
  );

export const addFlower = (inv: Inv, f: Omit<FlowerStack, "kind" | "count">): Inv | null =>
  put(
    inv,
    (s) => sameFlower(s, f) && (s as FlowerStack).count < STACK,
    (s) => (s.kind === "flowers" ? { ...s, count: s.count + 1 } : s),
    { kind: "flowers", ...f, count: 1 },
  );

// une graine de la pile désignée, ou de la première pile de graines
export function takeSeed(inv: Inv, slotIndex: number): { inv: Inv; seed: Seed } | null {
  const i =
    inv[slotIndex]?.kind === "seeds" ? slotIndex : inv.findIndex((s) => s?.kind === "seeds");
  const pile = inv[i];
  if (i < 0 || pile?.kind !== "seeds") return null;
  const out = [...inv];
  const [seed, ...rest] = pile.seeds;
  out[i] = rest.length ? { ...pile, seeds: rest } : null;
  return { inv: out, seed };
}

export const toolSlot = (inv: Inv, id: ToolId) =>
  inv.findIndex((s) => s?.kind === "tool" && s.tool.id === id);
export const hasTool = (inv: Inv, id: ToolId) => toolSlot(inv, id) >= 0;

export function setWater(inv: Inv, amount: number): Inv {
  return inv.map((s) =>
    s?.kind === "tool" && s.tool.id === "arrosoir"
      ? { ...s, tool: { ...s.tool, water: amount } }
      : s,
  );
}

export const waterLeft = (inv: Inv) => {
  const s = inv[toolSlot(inv, "arrosoir")];
  return s?.kind === "tool" ? (s.tool.water ?? 0) : 0;
};

// outil vers le râtelier ; graines et fleurs fusionnées dans le coffre (piles sans limite)
export function deposit(save: PotagerSave, slotIndex: number): PotagerSave {
  const s = save.inventory[slotIndex];
  if (!s) return save;
  const inventory = [...save.inventory];
  inventory[slotIndex] = null;
  if (s.kind === "tool") return { ...save, inventory, rack: [...save.rack, s.tool] };
  const chest = [...save.chest];
  const i = chest.findIndex((c) =>
    s.kind === "seeds" ? c.kind === "seeds" && c.rarity === s.rarity : sameFlower(c, s),
  );
  if (i < 0) chest.push(s);
  else {
    const c = chest[i];
    chest[i] =
      c.kind === "seeds" && s.kind === "seeds"
        ? { ...c, seeds: [...c.seeds, ...s.seeds] }
        : { ...(c as FlowerStack), count: (c as FlowerStack).count + (s as FlowerStack).count };
  }
  return { ...save, inventory, chest };
}

export function withdrawTool(save: PotagerSave, id: ToolId): PotagerSave | null {
  const r = save.rack.findIndex((t) => t.id === id);
  const free = save.inventory.indexOf(null);
  if (r < 0 || free < 0) return null;
  const inventory = [...save.inventory];
  inventory[free] = { kind: "tool", tool: save.rack[r] };
  return { ...save, inventory, rack: save.rack.filter((_, i) => i !== r) };
}

export function withdrawStack(save: PotagerSave, chestIndex: number): PotagerSave | null {
  const c = save.chest[chestIndex];
  const free = save.inventory.indexOf(null);
  if (!c || free < 0) return null;
  const inventory = [...save.inventory];
  const chest = [...save.chest];
  if (c.kind === "seeds") {
    inventory[free] = { ...c, seeds: c.seeds.slice(0, STACK) };
    const rest = c.seeds.slice(STACK);
    if (rest.length) chest[chestIndex] = { ...c, seeds: rest };
    else chest.splice(chestIndex, 1);
  } else {
    const n = Math.min(STACK, c.count);
    inventory[free] = { ...c, count: n };
    if (c.count > n) chest[chestIndex] = { ...c, count: c.count - n };
    else chest.splice(chestIndex, 1);
  }
  return { ...save, inventory, chest };
}

export interface SlotView {
  kind: Slot["kind"];
  label: string;
  count: number;
  rarity?: Rarity;
  water?: number;
}

// Ce que l'interface affiche : une graine ne montre que sa rareté.
export function slotView(s: Slot | ChestStack): SlotView {
  if (s.kind === "tool")
    return { kind: "tool", label: TOOL_LABEL[s.tool.id], count: 1, water: s.tool.water };
  if (s.kind === "seeds")
    return {
      kind: "seeds",
      label: RARITY_LABEL[s.rarity],
      count: s.seeds.length,
      rarity: s.rarity,
    };
  const sp = speciesOf(s.species);
  return {
    kind: "flowers",
    label: `${sp.name} ${colorName(s.color, sp.feminine)}`,
    count: s.count,
  };
}
