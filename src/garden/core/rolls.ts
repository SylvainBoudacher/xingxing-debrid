import type { Flower, Seed } from "./types";

export type Rng = () => number;

export const pickSeedChance = (beautiful: boolean): number => (beautiful ? 0.45 : 0.3);

// Provisoire : le tirage complet des graines arrive avec les sachets (sous-projet 4).
export function rollPickSeed(flower: Flower, beautiful: boolean, rng: Rng): Seed | null {
  if (rng() >= pickSeedChance(beautiful)) return null;
  return { species: flower.species, color: flower.color, rarity: flower.rarity };
}
