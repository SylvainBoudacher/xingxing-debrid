import type { TmdbItem } from "@/lib/tmdbItem";
import type { RadarEntry, RadarExpectation } from "./types";

export function radarEntryId(item: TmdbItem, season: number | null): string {
  return `${item.mediaType}-${item.id}-${season ?? "x"}`;
}

export function newRadarEntry(
  item: TmdbItem,
  season: number | null,
  expectation: RadarExpectation,
  now: number,
): RadarEntry {
  return {
    id: radarEntryId(item, season),
    item,
    season,
    expectation,
    known: null,
    baseline: [],
    alerts: [],
    episodes: [],
    aired: [],
    addedAt: now,
  };
}

export function latestSeason(seasons: { season_number: number }[]): number | null {
  const numbers = seasons.map((s) => s.season_number).filter((n) => n > 0);
  return numbers.length > 0 ? Math.max(...numbers) : null;
}
