import type { Grade } from "../types";

export type Input = "action" | "left" | "right" | "up" | "down";
export type MinigameResult = { grade: Grade; water?: number };

// Logique pure d'un mini-jeu : l'affichage lit view(), le temps avance par update(dt).
export interface Minigame<V> {
  press(input: Input, down: boolean): void;
  update(dtS: number): void;
  view(): V;
  result(): MinigameResult | null;
}
