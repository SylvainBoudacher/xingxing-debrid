import { LazyStore } from "@tauri-apps/plugin-store";
import type { Rarity } from "@/components/duckRandom";
import type { Variant } from "@/components/duckTypes";
import { SPECIES, SPECIES_BY_ID, speciesOf, type DuckSpecies } from "@/components/duckSpecies";
import { getSavedDucks } from "./savedDucks";
import { isRewardEffect, REWARDS } from "./duckRewards";
import { EMPTY_PITY, type PityState } from "@/game/pity";

// Canardex progress: which species were discovered and with which body colors.
// A species is discovered the first time a duck of that species is saved to
// the collection; deleting the duck afterwards keeps the discovery.
export type DexEntries = Record<string, string[]>; // species id -> body colors seen
export type ShinyEntries = string[]; // species ids whose shiny version was saved

const store = new LazyStore("duckdex.json", { defaults: {}, autoSave: false });

// Espèces dont le corps peut prendre plusieurs teintes: les seules qui peuvent
// former une "famille complète". Les espèces à apparence fixe seraient
// complètes dès leur découverte et videraient les paliers de leur sens.
export const COLOR_SPECIES = SPECIES.filter((s) => s.maxColors > 1);

export function completedFamilies(entries: DexEntries, rarity?: Rarity): number {
  return COLOR_SPECIES.filter(
    (s) => (!rarity || s.rarity === rarity) && (entries[s.id]?.length ?? 0) >= s.maxColors,
  ).length;
}

// Les trois compteurs de familles que les récompenses de couleurs consomment.
export function familyProgress(entries: DexEntries) {
  return {
    familiesCommon: completedFamilies(entries, "common"),
    familiesUncommon: completedFamilies(entries, "uncommon"),
    familiesRare: completedFamilies(entries, "rare"),
  };
}

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

// Vue synchrone du dex, pour le pity: rollRewards() est appele depuis la boucle
// de jeu et ne peut pas attendre le store. Null tant que rien n'a ete lu.
export function dexSnapshot(): { entries: DexEntries; shiny: ShinyEntries } | null {
  return cache && shinyCache ? { entries: cache, shiny: shinyCache } : null;
}

// Compteurs de secheresse du pity, memes contraintes que le dex: miroir memoire
// lu en synchrone, ecriture differee.
const PITY_KEY = "pity";
let pityCache: PityState = EMPTY_PITY;

export async function loadPityState(): Promise<PityState> {
  pityCache = (await store.get<PityState>(PITY_KEY)) ?? EMPTY_PITY;
  return pityCache;
}

export function pityState(): PityState {
  return pityCache;
}

export function savePityState(next: PityState): void {
  pityCache = next;
  store
    .set(PITY_KEY, next)
    .then(() => store.save())
    .catch(() => {});
}

// What saving this duck would unlock, or null if it brings nothing new
// (also null before the first store read, when the cache is cold).
export function dexStatusOf(v: Variant): "species" | "color" | "shiny" | null {
  if (!cache) return null;
  if (isRewardEffect(v.effect)) return null; // les récompenses ne débloquent rien

  const id = speciesOf(v);
  if (v.shiny && shinyCache && !shinyCache.includes(id)) return "shiny";
  const colors = cache[id];
  if (!colors) return "species";
  return colors.includes(v.body.toLowerCase()) ? null : "color";
}

function merge(entries: DexEntries, v: Variant): "species" | "color" | null {
  // completion rewards are not species: don't pollute the dex when re-saved
  if (isRewardEffect(v.effect)) return null;
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
  if (!v.shiny || isRewardEffect(v.effect)) return false;
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
  familyComplete: boolean; // cette prise vient de compléter les couleurs de l'espèce
  familiesComplete: number; // familles complètes dans la rareté de l'espèce, après la prise
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
  const sp = SPECIES_BY_ID.get(id)!;
  const colorCount = entries[id]?.length ?? 0;
  return {
    species: sp,
    newSpecies: unlocked === "species",
    newColor: unlocked === "color",
    newShiny,
    discoveredSpecies: SPECIES.filter((s) => (entries[s.id]?.length ?? 0) > 0).length,
    totalSpecies: SPECIES.length,
    colorCount,
    shinyCount: shiny.length,
    familyComplete: unlocked === "color" && sp.maxColors > 1 && colorCount === sp.maxColors,
    familiesComplete: completedFamilies(entries, sp.rarity),
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

// Remplit toutes les couleurs des `count` premières espèces colorables de cette
// rareté. Les teintes sont factices: seul leur nombre compte pour les paliers.
export async function debugCompleteFamilies(rarity: Rarity, count: number): Promise<DexEntries> {
  const entries = await getDex();
  for (const s of COLOR_SPECIES.filter((s) => s.rarity === rarity).slice(0, count)) {
    entries[s.id] = Array.from(
      { length: s.maxColors },
      (_, i) => `#0000${i.toString(16).padStart(2, "0")}`,
    );
  }
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
  pityCache = EMPTY_PITY;
  await store.set("entries", {});
  await store.set("shiny", []);
  await store.set(PITY_KEY, EMPTY_PITY);
  for (const r of REWARDS) await store.set(r.storeKey, false);
  await store.save();
}

export async function isClaimed(storeKey: string): Promise<boolean> {
  return (await store.get<boolean>(storeKey)) ?? false;
}

export async function markClaimed(storeKey: string): Promise<void> {
  await store.set(storeKey, true);
  await store.save();
}
