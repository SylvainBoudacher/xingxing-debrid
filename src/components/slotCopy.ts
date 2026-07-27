import { PRIZE_ODDS, SYMBOL_OF_PRIZE, type SlotPrize, type SlotSymbol } from "@/game/slots";

// Textes du bandit manchot, sortis du composant: le panneau et la table des
// gains disent la même chose du même lot.

export const SYMBOL_LABELS: Record<SlotSymbol, string> = {
  seven: "777",
  crown: "Couronne",
  golden: "Canard doré",
  wizard: "Chapeau de sorcier",
  glasses: "Canard à lunettes",
  duckling: "Caneton",
};

export const PRIZE_LABEL: Record<SlotPrize, string> = {
  jackpot: "Canard Croupier",
  king: "Le Roi des canards",
  legendary: "Canard légendaire",
  rare: "Canard rare",
  uncommon: "Canard peu commun",
  none: "Perdu",
};

// Lignes de la table des gains, du plus gros lot au plus petit.
export const PAYOUTS: Array<{ prize: SlotPrize; symbol: SlotSymbol; note: string }> = (
  ["jackpot", "king", "legendary", "rare", "uncommon"] as const
).map((prize) => ({
  prize,
  symbol: SYMBOL_OF_PRIZE[prize],
  note: `${(PRIZE_ODDS[prize] * 100).toFixed(1).replace(".0", "")} %`,
}));

export function prizeToast(prize: SlotPrize, jackpotUnlock: boolean): string {
  if (prize === "jackpot") {
    return jackpotUnlock
      ? "JACKPOT ! Le Canard Croupier t'attend dans le Canardex."
      : "777 ! Un légendaire shiny sort de la machine.";
  }
  if (prize === "king") return "La couronne ! Le Roi des canards plonge dans le bassin.";
  if (prize === "none") return "Perdu. Le bassin te doit une revanche.";
  return `${PRIZE_LABEL[prize]} : il vient de tomber dans le bassin.`;
}
