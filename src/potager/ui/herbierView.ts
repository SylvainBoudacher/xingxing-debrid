import { colorName, type ColorId } from "../core/catalog/colors";
import { CATALOG_ENTRIES, speciesOf, type SpeciesId } from "../core/catalog/species";
import { entryKey } from "../core/seeds";
import type { PotagerSave, Rarity } from "../core/types";

export type HerbierItem =
  | { found: true; species: SpeciesId; color: ColorId; name: string; rarity: Rarity; note: string }
  | { found: false; rarity: Rarity };

export const flowerName = (species: SpeciesId, color: ColorId) => {
  const sp = speciesOf(species);
  return `${sp.name} ${colorName(color, sp.feminine)}`;
};

// Une entrée non découverte ne garde que sa rareté (pour le cadre).
export function herbierView(save: PotagerSave) {
  const entries: HerbierItem[] = CATALOG_ENTRIES.map((e) =>
    // découverte seulement une fois l'éclosion montrée au joueur
    save.herbier[entryKey(e.species, e.color)]?.announced
      ? {
          found: true,
          species: e.species,
          color: e.color,
          name: flowerName(e.species, e.color),
          rarity: e.rarity,
          note: speciesOf(e.species).note,
        }
      : { found: false, rarity: e.rarity },
  );
  return { total: entries.length, found: entries.filter((e) => e.found).length, entries };
}
