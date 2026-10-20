import type { Grade, ParcelId, Rarity } from "../types";

export const BASE_PRICE: Record<Rarity, number> = {
  commune: 5,
  rare: 15,
  epique: 40,
  legendaire: 100,
};
export const BELLE_FACTOR = 1.5;
export const SPECIES_BONUS = 0.3;
export const COLOR_BONUS = 0.3;
export const RIBBON_BONUS: Record<Grade, number> = { parfait: 0.2, bien: 0.1, rate: 0 };

export const DEMAND_WEIGHT: Record<Rarity, number> = {
  commune: 0.6,
  rare: 0.25,
  epique: 0.12,
  legendaire: 0.03,
};
export const CLIENT_GAP_MS: [number, number] = [5_000, 15_000];
export const CLIENT_LOOKS = 4;

export type SachetId = "simple" | "bon" | "luxe";
export const SACHETS: Record<
  SachetId,
  { label: string; price: number; roll: Record<Rarity, number> }
> = {
  simple: {
    label: "Sachet simple",
    price: 15,
    roll: { commune: 0.8, rare: 0.17, epique: 0.03, legendaire: 0 },
  },
  bon: {
    label: "Bon sachet",
    price: 50,
    roll: { commune: 0.45, rare: 0.4, epique: 0.13, legendaire: 0.02 },
  },
  luxe: {
    label: "Sachet de luxe",
    price: 150,
    roll: { commune: 0, rare: 0.55, epique: 0.35, legendaire: 0.1 },
  },
};
export const SACHET_SIZE = 3;

export const PARCEL_PRICE: Record<ParcelId, number> = { p1: 80, p2: 250, p3: 600 };
export const TOOL_UPGRADE_PRICE = 120;

// prix pour passer au niveau suivant
export const STALL_SIZES = [6, 9, 12];
export const STALL_PRICES = [60, 200];
export const CHEST_SIZES = [12, 18, 24];
export const CHEST_PRICES = [80, 250];
