import type { PotagerSave } from "./types";

// une veille de la machine app ouverte ne doit pas faire sauter des heures de jeu
export const MAX_STEP_MS = 600_000;

export function advancePlayTime(save: PotagerSave, elapsedMs: number): PotagerSave {
  const step = Math.min(MAX_STEP_MS, Math.max(0, elapsedMs));
  return { ...save, playTimeMs: save.playTimeMs + step };
}
