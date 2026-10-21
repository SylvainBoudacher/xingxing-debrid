import type { Grade } from "../types";
import type { Minigame } from "./types";

const TURN_S = [1.3, 1.1, 1],
  PAUSE_S = 0.25,
  TAU = Math.PI * 2,
  GOOD = 0.45,
  PERFECT = 0.18;

// le nœud n'apparaît jamais dans le premier quart du tour : le temps de réagir
const spawnKnot = (rng: () => number) => TAU * 0.25 + GOOD + rng() * (TAU * 0.75 - 2 * GOOD);

export interface RubanView {
  angle: number;
  knot: number;
  pass: 0 | 1 | 2;
  hits: number[];
}

export function createRuban(rng: () => number): Minigame<RubanView> {
  let pass: 0 | 1 | 2 = 0;
  let t = -PAUSE_S;
  let knot = spawnKnot(rng);
  const hits: number[] = [];
  let grade: Grade | null = null;
  const angle = () => (Math.max(t, 0) / TURN_S[pass]) * TAU;
  const score = (h: number) => {
    hits.push(h);
    t = -PAUSE_S;
    if (pass < 2) {
      pass = (pass + 1) as 1 | 2;
      knot = spawnKnot(rng);
      return;
    }
    const valid = hits.filter((x) => x > 0).length;
    grade = valid >= 2 ? "parfait" : valid === 1 ? "bien" : "rate";
  };
  return {
    press(input, down) {
      if (grade || !down || input !== "action" || t < 0) return;
      const diff = Math.abs(angle() - knot);
      const d = Math.min(diff, TAU - diff);
      score(d < PERFECT ? 2 : d < GOOD ? 1 : 0);
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
