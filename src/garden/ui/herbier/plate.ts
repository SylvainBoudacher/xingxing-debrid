import { speciesOf } from "../../core/catalog/species";
import { entryId } from "../../core/discovery";
import type { ColorId, GardenSave, HerbierEntry, Rarity, SpeciesId } from "../../core/types";

export const RARITY_ORDER: Rarity[] = ["commune", "rare", "epique", "legendaire"];
const TILTS = [-3, 2, -1, 3, -2, 1];

export interface Specimen {
  color: ColorId;
  rarity: Rarity;
  entry: HerbierEntry | null;
}

// Tri stable : l'ordre du catalogue est gardé à rareté égale.
export function specimensOf(save: GardenSave, species: SpeciesId): Specimen[] {
  return speciesOf(species)
    .colors.map(({ color, rarity }) => ({
      color,
      rarity,
      entry: save.herbier[entryId(species, color)] ?? null,
    }))
    .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
}

export const tiltOf = (index: number): number => TILTS[index % TILTS.length];
