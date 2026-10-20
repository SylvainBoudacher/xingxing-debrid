import { MAP } from "./catalog/map";
import { parcelCells } from "./cells";
import { GLAND_CHANCE } from "./forest";
import { stageOf } from "./growth";
import type { Point, PotagerSave } from "./types";

export const WEED_EVERY_MS = 300_000;
export const MAX_WEEDS = 3;
export const CROW_EVERY_MS = 240_000;
export const CROW_STAY_MS = 180_000;
export const MAX_CROWS = 2;
export const FOREST_EVERY_MS = 180_000;
export const MAX_FOREST = 4;
export const SCARE_DIST = 2;

const chance = (stepMs: number, every: number) => Math.min(1, stepMs / every);
const pick = <T>(rng: () => number, a: readonly T[]) =>
  a[Math.min(a.length - 1, Math.floor(rng() * a.length))];

// Apparitions probabilistes par pas de temps : une veille plafonnée ne fait rien déborder.
export function advanceNuisances(
  save: PotagerSave,
  stepMs: number,
  rng: () => number,
): PotagerSave {
  if (stepMs <= 0) return save;
  const now = save.playTimeMs;
  let { weeds, crows, forest } = save;

  for (const parcel of save.parcels) {
    const keys = parcelCells(parcel).map((c) => c.key);
    const count = keys.filter((k) => weeds[k]).length;
    if (count >= MAX_WEEDS || rng() >= chance(stepMs, WEED_EVERY_MS)) continue;
    const free = keys.filter((k) => !weeds[k]);
    if (free.length) weeds = { ...weeds, [pick(rng, free)]: { at: now } };
  }

  const gone = Object.keys(crows).filter((k) => crows[k].leaveAt <= now);
  if (gone.length)
    crows = Object.fromEntries(Object.entries(crows).filter(([k]) => !gone.includes(k)));
  if (Object.keys(crows).length < MAX_CROWS && rng() < chance(stepMs, CROW_EVERY_MS)) {
    const sown = Object.entries(save.cells)
      .filter(([k, c]) => c.kind === "plante" && stageOf(c.progress) < 4 && !crows[k])
      .map(([k]) => k);
    if (sown.length) crows = { ...crows, [pick(rng, sown)]: { leaveAt: now + CROW_STAY_MS } };
  }

  if (Object.keys(forest).length < MAX_FOREST && rng() < chance(stepMs, FOREST_EVERY_MS)) {
    const free = MAP.forest.map((_, i) => i).filter((i) => !forest[i]);
    if (free.length)
      forest = { ...forest, [pick(rng, free)]: rng() < GLAND_CHANCE ? "gland" : "champignon" };
  }

  return weeds === save.weeds && crows === save.crows && forest === save.forest
    ? save
    : { ...save, weeds, crows, forest };
}

const weedAt = (save: PotagerSave, key: string) => {
  const w = save.weeds[key];
  return !!w && w.at <= save.playTimeMs;
};

// Une herbe présente ralentit de moitié sa case et les 8 voisines.
export function weedFactor(save: PotagerSave, cellKey: string): number {
  const [parcel, col, row] = cellKey.split(":");
  for (let dj = -1; dj <= 1; dj++)
    for (let di = -1; di <= 1; di++)
      if (weedAt(save, `${parcel}:${Number(col) + di}:${Number(row) + dj}`)) return 0.5;
  return 1;
}

export const hasWeed = weedAt;

export function scareCrows(save: PotagerSave, p: Point): PotagerSave {
  const keys = Object.keys(save.crows);
  if (!keys.length) return save;
  const centers = new Map(
    save.parcels.flatMap((id) => parcelCells(id).map((c) => [c.key, c.center])),
  );
  const near = keys.filter((k) => {
    const c = centers.get(k);
    return c && Math.hypot(c.x - p.x, c.z - p.z) < SCARE_DIST;
  });
  if (!near.length) return save;
  return {
    ...save,
    crows: Object.fromEntries(Object.entries(save.crows).filter(([k]) => !near.includes(k))),
  };
}
