import { growthOf } from "./growth";
import type { ColorId, Flower, GardenSave, SpeciesId } from "./types";
import { rainIntervals, type RainSource } from "./weather";

export const entryId = (species: SpeciesId, color: ColorId): string => `${species}:${color}`;

// Une entrée déjà tenue en graine ou déjà en terre ne doit pas ressortir comme
// nouveauté : on gaspillerait une remise à zéro de la jauge sans que ça se voie.
export function knownEntries(save: GardenSave): Set<string> {
  const known = new Set(Object.keys(save.herbier));
  for (const seed of save.inventory.seeds) known.add(entryId(seed.species, seed.color));
  for (const tile of Object.values(save.tiles))
    if (tile?.kind === "plant") known.add(entryId(tile.seed.species, tile.seed.color));
  return known;
}

export function collectDiscoveries(
  save: GardenSave,
  now: number,
  rain: RainSource = rainIntervals,
): { save: GardenSave; found: Flower[] } {
  const found: Flower[] = [];
  let herbier = save.herbier;
  for (const tile of Object.values(save.tiles)) {
    if (tile?.kind !== "plant" || growthOf(tile, now, rain).stage < 4) continue;
    const { species, color, rarity, variant } = tile.seed;
    const id = entryId(species, color);
    const prev = herbier[id];
    if (prev && (!variant || prev.variants.includes(variant))) continue;
    if (herbier === save.herbier) herbier = { ...herbier };
    if (prev) {
      herbier[id] = { ...prev, variants: [...prev.variants, variant!] };
    } else {
      herbier[id] = { discoveredAt: now, pressed: 0, variants: variant ? [variant] : [] };
      found.push({ species, color, rarity, ...(variant && { variant }) });
    }
  }
  return herbier === save.herbier ? { save, found } : { save: { ...save, herbier }, found };
}
