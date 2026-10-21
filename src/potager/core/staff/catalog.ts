import type { StaffId } from "../types";

export const MAISON_PRICE = 150;
export const HIRE_PRICE: Record<StaffId, number> = {
  arroseur: 100,
  jardinier: 250,
  cueilleur: 500,
  fleuriste: 900,
};
export const MAX_LEVEL = 5;

// prix pour passer de `level` à `level + 1`
export const levelPrice = (id: StaffId, level: number) =>
  Math.round(HIRE_PRICE[id] * 1.5 * 1.6 ** (level - 1));

// indice : niveau - 1
export const BIEN_SHARE = [0.4, 0.55, 0.7, 0.85, 1];
// part de la vitesse de l'avatar
export const WALK_SHARE = [0.6, 0.7, 0.8, 0.9, 1];
export const GESTURE_MS = [3000, 2550, 2100, 1650, 1200];

// arrosages d'un arrosoir plein ; fleurs portées par le cueilleur
export const CAN_SIZE = 5;
export const CARRY_FLOWERS = 5;

export const STAFF_LABEL: Record<StaffId, string> = {
  arroseur: "Arroseur",
  jardinier: "Jardinier",
  cueilleur: "Cueilleur",
  fleuriste: "Fleuriste",
};
