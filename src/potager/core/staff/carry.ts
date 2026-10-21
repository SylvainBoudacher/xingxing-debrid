import { RARITIES } from "../catalog/rarity";
import { chestCapacity } from "../economy/stall";
import { STACK } from "../inventory";
import type { Carry, ChestStack, PotagerSave, Rarity } from "../types";

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

// dépôt borné par la capacité du coffre, comme celui du joueur ; `left` : ce qui n'a pas trouvé de place
export function dropCarry(save: PotagerSave, carry: Carry): { save: PotagerSave; left: Carry } {
  const cap = chestCapacity(save);
  let chest = save.chest;
  const left: Carry = { seeds: [], flowers: [] };
  for (const seed of carry.seeds) {
    const fits =
      chest.length < cap || chest.some((c) => c.kind === "seeds" && c.rarity === seed.rarity);
    if (fits) chest = foldCarry(chest, { seeds: [seed], flowers: [] });
    else left.seeds.push(seed);
  }
  for (const f of carry.flowers) {
    const fits = chest.length < cap || chest.some((c) => sameFlower(c, f));
    if (fits) chest = foldCarry(chest, { seeds: [], flowers: [f] });
    else left.flowers.push(f);
  }
  return { save: chest === save.chest ? save : { ...save, chest }, left };
}

// au plus une pile de graines, de la rareté permise la plus basse
export function takeSeeds(
  save: PotagerSave,
  maxRarity: Rarity,
): { save: PotagerSave; carry: Carry } | null {
  const allowed = RARITIES.slice(0, RARITIES.indexOf(maxRarity) + 1);
  for (const rarity of allowed) {
    const i = save.chest.findIndex((c) => c.kind === "seeds" && c.rarity === rarity);
    const c = save.chest[i];
    if (c?.kind !== "seeds") continue;
    const chest = [...save.chest];
    const rest = c.seeds.slice(STACK);
    if (rest.length) chest[i] = { ...c, seeds: rest };
    else chest.splice(i, 1);
    return { save: { ...save, chest }, carry: { seeds: c.seeds.slice(0, STACK), flowers: [] } };
  }
  return null;
}
