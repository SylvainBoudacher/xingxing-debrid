import type { Grade } from "../types";
import type { Minigame } from "./types";

const TURN_S = [1.1, 0.75],
  PAUSE_S = 0.25,
  TAU = Math.PI * 2;

export interface RubanView {
  angle: number;
  knot: number;
  pass: 0 | 1;
  hits: number[];
}

export function createRuban(rng: () => number): Minigame<RubanView> {
  let pass: 0 | 1 = 0;
  let t = -PAUSE_S;
  let knot = rng() * TAU;
  const hits: number[] = [];
  let grade: Grade | null = null;
  const angle = () => (Math.max(t, 0) / TURN_S[pass]) * TAU;
  const score = (h: number) => {
    hits.push(h);
    t = -PAUSE_S;
    if (pass === 0) {
      pass = 1;
      knot = rng() * TAU;
      return;
    }
    const sum = hits[0] + hits[1];
    grade = sum >= 4 ? "parfait" : sum >= 2 ? "bien" : "rate";
  };
  return {
    press(input, down) {
      if (grade || !down || input !== "action" || t < 0) return;
      const diff = Math.abs(angle() - knot);
      const d = Math.min(diff, TAU - diff);
      score(d < 0.18 ? 2 : d < 0.45 ? 1 : 0);
    },
    update(dt) {
      if (grade) return;
      t += dt;
      if (t >= TURN_S[pass]) score(0);
    },
    view: () => ({ angle: angle() % TAU, knot, pass, hits: [...hits] }),
    result: () => (grade ? { grade } : null),
  };
}
