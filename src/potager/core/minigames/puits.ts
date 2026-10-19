import type { Grade } from "../types";
import type { Minigame } from "./types";

const RISE_S = 3.5,
  SPILL_FROM = 0.35;

export interface PuitsView {
  height: number;
  angle: number;
  water: number;
  push: -1 | 0 | 1;
}

// Le seau remonte en tanguant ; le garder droit évite de renverser l'eau.
export function createPuits(): Minigame<PuitsView> {
  let t = 0,
    angle = 0,
    vel = 0,
    water = 1;
  let push: -1 | 0 | 1 = 0;
  let grade: Grade | null = null;
  return {
    press(input, down) {
      if (grade || (input !== "left" && input !== "right")) return;
      const d = input === "left" ? -1 : 1;
      if (down) push = d;
      else if (push === d) push = 0;
    },
    update(dt) {
      if (grade) return;
      t += dt;
      const wind = Math.sin(t * 1.7) * 1.1 + Math.sin(t * 3.1 + 1) * 0.7;
      vel += (wind + angle * 1.2 - push * 2.4) * dt;
      vel *= Math.pow(0.97, dt * 60);
      angle = Math.max(-1, Math.min(1, angle + vel * dt));
      if (Math.abs(angle) > SPILL_FROM)
        water = Math.max(0, water - (Math.abs(angle) - SPILL_FROM) * 0.9 * dt);
      if (t >= RISE_S) grade = water > 0.9 ? "parfait" : water > 0.6 ? "bien" : "rate";
    },
    view: () => ({ height: Math.min(1, t / RISE_S), angle, water, push }),
    result: () => (grade ? { grade, water } : null),
  };
}
