import { LazyStore } from "@tauri-apps/plugin-store";
import type { Variant } from "@/components/duckTypes";
import { SPECIES, SPECIES_BY_ID, speciesOf, type DuckSpecies } from "@/components/duckSpecies";
import { getSavedDucks } from "./savedDucks";

// Canardex progress: which species were discovered and with which body colors.
// A species is discovered the first time a duck of that species is saved to
// the collection; deleting the duck afterwards keeps the discovery.
export type DexEntries = Record<string, string[]>; // species id -> body colors seen

const store = new LazyStore("duckdex.json", { defaults: {}, autoSave: false });

// In-memory mirror of the entries, so the pool canvas can check a hovered
// duck synchronously inside its draw loop. Refreshed by every read/write.
let cache: DexEntries | null = null;

export async function getDex(): Promise<DexEntries> {
  const entries = (await store.get<DexEntries>("entries")) ?? {};
  cache = entries;
  return entries;
}

// What saving this duck would unlock, or null if it brings nothing new
// (also null before the first store read, when the cache is cold).
export function dexStatusOf(v: Variant): "species" | "color" | null {
  if (!cache) return null;
  const colors = cache[speciesOf(v)];
  if (!colors) return "species";
  return colors.includes(v.body.toLowerCase()) ? null : "color";
}

function merge(entries: DexEntries, v: Variant): "species" | "color" | null {
  const id = speciesOf(v);
  const color = v.body.toLowerCase();
  const colors = entries[id];
  if (!colors) {
    entries[id] = [color];
    return "species";
  }
  if (colors.includes(color)) return null;
  colors.push(color);
  return "color";
}

// What a save unlocked in the dex, so the shop can celebrate progress.
export interface DiscoveryResult {
  species: DuckSpecies;
  newSpecies: boolean;
  newColor: boolean;
  discoveredSpecies: number;
  totalSpecies: number;
  colorCount: number; // colors collected for this species, after the save
}

export async function recordDiscovery(v: Variant): Promise<DiscoveryResult> {
  const entries = await getDex();
  const unlocked = merge(entries, v);
  cache = entries;
  if (unlocked) {
    await store.set("entries", entries);
    await store.save();
  }
  const id = speciesOf(v);
  return {
    species: SPECIES_BY_ID.get(id)!,
    newSpecies: unlocked === "species",
    newColor: unlocked === "color",
    discoveredSpecies: SPECIES.filter((s) => (entries[s.id]?.length ?? 0) > 0).length,
    totalSpecies: SPECIES.length,
    colorCount: entries[id]?.length ?? 0,
  };
}

// Retroactive sync: every duck already in the collection counts as discovered.
export async function syncDexWithCollection(): Promise<DexEntries> {
  const [entries, ducks] = await Promise.all([getDex(), getSavedDucks()]);
  let changed = false;
  for (const d of ducks) changed = merge(entries, d.variant) !== null || changed;
  cache = entries;
  if (changed) {
    await store.set("entries", entries);
    await store.save();
  }
  return entries;
}

export function isDexComplete(entries: DexEntries): boolean {
  return SPECIES.every((s) => (entries[s.id]?.length ?? 0) > 0);
}

// Completion reward: a skin randomVariant() can never roll (galaxy pattern
// with a prismatic shine and a wizard hat).
export const REWARD_DUCK_ID = "canardex-reward";
export const REWARD_DUCK_NAME = "Canard Cosmique";
export function rewardVariant(): Variant {
  return {
    body: "#1B1035",
    beak: "#FFD21E",
    acc: "wizard",
    accColor: "#C9A8FF",
    pattern: "galaxy",
    effect: "prismatic",
  };
}

export async function isRewardClaimed(): Promise<boolean> {
  return (await store.get<boolean>("reward_claimed")) ?? false;
}

export async function markRewardClaimed(): Promise<void> {
  await store.set("reward_claimed", true);
  await store.save();
}
