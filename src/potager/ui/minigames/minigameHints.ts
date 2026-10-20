import type { GameGesture } from "./minigameKit";

// "left" | "right" | "up" | "down" s'affichent en flèches, le reste en texte
export type KeyLabel = string;

export interface Hint {
  title: string;
  goal: string;
  // touches équivalentes, par groupe ("ou" entre les groupes)
  keys: KeyLabel[][];
  hold?: boolean;
}

const SPACE_OR_CLICK = [["Espace"], ["Clic"]];

export const HINTS: Record<GameGesture, Hint> = {
  becher: {
    title: "Bêcher",
    goal: "Frappe quand le cercle touche l'anneau doré, trois fois.",
    keys: SPACE_OR_CLICK,
  },
  semer: {
    title: "Semer",
    goal: "Lâche la graine quand son ombre passe sur le trou.",
    keys: SPACE_OR_CLICK,
  },
  arroser: {
    title: "Arroser",
    goal: "Maintiens pour verser, relâche quand l'eau est dans la zone verte.",
    keys: SPACE_OR_CLICK,
    hold: true,
  },
  cueillir: {
    title: "Cueillir",
    goal: "Tape les flèches dans l'ordre avant la fin du temps.",
    keys: [
      ["up", "down", "left", "right"],
      ["Z", "Q", "S", "D"],
    ],
  },
  puits: {
    title: "Remonter le seau",
    goal: "Garde le seau droit : appuie du côté où il penche.",
    keys: [["left", "right"], ["Q", "D"], ["Clic à gauche ou à droite"]],
  },
  desherber: {
    title: "Désherber",
    goal: "Maintiens pour tirer et garde le curseur dans la zone verte.",
    keys: SPACE_OR_CLICK,
    hold: true,
  },
  servir: {
    title: "Nouer le ruban",
    goal: "Appuie quand l'aiguille passe sur le nœud, deux tours de suite.",
    keys: SPACE_OR_CLICK,
  },
};
