import { hash } from "./hash";
import { contains, HOUR } from "./time";
import type { Interval } from "./types";

export type RainSource = (from: number, to: number) => Interval[];

const RAIN_CHANCE = 0.35;

function rainOfDay(dayStart: Date): Interval | null {
  const y = dayStart.getFullYear();
  const m = dayStart.getMonth() + 1;
  const d = dayStart.getDate();
  if (hash(y, m, d) >= RAIN_CHANCE) return null;
  const hour = 6 + Math.floor(hash(d, m, y) * 14);
  const minutes = 30 + Math.floor(hash(y + d, m * 7, 3) * 61);
  const start = new Date(y, m - 1, d, hour).getTime();
  return { start, end: start + minutes * 60_000 };
}

export const rainIntervals: RainSource = (from, to) => {
  const out: Interval[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  // un jour de marge avant : une averse de la veille ne dépasse jamais minuit, mais
  // on reste robuste aux changements d'heure
  cursor.setDate(cursor.getDate() - 1);
  while (cursor.getTime() < to + 2 * HOUR) {
    const r = rainOfDay(cursor);
    if (r && r.end > from && r.start < to) out.push(r);
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
};

export function isRaining(now: number): boolean {
  return contains(rainIntervals(now - HOUR * 2, now + 1), now);
}
