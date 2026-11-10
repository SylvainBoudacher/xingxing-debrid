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
  episodes: [],
  aired: [],
  addedAt: 0,
};

export function notifyRadarTest(level: RadarAlert["level"], onOpen: () => void): void {
  const alert: RadarAlert = {
    content: "e6",
    level,
    version: { language: "vostfr", resolution: "720p" },
    detectedAt: 0,
  };
  notifyRadar([{ entry: SAMPLE, alert }], onOpen);
}
