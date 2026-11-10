import type { ReleaseScope } from "@/lib/parseRelease";
import type { MediaType, TmdbItem } from "@/lib/tmdbItem";
import type { RadarAlert, RadarEntry, RadarExpectation, RadarRelease } from "./types";

export const VF_1080: RadarExpectation = { language: "vf", resolution: "1080p", mode: "strict" };

export function tmdbItem(
  id: number,
  mediaType: MediaType,
  title = "Les Veilleurs",
  year = "2024",
): TmdbItem {
  return {
    id,
    mediaType,
    title,
    originalTitle: title,
    posterPath: null,
    year,
    voteAverage: 7,
    overview: "",
  };
}

export function tvEntry(patch: Partial<RadarEntry> = {}): RadarEntry {
  return {
    id: "tv-10-3",
    item: tmdbItem(10, "tv"),
    season: 3,
    expectation: VF_1080,
    known: {},
    baseline: [],
    alerts: [],
    packs: {},
    episodes: [1, 2, 3, 4, 5, 6, 7, 8],
    aired: [1, 2, 3, 4, 5, 6],
    addedAt: 0,
    ...patch,
  };
}

export function movieEntry(patch: Partial<RadarEntry> = {}): RadarEntry {
  return {
    ...tvEntry(),
    id: "movie-4-x",
    item: tmdbItem(4, "movie", "L'Écluse", "2026"),
    season: null,
    episodes: [],
    aired: [],
    ...patch,
  };
}

export function episodeScope(season: number, episode: number): ReleaseScope {
  return { kind: "episode", season, episode };
}

export function release(
  languages: string[],
  resolution: string | null,
  scope: ReleaseScope | null,
  patch: Partial<RadarRelease> = {},
): RadarRelease {
  return {
    infoHash: JSON.stringify([languages, resolution, scope]),
    recent: true,
    languages,
    resolution,
    scope,
    ...patch,
  };
}

export function alert(level: RadarAlert["level"], content = "e6"): RadarAlert {
  return { content, level, version: { language: "vf", resolution: "1080p" }, detectedAt: 1 };
}
