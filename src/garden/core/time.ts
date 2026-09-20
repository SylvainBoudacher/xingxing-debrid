import type { Interval } from "./types";

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function mergeIntervals(list: Interval[]): Interval[] {
  const sorted = list.filter((i) => i.end > i.start).sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const i of sorted) {
    const last = out[out.length - 1];
    if (last && i.start <= last.end) last.end = Math.max(last.end, i.end);
    else out.push({ start: i.start, end: i.end });
  }
  return out;
}

export function coveredDuration(list: Interval[], from: number, to: number): number {
  if (to <= from) return 0;
  let total = 0;
  for (const i of mergeIntervals(list)) {
    total += Math.max(0, Math.min(i.end, to) - Math.max(i.start, from));
  }
  return total;
}

export function contains(list: Interval[], t: number): boolean {
  return list.some((i) => t >= i.start && t < i.end);
}
