import type { Grade } from "../types";
import type { Minigame } from "./types";

// unités de la maquette : le cercle passe d'un rayon de 70 à l'anneau de 18 en 0,9 s
const START = 70,
  TARGET = 18,
  SHRINK_S = 0.9,
  MISS_RADIUS = 6,
  PAUSE_S = 0.25,
  BEATS = 3;

export interface BecherView {
  active: boolean;
  radius: number;
  target: number;
  hits: number[];
}

export function createBecher(): Minigame<BecherView> {
  let t = -PAUSE_S;
  const hits: number[] = [];
  let grade: Grade | null = null;
  const radius = () => START - (t / SHRINK_S) * (START - TARGET);
  const score = (h: number) => {
    hits.push(h);
    t = -PAUSE_S;
    if (hits.length < BEATS) return;
    const sum = hits.reduce((a, b) => a + b, 0);
    grade = sum >= 5 ? "parfait" : sum >= 3 ? "bien" : "rate";
  };
  return {
    press(input, down) {
      if (grade || !down || input !== "action" || t < 0) return;
      const d = Math.abs(radius() - TARGET);
      score(d < 5 ? 2 : d < 12 ? 1 : 0);
    },
    update(dt) {
      if (grade) return;
      t += dt;
      if (t >= 0 && radius() < MISS_RADIUS) score(0);
    },
    view: () => ({ active: t >= 0 && !grade, radius: radius(), target: TARGET, hits: [...hits] }),
    result: () => (grade ? { grade } : null),
  };
}
