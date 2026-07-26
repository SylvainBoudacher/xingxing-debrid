// Reward draw quality: the 3 casino cards are rolled with the pool's real
// spawn odds, then upgraded according to how well the run went. Each boost
// point rerolls the weakest card and keeps the better of the two, so a good
// run shifts the whole draw upward without ever guaranteeing the jackpot.

import {
  getRarity,
  randomLegendaryVariant,
  randomVariant,
  type Rarity,
} from "@/components/duckRandom";
import type { Variant } from "@/components/duckTypes";
import { dexSnapshot, pityState, savePityState } from "@/lib/duckDex";
import { applyPity } from "./pity";
import { DIFF_MODS, type Difficulty, type Rank, RANK_BOOST } from "./run";

const RARITY_ORDER: Rarity[] = ["common", "uncommon", "rare", "legendary", "mythic", "god"];
const tierOf = (v: Variant) => RARITY_ORDER.indexOf(getRarity(v));

export function rewardBoost(rank: Rank, score: number, difficulty: Difficulty): number {
  return RANK_BOOST[rank] + Math.min(2, Math.floor(score / 4000)) + DIFF_MODS[difficulty].boost;
}

export function rollRewards(rank: Rank, score: number, difficulty: Difficulty): Variant[] {
  const cards = [randomVariant(), randomVariant(), randomVariant()];
  const weakest = () => {
    let w = 0;
    for (let j = 1; j < cards.length; j++) if (tierOf(cards[j]) < tierOf(cards[w])) w = j;
    return w;
  };

  for (let i = 0; i < rewardBoost(rank, score, difficulty); i++) {
    const w = weakest();
    const alt = randomVariant();
    if (tierOf(alt) > tierOf(cards[w])) cards[w] = alt;
  }

  // hard difficulties never deal a plain common
  if (difficulty !== "normal") {
    for (let j = 0; j < cards.length; j++) {
      for (let tries = 0; tierOf(cards[j]) === 0 && tries < 25; tries++) {
        const alt = randomVariant();
        if (tierOf(alt) > 0) cards[j] = alt;
      }
    }
  }

  // rank S guarantees at least one legendary or better
  if (rank === "S" && !cards.some((c) => tierOf(c) >= 3)) {
    const v = randomLegendaryVariant();
    if (Math.random() < 0.07) v.shiny = true;
    cards[weakest()] = v;
  }

  // surviving ouragan pays in shine
  if (difficulty === "ouragan" && !cards.some((c) => c.shiny)) {
    cards[(Math.random() * cards.length) | 0].shiny = true;
  }

  // le pity passe en dernier, pour ne pas ecraser les boosts de rang
  const { cards: final, next } = applyPity(cards, dexSnapshot(), pityState("cards"));
  savePityState("cards", next);
  return final;
}
