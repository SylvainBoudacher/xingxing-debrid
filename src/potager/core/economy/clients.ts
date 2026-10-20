import { RARITIES } from "../catalog/rarity";
import { entriesOfRarity } from "../catalog/species";
import { entryKey, rollRarity } from "../seeds";
import type { Demand, Grade, PotagerSave } from "../types";
import { CLIENT_GAP_MS, CLIENT_LOOKS, DEMAND_WEIGHT } from "./catalog";
import { salePrice } from "./price";

const randInt = (rng: () => number, n: number) => Math.min(n - 1, Math.floor(rng() * n));
const nextGap = (rng: () => number) =>
  CLIENT_GAP_MS[0] + rng() * (CLIENT_GAP_MS[1] - CLIENT_GAP_MS[0]);

export function rollDemand(save: PotagerSave, rng: () => number): Demand | null {
  const found = RARITIES.map((rarity) => ({
    rarity,
    entries: entriesOfRarity(rarity).filter(
      (e) => save.herbier[entryKey(e.species, e.color)]?.announced,
    ),
  })).filter((r) => r.entries.length);
  if (!found.length) return null;
  const total = found.reduce((sum, r) => sum + DEMAND_WEIGHT[r.rarity], 0);
  const table = { commune: 0, rare: 0, epique: 0, legendaire: 0 };
  for (const r of found) table[r.rarity] = DEMAND_WEIGHT[r.rarity] / total;
  const rolled = rollRarity(table, rng);
  const pool = (found.find((r) => r.rarity === rolled) ?? found[found.length - 1]).entries;
  const e = pool[randInt(rng, pool.length)];
  return { species: e.species, color: e.color };
}

export function advanceClients(save: PotagerSave, rng: () => number): PotagerSave {
  const now = save.playTimeMs;
  if (save.client) {
    return save.stall.length ? save : { ...save, client: null, nextClientAt: now + nextGap(rng) };
  }
  if (!save.stall.length || now < save.nextClientAt) return save;
  const demand = rollDemand(save, rng);
  if (!demand) return save;
  return { ...save, client: { demand, look: randInt(rng, CLIENT_LOOKS) } };
}

export function serve(
  save: PotagerSave,
  stallIndex: number,
  ribbon: Grade,
  rng: () => number,
): { save: PotagerSave; gain: number } | null {
  const pile = save.stall[stallIndex];
  if (!save.client || !pile) return null;
  const gain = salePrice(pile, save.client.demand, ribbon);
  const stall =
    pile.count > 1
      ? save.stall.map((p, i) => (i === stallIndex ? { ...p, count: p.count - 1 } : p))
      : save.stall.filter((_, i) => i !== stallIndex);
  return {
    save: {
      ...save,
      stall,
      po: save.po + gain,
      client: null,
      nextClientAt: save.playTimeMs + nextGap(rng),
    },
    gain,
  };
}
