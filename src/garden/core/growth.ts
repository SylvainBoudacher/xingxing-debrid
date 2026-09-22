import { contains, coveredDuration, HOUR, mergeIntervals } from "./time";
import type { Interval, PlantTile, Rarity, Stage } from "./types";
import { rainIntervals, type RainSource } from "./weather";

export const GROWTH_MS: Record<Rarity, number> = {
  commune: 8 * HOUR,
  rare: 12 * HOUR,
  epique: 18 * HOUR,
  legendaire: 30 * HOUR,
};

export const WATER_MS = 6 * HOUR;
export const WET_BONUS = 0.5;
const STAGES = 4;

const stepOf = (plant: PlantTile): number => GROWTH_MS[plant.seed.rarity] / STAGES;

// Élixirs de croissance déjà versés à `now`, dans l'ordre.
function boostsUntil(plant: PlantTile, now: number): number[] {
  return (plant.boosts ?? []).filter((b) => b >= plant.sownAt && b <= now).sort((a, b) => a - b);
}

export interface GrowthState {
  stage: Stage;
  stageProgress: number;
  wet: boolean;
  beautiful: boolean;
}

export function wetIntervals(
  plant: PlantTile,
  now: number,
  rain: RainSource = rainIntervals,
): Interval[] {
  if (now <= plant.sownAt) return mergeIntervals(plant.watered);
  return mergeIntervals([...plant.watered, ...rain(plant.sownAt, now)]);
}

export function effectiveMs(
  plant: PlantTile,
  now: number,
  rain: RainSource = rainIntervals,
): number {
  if (now <= plant.sownAt) return 0;
  const wet = coveredDuration(wetIntervals(plant, now, rain), plant.sownAt, now);
  return now - plant.sownAt + WET_BONUS * wet + boostsUntil(plant, now).length * stepOf(plant);
}

// Instant réel où le temps efficace atteint `target` (target <= temps efficace à `now`).
// Un élixir fait sauter le temps efficace d'une étape sans temps réel écoulé.
function realTimeFor(plant: PlantTile, target: number, wet: Interval[], now: number): number {
  const step = stepOf(plant);
  const jumps = boostsUntil(plant, now);
  const jumpsAt = (t: number) => jumps.filter((j) => j === t).length * step;
  let t = plant.sownAt;
  let acc = jumpsAt(t);
  if (acc >= target) return t;
  const bounds = [
    ...new Set(
      wet
        .flatMap((i) => [i.start, i.end])
        .concat(jumps)
        .filter((b) => b > plant.sownAt && b < now)
        .concat(now),
    ),
  ].sort((a, b) => a - b);
  for (const b of bounds) {
    const rate = contains(wet, t) ? 1 + WET_BONUS : 1;
    const gain = (b - t) * rate;
    if (acc + gain >= target) return t + (target - acc) / rate;
    acc += gain + jumpsAt(b);
    t = b;
    if (acc >= target) return t;
  }
  return now;
}

export function growthOf(
  plant: PlantTile,
  now: number,
  rain: RainSource = rainIntervals,
): GrowthState {
  const total = GROWTH_MS[plant.seed.rarity];
  const step = total / STAGES;
  const eff = effectiveMs(plant, now, rain);
  const wet = wetIntervals(plant, now, rain);
  const stage = Math.min(STAGES, Math.floor(eff / step)) as Stage;
  const stageProgress = stage === STAGES ? 1 : (eff - stage * step) / step;

  let beautiful = false;
  if (stage === STAGES) {
    beautiful = true;
    for (let k = 0; k < STAGES; k++) {
      const from = realTimeFor(plant, k * step, wet, now);
      const to = realTimeFor(plant, (k + 1) * step, wet, now);
      // étape entièrement sautée par un élixir : rien à exiger
      if (to <= from) continue;
      if (coveredDuration(wet, from, to) <= 0) {
        beautiful = false;
        break;
      }
    }
  }

  return { stage, stageProgress, wet: contains(wet, now), beautiful };
}
