import { entryKey } from "./seeds";
import type { Cell, Grade, PotagerSave, Rarity } from "./types";

// de la graine à la fleur épanouie, en temps de jeu
export const GROW_MS: Record<Rarity, number> = {
  commune: 600_000,
  rare: 900_000,
  epique: 1_200_000,
  legendaire: 1_800_000,
};
export const WET_MS = 180_000;
export const WET_SPEED: Record<Grade, number> = { parfait: 1.5, bien: 1.3, rate: 1.15 };
export const LOOSE_SPEED = 1.1;
// part de la durée normale de la première étape, selon le semis
export const SOW_FIRST_STAGE: Record<Grade, number> = { parfait: 0.7, bien: 0.85, rate: 1 };

const FIRST_STAGE = 0.25;

export const stageOf = (progress: number): 0 | 1 | 2 | 3 | 4 =>
  progress >= 1 ? 4 : (Math.min(3, Math.floor(progress * 4)) as 0 | 1 | 2 | 3);

type Plant = Extract<Cell, { kind: "plante" }>;

function grow(c: Plant, stepMs: number, now: number): Plant {
  let speed = 1 / GROW_MS[c.seed.rarity];
  if (now < c.wetUntil) speed *= WET_SPEED[c.wetGrade];
  if (c.loose) speed *= LOOSE_SPEED;
  let progress = c.progress,
    left = stepMs;
  if (progress < FIRST_STAGE) {
    const fast = speed / SOW_FIRST_STAGE[c.sowGrade];
    const toStage = (FIRST_STAGE - progress) / fast;
    if (left < toStage) return { ...c, progress: progress + left * fast };
    progress = FIRST_STAGE;
    left -= toStage;
  }
  return { ...c, progress: Math.min(1, progress + left * speed) };
}

// Fait pousser les plantes ; une éclosion inscrit l'entrée dans l'Herbier, à annoncer plus tard.
export function advanceGarden(save: PotagerSave, stepMs: number): PotagerSave {
  if (stepMs <= 0) return save;
  let cells: Record<string, Cell> | null = null;
  let herbier = save.herbier;
  for (const [key, c] of Object.entries(save.cells)) {
    if (c.kind !== "plante" || c.progress >= 1) continue;
    const next = grow(c, stepMs, save.playTimeMs);
    if (next.progress >= 1) {
      next.seen = false;
      const k = entryKey(c.seed.species, c.seed.color);
      if (!herbier[k])
        herbier = { ...herbier, [k]: { discoveredAt: save.playTimeMs, announced: false } };
    }
    (cells ??= { ...save.cells })[key] = next;
  }
  return cells ? { ...save, cells, herbier } : save;
}

export function markSeen(
  save: PotagerSave,
  cellKey: string,
): {
  save: PotagerSave;
  announce: { species: Plant["seed"]["species"]; color: Plant["seed"]["color"] } | null;
} {
  const c = save.cells[cellKey];
  if (c?.kind !== "plante" || c.seen) return { save, announce: null };
  const k = entryKey(c.seed.species, c.seed.color);
  const entry = save.herbier[k];
  const cells = { ...save.cells, [cellKey]: { ...c, seen: true } };
  if (!entry || entry.announced) return { save: { ...save, cells }, announce: null };
  return {
    save: { ...save, cells, herbier: { ...save.herbier, [k]: { ...entry, announced: true } } },
    announce: { species: c.seed.species, color: c.seed.color },
  };
}
