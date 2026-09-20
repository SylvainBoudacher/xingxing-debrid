import { entriesOfRarity, speciesOf, type CatalogEntry } from "./catalog/species";
import { entryId } from "./discovery";
import { chanceOf, GAUGES } from "./pity";
import type { Flower, Rarity, Seed, VariantId } from "./types";

export type Rng = () => number;

export const pickSeedChance = (beautiful: boolean): number => (beautiful ? 0.45 : 0.3);

export function rollPickSeed(flower: Flower, beautiful: boolean, rng: Rng): Seed | null {
  if (rng() >= pickSeedChance(beautiful)) return null;
  const variant = rollVariant(rng);
  return {
    species: flower.species,
    color: flower.color,
    rarity: flower.rarity,
    ...(variant && { variant }),
  };
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
  const chosen =
    others.find((c) => (r -= RARITY_WEIGHT[c.rarity]) < 0) ?? others[others.length - 1];
  const variant = rollVariant(rng);
  return {
    species: flower.species,
    color: chosen.color,
    rarity: chosen.rarity,
    ...(variant && { variant }),
  };
}

export const VARIANT_CHANCE = 0.02;
const VARIANTS: VariantId[] = ["givree", "doree", "lumineuse"];
const RARITIES: Rarity[] = ["commune", "rare", "epique", "legendaire"];

const pickOne = <T>(list: T[], rng: Rng): T =>
  list[Math.min(list.length - 1, Math.floor(rng() * list.length))];

export function rollVariant(rng: Rng): VariantId | undefined {
  return rng() < VARIANT_CHANCE ? pickOne(VARIANTS, rng) : undefined;
}

function weightedRarity(pool: Rarity[], rng: Rng): Rarity {
  const total = pool.reduce((sum, r) => sum + RARITY_WEIGHT[r], 0);
  let r = rng() * total;
  return pool.find((x) => (r -= RARITY_WEIGHT[x]) < 0) ?? pool[pool.length - 1];
}

export interface PityState {
  dryDiscovery: number;
  dryRare: number;
}

// Rareté d'abord, nouveauté ensuite : la rareté annoncée est celle tirée, sauf en
// fin de collection où la graine est promue vers une rareté qui a encore des inconnues.
export function rollSachetSeed(known: Set<string>, pity: PityState, rng: Rng): Seed {
  let rarity: Rarity =
    rng() < chanceOf(GAUGES.rare, pity.dryRare)
      ? weightedRarity(["rare", "epique", "legendaire"], rng)
      : "commune";

  const unknownOf = (r: Rarity): CatalogEntry[] =>
    entriesOfRarity(r).filter((e) => !known.has(entryId(e.species, e.color)));

  let pool = unknownOf(rarity);
  if (rng() < chanceOf(GAUGES.discovery, pity.dryDiscovery)) {
    if (!pool.length) {
      const left = RARITIES.filter((r) => unknownOf(r).length);
      if (left.length) {
        rarity = weightedRarity(left, rng);
        pool = unknownOf(rarity);
      }
    }
  } else {
    const seen = entriesOfRarity(rarity).filter((e) => known.has(entryId(e.species, e.color)));
    if (seen.length) pool = seen;
  }
  if (!pool.length) pool = entriesOfRarity(rarity);

  const entry = pickOne(pool, rng);
  const variant = rollVariant(rng);
  return { species: entry.species, color: entry.color, rarity, ...(variant && { variant }) };
}
