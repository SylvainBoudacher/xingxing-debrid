import type { Seed } from "../../core/types";

export const STEP_MS = 350;
export const LEGENDARY_PAUSE_MS = 1000;

// Délai de retournement de chaque carte : une légendaire retient la suivante.
export function delays(seeds: Seed[]): number[] {
  let t = 0;
  return seeds.map((s) => {
    const at = t;
    t += STEP_MS + (s.rarity === "legendaire" ? LEGENDARY_PAUSE_MS : 0);
    return at;
  });
}

export const revealDuration = (seeds: Seed[]): number =>
  (delays(seeds)[seeds.length - 1] ?? 0) + STEP_MS;
