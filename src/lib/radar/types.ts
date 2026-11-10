import type { ReleaseTags } from "@/lib/releaseTags";
import type { TmdbItem } from "@/lib/tmdbItem";

export type RadarMode = "strict" | "soft";
export type ExpectedLanguage = "vf" | "vostfr" | "any";
export type ExpectedResolution = "any" | "720p" | "1080p" | "2160p";

export interface RadarExpectation {
  language: ExpectedLanguage;
  resolution: ExpectedResolution;
  mode: RadarMode;
}

export type LanguageGroup = "vf" | "vostfr" | "vo" | "unknown";

export interface KnownVersion {
  language: LanguageGroup;
  resolution: string | null;
}

// "movie" pour un film, "e6" pour l'épisode 6 de la saison suivie.
export type ContentKey = string;
export type KnownVersions = Record<ContentKey, KnownVersion[]>;

export interface RadarAlert {
  content: ContentKey;
  level: "full" | "partial";
  version: KnownVersion;
  detectedAt: number;
}

export interface RadarEntry {
  id: string;
  item: TmdbItem;
  season: number | null;
  expectation: RadarExpectation;
  // null tant que le point de départ n'a pas pu être établi (C411 injoignable à
  // l'ajout) : le premier passage réussi reste alors silencieux.
  known: KnownVersions | null;
  baseline: ContentKey[];
  alerts: RadarAlert[];
  // Épisodes couverts par chaque pack (par infoHash), figés à sa première apparition.
  packs: Record<string, number[]>;
  episodes: number[];
  aired: number[];
  addedAt: number;
}

export type RadarRelease = Pick<ReleaseTags, "languages" | "resolution" | "scope"> & {
  infoHash: string;
  // Présente dans les dernières publications : seule une telle release peut alerter.
  recent: boolean;
};
