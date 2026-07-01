import { LazyStore } from "@tauri-apps/plugin-store";
import type { Variant } from "@/components/duckTypes";
import { SPECIES, SPECIES_BY_ID, speciesOf, type DuckSpecies } from "@/components/duckSpecies";
import { getSavedDucks } from "./savedDucks";

// Canardex progress: which species were discovered and with which body colors.
// A species is discovered the first time a duck of that species is saved to
// the collection; deleting the duck afterwards keeps the discovery.
export type DexEntries = Record<string, string[]>; // species id -> body colors seen
export type ShinyEntries = string[]; // species ids whose shiny version was saved

const store = new LazyStore("duckdex.json", { defaults: {}, autoSave: false });

// In-memory mirror of the entries, so the pool canvas can check a hovered
// duck synchronously inside its draw loop. Refreshed by every read/write.
let cache: DexEntries | null = null;
let shinyCache: ShinyEntries | null = null;

export async function getDex(): Promise<DexEntries> {
  const entries = (await store.get<DexEntries>("entries")) ?? {};
  cache = entries;
  return entries;
}

export async function getShinyDex(): Promise<ShinyEntries> {
  const shiny = (await store.get<ShinyEntries>("shiny")) ?? [];
  shinyCache = shiny;
  return shiny;
}

// What saving this duck would unlock, or null if it brings nothing new
// (also null before the first store read, when the cache is cold).
export function dexStatusOf(v: Variant): "species" | "color" | "shiny" | null {
  if (!cache) return null;
  if (v.effect === "nova" || v.effect === "godly") return null; // rewards unlock nothing

  const id = speciesOf(v);
  if (v.shiny && shinyCache && !shinyCache.includes(id)) return "shiny";
  const colors = cache[id];
  if (!colors) return "species";
  return colors.includes(v.body.toLowerCase()) ? null : "color";
}

function merge(entries: DexEntries, v: Variant): "species" | "color" | null {
  // completion rewards are not species: don't pollute the dex when re-saved
  if (v.effect === "nova" || v.effect === "godly") return null;
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

function mergeShiny(shiny: ShinyEntries, v: Variant): boolean {
  if (!v.shiny || v.effect === "nova" || v.effect === "godly") return false;
  const id = speciesOf(v);
  if (shiny.includes(id)) return false;
  shiny.push(id);
  return true;
}

// What a save unlocked in the dex, so the shop can celebrate progress.
export interface DiscoveryResult {
  species: DuckSpecies;
  newSpecies: boolean;
  newColor: boolean;
  newShiny: boolean;
  discoveredSpecies: number;
  totalSpecies: number;
  colorCount: number; // colors collected for this species, after the save
  shinyCount: number; // species whose shiny version was collected, after the save
}

export async function recordDiscovery(v: Variant): Promise<DiscoveryResult> {
  const [entries, shiny] = await Promise.all([getDex(), getShinyDex()]);
  const unlocked = merge(entries, v);
  const newShiny = mergeShiny(shiny, v);
  cache = entries;
  shinyCache = shiny;
  if (unlocked || newShiny) {
    await store.set("entries", entries);
    await store.set("shiny", shiny);
    await store.save();
  }
  const id = speciesOf(v);
  return {
    species: SPECIES_BY_ID.get(id)!,
    newSpecies: unlocked === "species",
    newColor: unlocked === "color",
    newShiny,
    discoveredSpecies: SPECIES.filter((s) => (entries[s.id]?.length ?? 0) > 0).length,
    totalSpecies: SPECIES.length,
    colorCount: entries[id]?.length ?? 0,
    shinyCount: shiny.length,
  };
}

// Retroactive sync: every duck already in the collection counts as discovered.
export async function syncDexWithCollection(): Promise<DexEntries> {
  const [entries, shiny, ducks] = await Promise.all([getDex(), getShinyDex(), getSavedDucks()]);
  let changed = false;
  for (const d of ducks) {
    changed = merge(entries, d.variant) !== null || changed;
    changed = mergeShiny(shiny, d.variant) || changed;
  }
  cache = entries;
  shinyCache = shiny;
  if (changed) {
    await store.set("entries", entries);
    await store.set("shiny", shiny);
    await store.save();
  }
  return entries;
}

export function isDexComplete(entries: DexEntries): boolean {
  return SPECIES.every((s) => (entries[s.id]?.length ?? 0) > 0);
}

export function isShinyDexComplete(shiny: ShinyEntries): boolean {
  return SPECIES.every((s) => shiny.includes(s.id));
}

// Completion reward: the only mythic besides the king. Its "nova" effect
// (hue-cycling aura, prismatic orbit ring, comets) can never roll randomly.
export const REWARD_DUCK_ID = "canardex-reward";
export const REWARD_DUCK_NAME = "Canard Supernova";
export const REWARD_DUCK_SCALE = 1.15;
export function rewardVariant(): Variant {
  return {
    body: "#1B1035",
    beak: "#FFD21E",
    acc: "halo",
    pattern: "galaxy",
    effect: "nova",
  };
}

// Ultimate reward, unlocked by also collecting the shiny version of every
// species: the god of ducks, in the image of Zeus. Its "godly" effect (divine
// sunburst, storm ring, lightning strikes) can never roll randomly.
export const GOD_DUCK_ID = "canardex-god";
export const GOD_DUCK_NAME = "Zeus, le Dieu Canard";
export const GOD_DUCK_SCALE = 1.7;
export function godVariant(): Variant {
  return {
    body: "#F4EFE4",
    beak: "#E8B93C",
    acc: "laurel",
    effect: "godly",
  };
}

// Dev-only helpers behind the DuckDex debug buttons: mark every species as
// discovered (or shiny-discovered), or wipe the whole dex (including rewards).
export async function debugCompleteDex(): Promise<DexEntries> {
  const entries = await getDex();
  for (const s of SPECIES) merge(entries, s.preview);
  cache = entries;
  await store.set("entries", entries);
  await store.save();
  return entries;
}

export async function debugCompleteShinyDex(): Promise<ShinyEntries> {
  const shiny = await getShinyDex();
  for (const s of SPECIES) if (!shiny.includes(s.id)) shiny.push(s.id);
  shinyCache = shiny;
  await store.set("shiny", shiny);
  await store.save();
  return shiny;
}

export async function debugResetDex(): Promise<void> {
  cache = {};
  shinyCache = [];
  await store.set("entries", {});
  await store.set("shiny", []);
  await store.set("reward_claimed", false);
  await store.set("god_claimed", false);
  await store.save();
}

export async function isRewardClaimed(): Promise<boolean> {
  return (await store.get<boolean>("reward_claimed")) ?? false;
}

export async function markRewardClaimed(): Promise<void> {
  await store.set("reward_claimed", true);
  await store.save();
}

export async function isGodRewardClaimed(): Promise<boolean> {
  return (await store.get<boolean>("god_claimed")) ?? false;
}

export async function markGodRewardClaimed(): Promise<void> {
  await store.set("god_claimed", true);
  await store.save();
}
