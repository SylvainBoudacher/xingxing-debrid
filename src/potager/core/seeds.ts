import type { ColorId } from "./catalog/colors";
import { RARITIES } from "./catalog/rarity";
import { entriesOfRarity, type SpeciesId } from "./catalog/species";
import type { Rarity, Seed } from "./types";

// Park-Miller : même suite pour une même graine
export function seededRng(seed: number): () => number {
  let s = Math.max(1, Math.floor(seed) % 2147483647);
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function rollRarity(table: Record<Rarity, number>, rng: () => number): Rarity {
  let r = rng();
  for (const rarity of RARITIES) {
    r -= table[rarity];
    if (r < 0) return rarity;
  }
  return RARITIES[RARITIES.length - 1];
}

// espèce et couleur tirées dès l'obtention, cachées jusqu'à l'éclosion
export function rollSeed(rarity: Rarity, rng: () => number): Seed {
  const pool = entriesOfRarity(rarity);
  const e = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
  return { rarity, species: e.species, color: e.color };
}

export const entryKey = (species: SpeciesId, color: ColorId) => `${species}:${color}`;
