import type { ColorId } from "../catalog/colors";
import { rarityOf, type SpeciesId } from "../catalog/species";
import type { Demand, Grade, Quality } from "../types";
import { BASE_PRICE, BELLE_FACTOR, COLOR_BONUS, RIBBON_BONUS, SPECIES_BONUS } from "./catalog";

export function salePrice(
  flower: { species: SpeciesId; color: ColorId; quality: Quality },
  demand: Demand,
  ribbon: Grade,
): number {
  const base = BASE_PRICE[rarityOf(flower.species, flower.color)!];
  const bonus =
    (flower.species === demand.species ? SPECIES_BONUS : 0) +
    (flower.color === demand.color ? COLOR_BONUS : 0) +
    RIBBON_BONUS[ribbon];
  const raw = base * (flower.quality === "belle" ? BELLE_FACTOR : 1) * (1 + bonus);
  // évite que 269,99999 ou 270,00001 ne bascule d'un cran
  return Math.ceil(Math.round(raw * 1e6) / 1e6);
}
