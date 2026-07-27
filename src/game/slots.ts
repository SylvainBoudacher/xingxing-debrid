// Bandit manchot du bassin: un tirage toutes les 4h, paye en canards.
//
// Le lot est tire en premier, les rouleaux sont ensuite construits pour
// l'afficher. Jamais l'inverse: l'animation ne peut pas changer le resultat, et
// toute la mecanique se teste sans DOM.
//
// Regle unique cote joueur: deux symboles identiques donnent un canard de la
// rarete du symbole, trois identiques le donnent en shiny. Le 777 fait
// exception, il exige les trois rouleaux.

import {
  getRarity,
  kingVariant,
  randOf,
  randomLegendaryVariant,
  randomVariant,
  type Rarity,
} from "@/components/duckRandom";
import type { Variant } from "@/components/duckTypes";

export type SlotSymbol = "seven" | "crown" | "golden" | "wizard" | "glasses" | "duckling";

export type SlotPrize = "jackpot" | "king" | "legendary" | "rare" | "uncommon" | "none";

export type Reels = [SlotSymbol, SlotSymbol, SlotSymbol];

export const SYMBOLS: SlotSymbol[] = ["seven", "crown", "golden", "wizard", "glasses", "duckling"];

// Le caneton ne paie jamais: c'est le symbole de remplissage des paires et des
// tirages perdants.
export const SYMBOL_OF_PRIZE: Record<Exclude<SlotPrize, "none">, SlotSymbol> = {
  jackpot: "seven",
  king: "crown",
  legendary: "golden",
  rare: "wizard",
  uncommon: "glasses",
};

export const PRIZE_ODDS: Record<SlotPrize, number> = {
  jackpot: 0.005,
  king: 0.01,
  legendary: 0.05,
  rare: 0.26,
  uncommon: 0.33,
  none: 0.345,
};

// Part des gains qui sortent en trois symboles identiques, donc en shiny.
export const TRIPLE_RATE = 1 / 8;

export interface SlotResult {
  prize: SlotPrize;
  reels: Reels;
  variant?: Variant; // le canard gagne, absent sur une perte et sur le jackpot
  jackpotUnlock: boolean; // le 777 vient de debloquer le Canard Croupier
}

function pickPrize(): SlotPrize {
  let r = Math.random();
  for (const [prize, odds] of Object.entries(PRIZE_ODDS) as [SlotPrize, number][]) {
    if ((r -= odds) < 0) return prize;
  }
  return "none";
}

function pairReels(symbol: SlotSymbol): Reels {
  const reels: SlotSymbol[] = [symbol, symbol, randOf(SYMBOLS.filter((s) => s !== symbol))];
  const i = (Math.random() * 3) | 0;
  [reels[2], reels[i]] = [reels[i], reels[2]];
  return reels as Reels;
}

// Trois symboles distincts: aucune paire, donc aucun lot.
function loseReels(): Reels {
  const pool = [...SYMBOLS];
  const reels: SlotSymbol[] = [];
  for (let i = 0; i < 3; i++) reels.push(...pool.splice((Math.random() * pool.length) | 0, 1));
  return reels as Reels;
}

// Le catalogue des skins reste la seule source de canards: on re-tire jusqu'a
// tomber sur la rarete voulue plutot que de dupliquer les tables de duckRandom.
function variantOfRarity(target: Rarity): Variant {
  let v = randomVariant();
  for (let i = 0; i < 500 && getRarity(v) !== target; i++) v = randomVariant();
  return v;
}

function prizeVariant(prize: Exclude<SlotPrize, "none" | "jackpot">): Variant {
  if (prize === "king") return kingVariant();
  if (prize === "legendary") return randomLegendaryVariant();
  return variantOfRarity(prize);
}

// `force` sert au menu dev: le cooldown de 4h rend l'attente d'un jackpot
// impraticable a la main.
export function rollSlot(jackpotWon: boolean, force?: SlotPrize): SlotResult {
  const prize = force ?? pickPrize();

  if (prize === "none") {
    return { prize, reels: loseReels(), jackpotUnlock: false };
  }

  const reels: Reels =
    prize === "jackpot" ? ["seven", "seven", "seven"] : pairReels(SYMBOL_OF_PRIZE[prize]);

  // Le jackpot ne lache pas de canard: il debloque la carte du Croupier dans le
  // Canardex. Une fois le Croupier acquis, le 777 se convertit en legendaire
  // shiny plutot que de gaspiller le tirage.
  if (prize === "jackpot") {
    if (!jackpotWon) return { prize, reels, jackpotUnlock: true };
    const v = randomLegendaryVariant();
    v.shiny = true;
    return { prize, reels, variant: v, jackpotUnlock: false };
  }

  const triple = Math.random() < TRIPLE_RATE;
  if (triple) reels[1] = reels[2] = reels[0] = SYMBOL_OF_PRIZE[prize];

  const variant = prizeVariant(prize);
  delete variant.shiny;
  if (triple) variant.shiny = true;

  return { prize, reels, variant, jackpotUnlock: false };
}
