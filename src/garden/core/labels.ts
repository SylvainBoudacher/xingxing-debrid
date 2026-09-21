import { colorName } from "./catalog/colors";
import { isSpeciesId, speciesOf, type HarvestTool } from "./catalog/species";
import type { ColorId, DecorId, Rarity, SpeciesId, Stage, VariantId } from "./types";

export const RARITY_FR: Record<Rarity, string> = {
  commune: "Commune",
  rare: "Rare",
  epique: "Épique",
  legendaire: "Légendaire",
};

export const STAGE_FR: Record<Stage, string> = {
  0: "Graine",
  1: "Pousse",
  2: "Jeune plant",
  3: "Bouton",
  4: "En fleur",
};

export const DECOR_FR: Record<DecorId, string> = {
  lanterne: "Lanterne",
  citrouille: "Citrouille",
  paille: "Botte de paille",
  cloture: "Segment de clôture",
  arbre: "Arbre",
};

// Avec l'article, pour les libellés d'action ("Ranger la lanterne").
export const DECOR_LE: Record<DecorId, string> = {
  lanterne: "la lanterne",
  citrouille: "la citrouille",
  paille: "la botte de paille",
  cloture: "le segment de clôture",
  arbre: "l'arbre",
};

export function flowerName(f: { species: SpeciesId; color: ColorId }): string {
  if (!isSpeciesId(f.species)) return "Fleur inconnue";
  const s = speciesOf(f.species);
  return `${s.name} ${colorName(f.color, s.feminine)}`;
}

export const pickedWord = (species: SpeciesId): string =>
  isSpeciesId(species) && speciesOf(species).feminine ? "cueillie" : "cueilli";

export const VARIANT_FR: Record<VariantId, string> = {
  givree: "Givrée",
  doree: "Dorée",
  lumineuse: "Lumineuse",
};

export const HARVEST_FR: Record<HarvestTool, string> = {
  main: "À la main",
  secateur: "Au sécateur",
};

export const pressedLabel = (n: number): string => `${n} ${n > 1 ? "pressées" : "pressée"}`;

export function formatDuration(ms: number): string {
  const min = Math.max(1, Math.ceil(ms / 60_000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}
