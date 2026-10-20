import { speciesOf } from "../core/catalog/species";
import type { Demand, FlowerStack } from "../core/types";
import { flowerName } from "./herbierView";

// « Une Rose rouge » : l'article suit le genre de l'espèce
export const demandLabel = (d: Demand) =>
  `${speciesOf(d.species).feminine ? "Une" : "Un"} ${flowerName(d.species, d.color)}`;

// ce qu'une pile de la réserve a en commun avec la demande
export function matchLabel(pile: FlowerStack, d: Demand): string | null {
  const species = pile.species === d.species;
  const color = pile.color === d.color;
  if (species && color) return "Double bonus";
  if (species) return "Bonne espèce";
  if (color) return "Bonne couleur";
  return null;
}
