// Tirage d'un canard du bassin. Symetrique de rollRewards() pour les cartes de
// fin de run: le tirage brut passe par le pity avant d'entrer dans le bassin,
// avec ses propres compteurs et ses propres courbes (voir POOL_CURVES).

import { randomVariant } from "@/components/duckRandom";
import type { Variant } from "@/components/duckTypes";
import { dexSnapshot, pityState, savePityState } from "@/lib/duckDex";
import { applyPity, POOL_CURVES } from "./pity";

export function rollPoolDuck(): Variant {
  const state = pityState("pool");
  const { cards, next } = applyPity([randomVariant()], dexSnapshot(), state, POOL_CURVES);
  // applyPity renvoie l'etat inchange tant que le cache du dex est froid
  if (next !== state) savePityState("pool", next);
  return cards[0];
}
