import type { Carry, ChestStack } from "../types";

export const EMPTY_CARRY: Carry = { seeds: [], flowers: [] };

const sameFlower = (a: ChestStack, b: Carry["flowers"][number]) =>
  a.kind === "flowers" && a.species === b.species && a.color === b.color && a.quality === b.quality;

// tout ce qui est porté au coffre, sans limite de piles (rien ne se perd à la sauvegarde)
export function foldCarry(chest: ChestStack[], carry: Carry): ChestStack[] {
  const out = [...chest];
  for (const seed of carry.seeds) {
    const i = out.findIndex((c) => c.kind === "seeds" && c.rarity === seed.rarity);
    const c = out[i];
    if (c?.kind === "seeds") out[i] = { ...c, seeds: [...c.seeds, seed] };
    else out.push({ kind: "seeds", rarity: seed.rarity, seeds: [seed] });
  }
  for (const f of carry.flowers) {
    const i = out.findIndex((c) => sameFlower(c, f));
    const c = out[i];
    if (c?.kind === "flowers") out[i] = { ...c, count: c.count + f.count };
    else out.push({ ...f });
  }
  return out;
}
