import type { Grade } from "../types";
import type { Minigame } from "./types";

// unités de la maquette : sillon de 320, balancier sur 240 à partir de 40
const PERIOD_DIV = 0.52,
  TIMEOUT_S = 8;

export interface SemerView {
  x: number;
  hole: number;
  width: number;
  dropped: boolean;
}

export function createSemer(rng: () => number): Minigame<SemerView> {
  const hole = 90 + rng() * 140;
  let t = 0;
  let x: number | null = null;
  let grade: Grade | null = null;
  const pos = () => 40 + (Math.sin(t / PERIOD_DIV) * 0.5 + 0.5) * 240;
  return {
    press(input, down) {
      if (grade || !down || input !== "action") return;
      x = pos();
      const d = Math.abs(x - hole);
      grade = d < 18 ? "parfait" : d < 42 ? "bien" : "rate";
    },
    update(dt) {
      if (grade) return;
      t += dt;
      if (t >= TIMEOUT_S) grade = "rate";
    },
    view: () => ({ x: x ?? pos(), hole, width: 320, dropped: x !== null }),
    result: () => (grade ? { grade } : null),
  };
}
