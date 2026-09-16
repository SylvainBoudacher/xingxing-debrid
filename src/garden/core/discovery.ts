import { growthOf } from "./growth";
import type { ColorId, Flower, GardenSave, SpeciesId } from "./types";
import { rainIntervals, type RainSource } from "./weather";

export const entryId = (species: SpeciesId, color: ColorId): string => `${species}:${color}`;

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
