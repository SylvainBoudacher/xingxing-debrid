import type { Grade } from "../types";
import type { Input, Minigame } from "./types";

type Arrow = Exclude<Input, "action">;
const ARROWS: Arrow[] = ["up", "down", "left", "right"];
const LIMIT_S = 2.5,
  FAST_S = 1.6;

export interface CueillirView {
  sequence: Arrow[];
  done: number;
  timeLeft: number;
}

export function createCueillir(rng: () => number): Minigame<CueillirView> {
  const sequence = Array.from({ length: 3 }, () => ARROWS[Math.floor(rng() * 4) % 4]);
  let i = 0,
    t = 0,
    err = false;
  let grade: Grade | null = null;
  return {
    press(input, down) {
      if (grade || !down || input === "action") return;
      if (input === sequence[i]) i++;
      else err = true;
      if (i >= sequence.length) grade = !err && t < FAST_S ? "parfait" : "bien";
    },
    update(dt) {
      if (grade) return;
      t += dt;
      if (t >= LIMIT_S) grade = "rate";
    },
    view: () => ({ sequence, done: i, timeLeft: Math.max(0, 1 - t / LIMIT_S) }),
    result: () => (grade ? { grade } : null),
  };
}
