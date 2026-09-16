import { speciesOf } from "./catalog/species";
import type { Flower, Rarity, Seed } from "./types";

export type Rng = () => number;

export const pickSeedChance = (beautiful: boolean): number => (beautiful ? 0.45 : 0.3);

// Provisoire : le tirage complet des graines arrive avec les sachets (sous-projet 4).
export function rollPickSeed(flower: Flower, beautiful: boolean, rng: Rng): Seed | null {
  if (rng() >= pickSeedChance(beautiful)) return null;
  return { species: flower.species, color: flower.color, rarity: flower.rarity };
}

export const pressSeedChance = 0.35;

export const RARITY_WEIGHT: Record<Rarity, number> = {
  commune: 60,
  rare: 25,
  epique: 12,
  legendaire: 3,
};

// Graine d'une autre couleur de la même espèce, pondérée par rareté.
export function rollPressSeed(flower: Flower, rng: Rng): Seed | null {
  if (rng() >= pressSeedChance) return null;
  const others = speciesOf(flower.species).colors.filter((c) => c.color !== flower.color);
  if (!others.length) return null;
  const total = others.reduce((sum, c) => sum + RARITY_WEIGHT[c.rarity], 0);
  let r = rng() * total;
  const pick = others.find((c) => (r -= RARITY_WEIGHT[c.rarity]) < 0) ?? others[others.length - 1];
  return { species: flower.species, color: pick.color, rarity: pick.rarity };
}
