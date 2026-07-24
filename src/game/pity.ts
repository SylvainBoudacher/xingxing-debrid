// Pity progressif sur les 3 cartes de fin de run: chaque main qui n'apporte
// rien de neuf fait monter un compteur de secheresse, et ce compteur augmente
// la chance que la main suivante cible ce qui manque au joueur. Deux compteurs
// separes, pour qu'un joueur au Canardex complet continue de profiter du pity
// shiny. Les courbes sont concaves (montee rapide puis plateau): aucune
// garantie dure, jamais de saut a 100%.

import { getRarity, randOf, type Rarity } from "@/components/duckRandom";
import { SPECIES, speciesOf, variantForSpecies, type DuckSpecies } from "@/components/duckSpecies";
import type { Variant } from "@/components/duckTypes";
import type { DexEntries, ShinyEntries } from "@/lib/duckDex";
import { isRewardEffect } from "@/lib/duckRewards";

export interface PityState {
  dryDex: number; // mains consecutives sans espece ni couleur neuve
  dryShiny: number; // mains consecutives sans shiny manquant
}

export interface DexSnapshot {
  entries: DexEntries;
  shiny: ShinyEntries;
}

export const EMPTY_PITY: PityState = { dryDex: 0, dryShiny: 0 };

const DEX_CAP = 0.6;
const DEX_STEP = 0.65; // plus il est bas, plus la montee est brutale
const SHINY_BASE = 0.03;
const SHINY_CAP = 0.15;
const SHINY_STEP = 0.7;

// Bonus de fin de chasse: x1 quand tout manque, jusqu'a x3 sur le dernier
// shiny. La puissance 4 concentre le bonus sur la toute fin de la collection.
export function endgameMult(missingShiny: number): number {
  return 1 + 2 * (1 - missingShiny / SPECIES.length) ** 4;
}

export function dexChance(dry: number): number {
  return DEX_CAP * (1 - DEX_STEP ** dry);
}

export function shinyChance(missingShiny: number, dry: number): number {
  const mult = endgameMult(missingShiny);
  const base = SHINY_BASE * mult;
  return base + (SHINY_CAP * mult - base) * (1 - SHINY_STEP ** dry);
}

// Une recompense du Canardex n'est pas une espece: elle ne compte jamais comme
// nouveaute et ne peut pas etre remplacee par un tirage cible.
const isSpecies = (v: Variant) => !isRewardEffect(v.effect);

export function isNewToDex(v: Variant, entries: DexEntries): boolean {
  if (!isSpecies(v)) return false;
  const colors = entries[speciesOf(v)];
  return !colors || !colors.includes(v.body.toLowerCase());
}

export function isNewShiny(v: Variant, shiny: ShinyEntries): boolean {
  return !!v.shiny && isSpecies(v) && !shiny.includes(speciesOf(v));
}

// Especes de ce palier qui manquent au dex, puis a defaut familles de ce palier
// dont il reste des couleurs a prendre. L'espece neuve passe avant la couleur.
function dexTarget(rarity: Rarity, entries: DexEntries): DuckSpecies | undefined {
  const ofRarity = SPECIES.filter((s) => s.rarity === rarity);
  const unseen = ofRarity.filter((s) => !entries[s.id]?.length);
  if (unseen.length) return randOf(unseen);
  const partial = ofRarity.filter((s) => (entries[s.id]?.length ?? 0) < s.maxColors);
  return partial.length ? randOf(partial) : undefined;
}

function shinyTarget(rarity: Rarity, shiny: ShinyEntries): DuckSpecies | undefined {
  const missing = SPECIES.filter((s) => s.rarity === rarity && !shiny.includes(s.id));
  return missing.length ? randOf(missing) : undefined;
}

const shuffled = (n: number) => {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
};

// Remplace une carte par un canard cible, en restant dans le palier de rarete
// de la carte remplacee pour ne pas deformer les taux. Renvoie l'index touche,
// ou -1 si plus rien ne manque dans les paliers presents dans la main.
function retarget(
  cards: Variant[],
  pick: (rarity: Rarity) => DuckSpecies | undefined,
  entries: DexEntries,
): number {
  for (const i of shuffled(cards.length)) {
    if (!isSpecies(cards[i])) continue;
    const sp = pick(getRarity(cards[i]));
    if (!sp) continue;
    const wasShiny = cards[i].shiny;
    cards[i] = variantForSpecies(sp, entries[sp.id] ?? []);
    if (wasShiny) cards[i].shiny = true;
    return i;
  }
  return -1;
}

export function applyPity(
  hand: Variant[],
  snap: DexSnapshot | null,
  state: PityState,
): { cards: Variant[]; next: PityState } {
  if (!snap) return { cards: hand, next: state };
  const { entries, shiny } = snap;
  const cards = hand.map((v) => ({ ...v }));

  if (!cards.some((v) => isNewToDex(v, entries)) && Math.random() < dexChance(state.dryDex)) {
    retarget(cards, (r) => dexTarget(r, entries), entries);
  }

  const missing = SPECIES.length - shiny.length;
  const dry = shinyChance(missing, state.dryShiny);
  if (!cards.some((v) => isNewShiny(v, shiny)) && Math.random() < dry) {
    const candidates = cards.filter((v) => isSpecies(v) && !shiny.includes(speciesOf(v)));
    if (candidates.length) randOf(candidates).shiny = true;
    else {
      // les 3 especes ont deja leur shiny: on vise d'abord une espece qui ne
      // l'a pas, puis on la fait briller
      const i = retarget(cards, (r) => shinyTarget(r, shiny), entries);
      if (i >= 0) cards[i].shiny = true;
    }
  }

  // Les compteurs se basent sur ce qui est propose, pas sur ce que le joueur
  // garde: sinon refuser une carte neuve maintiendrait le pity au maximum.
  return {
    cards,
    next: {
      dryDex: cards.some((v) => isNewToDex(v, entries)) ? 0 : state.dryDex + 1,
      dryShiny: cards.some((v) => isNewShiny(v, shiny)) ? 0 : state.dryShiny + 1,
    },
  };
}
