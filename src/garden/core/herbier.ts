import { CATALOG_ENTRIES, speciesOf } from "./catalog/species";
import { bump } from "./counters";
import { entryId } from "./discovery";
import { rollPressSeed, type Rng } from "./rolls";
import type { GardenSave, Seed, SpeciesId } from "./types";

export interface Progress {
  found: number;
  total: number;
}

export function pressFlower(
  save: GardenSave,
  index: number,
  now: number,
  rng: Rng,
): { save: GardenSave; seed: Seed | null } | null {
  const { basket, seeds } = save.inventory;
  const flower = basket[index];
  if (!flower) return null;
  const id = entryId(flower.species, flower.color);
  const prev = save.herbier[id] ?? { discoveredAt: now, pressed: 0, variants: [] };
  const seed = rollPressSeed(flower, rng);
  const next: GardenSave = {
    ...save,
    inventory: {
      ...save.inventory,
      basket: basket.filter((_, i) => i !== index),
      seeds: seed ? [...seeds, seed] : seeds,
    },
    herbier: { ...save.herbier, [id]: { ...prev, pressed: prev.pressed + 1 } },
  };
  return { save: bump(next, "pressed"), seed };
}

export function speciesProgress(save: GardenSave, species: SpeciesId): Progress {
  const colors = speciesOf(species).colors;
  return {
    found: colors.filter((c) => save.herbier[entryId(species, c.color)]).length,
    total: colors.length,
  };
}

export function herbierProgress(save: GardenSave): Progress {
  return {
    found: CATALOG_ENTRIES.filter((e) => save.herbier[entryId(e.species, e.color)]).length,
    total: CATALOG_ENTRIES.length,
  };
}

export function latestSpecies(save: GardenSave): SpeciesId {
  let best: { species: SpeciesId; at: number } | null = null;
  for (const e of CATALOG_ENTRIES) {
    const found = save.herbier[entryId(e.species, e.color)];
    if (found && (!best || found.discoveredAt > best.at))
      best = { species: e.species, at: found.discoveredAt };
  }
  return best?.species ?? "tournesol";
}
