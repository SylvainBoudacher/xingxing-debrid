import { queryClient } from "@/lib/queryClient";
import type { TmdbListResponse } from "@/lib/services/tmdb";
import { mapTmdb, type MediaType, type TmdbItem } from "@/lib/tmdbItem";
import { notifyRadar } from "./notify";
import type { RadarAlert, RadarEntry } from "./types";

const SAMPLE: RadarEntry = {
  id: "dev",
  item: {
    id: 0,
    mediaType: "tv",
    title: "Série de test",
    originalTitle: "Série de test",
    posterPath: null,
    year: "2026",
    voteAverage: 0,
    overview: "",
  },
  season: 1,
  expectation: { language: "vf", resolution: "1080p", mode: "soft" },
  known: {},
  baseline: [],
  alerts: [],
  packs: {},
  episodes: [],
  aired: [],
  addedAt: 0,
};

// N'importe quelle oeuvre déjà en cache (grilles Découverte), pour voir la
// notification avec une vraie affiche et un vrai titre.
function randomCachedItem(): TmdbItem | null {
  const items = queryClient
    .getQueriesData<TmdbListResponse>({ queryKey: ["tmdb", "feed"] })
    .flatMap(([key, data]) =>
      (data?.results ?? [])
        .filter((r) => r.poster_path)
        .map((r) => mapTmdb(r, key[3] as MediaType)),
    );
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

export function notifyRadarTest(level: RadarAlert["level"], onOpen: () => void): void {
  const item = randomCachedItem() ?? SAMPLE.item;
  const isMovie = item.mediaType === "movie";
  const alert: RadarAlert = {
    content: isMovie ? "movie" : "e6",
    level,
    version:
      level === "full"
        ? { language: "vf", resolution: "1080p" }
        : { language: "vostfr", resolution: "720p" },
    detectedAt: 0,
  };
  notifyRadar([{ entry: { ...SAMPLE, item, season: isMovie ? null : 1 }, alert }], onOpen);
}
