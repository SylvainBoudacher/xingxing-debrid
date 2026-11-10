import { RESOLUTION_RANK } from "@/lib/discoverReleases";
import type { KnownVersion, LanguageGroup, RadarExpectation, RadarRelease } from "./types";

const VF_TOKENS = new Set(["MULTI", "VFF", "VFQ", "VF2", "TRUEFRENCH", "FRENCH", "VF"]);

const LANGUAGE_LABELS: Record<LanguageGroup, string> = {
  vf: "VF",
  vostfr: "VOSTFR",
  vo: "VO",
  unknown: "",
};

export function languageGroupOf(languages: string[]): LanguageGroup {
  if (languages.some((l) => VF_TOKENS.has(l))) return "vf";
  if (languages.includes("VOSTFR")) return "vostfr";
  if (languages.includes("VO")) return "vo";
  return "unknown";
}

export function toKnownVersion(release: RadarRelease): KnownVersion {
  return { language: languageGroupOf(release.languages), resolution: release.resolution };
}

export function matchesExpectation(version: KnownVersion, expected: RadarExpectation): boolean {
  if (expected.language !== "any" && version.language !== expected.language) return false;
  if (expected.resolution === "any") return true;
  const rank = RESOLUTION_RANK[version.resolution ?? ""] ?? 0;
  return rank >= RESOLUTION_RANK[expected.resolution];
}

export function sameVersion(a: KnownVersion, b: KnownVersion): boolean {
  return a.language === b.language && a.resolution === b.resolution;
}

export function versionLabel(version: KnownVersion): string {
  const label = [LANGUAGE_LABELS[version.language], version.resolution].filter(Boolean).join(" ");
  return label || "version non identifiée";
}
