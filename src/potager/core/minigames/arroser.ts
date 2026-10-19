import type { Grade } from "../types";
import type { Minigame } from "./types";

const FILL_S = 1.7,
  IDEAL = 0.7,
  IDLE_S = 6;

export interface ArroserView {
  level: number;
  pouring: boolean;
  zone: [number, number];
  ideal: [number, number];
}

export function createArroser(): Minigame<ArroserView> {
  let level = 0,
    idle = 0,
    pouring = false;
  let grade: Grade | null = null;
  const judge = () => {
    pouring = false;
    grade =
      Math.abs(level - IDEAL) < 0.035 ? "parfait" : level > 0.6 && level < 0.82 ? "bien" : "rate";
  };
  return {
    press(input, down) {
      if (grade || input !== "action") return;
      if (down) pouring = true;
      else if (pouring) judge();
    },
    update(dt) {
      if (grade) return;
      if (!pouring) {
        idle += dt;
        if (idle >= IDLE_S) grade = "rate";
        return;
      }
      level = Math.min(1, level + dt / FILL_S);
      if (level >= 1) judge();
    },
    view: () => ({ level, pouring, zone: [0.6, 0.82], ideal: [IDEAL - 0.035, IDEAL + 0.035] }),
    result: () => (grade ? { grade } : null),
  };
}
