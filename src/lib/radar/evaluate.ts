import type { ReleaseScope } from "@/lib/parseRelease";
import type {
  ContentKey,
  KnownVersion,
  KnownVersions,
  RadarAlert,
  RadarEntry,
  RadarRelease,
} from "./types";
import { matchesExpectation, sameVersion, toKnownVersion } from "./versions";

export interface EvaluateResult {
  known: KnownVersions;
  baseline: ContentKey[];
  alerts: RadarAlert[];
  newAlerts: RadarAlert[];
}

const episodeKey = (episode: number): ContentKey => `e${episode}`;

export function releaseContents(
  scope: ReleaseScope | null,
  season: number | null,
  aired: number[],
): ContentKey[] {
  if (season === null) return ["movie"];
  if (scope?.kind === "episode") return scope.season === season ? [episodeKey(scope.episode)] : [];
  if (scope?.kind !== "season" || scope.season !== season) return [];
  if (!scope.range) return aired.map(episodeKey);
  const keys: ContentKey[] = [];
  for (let n = scope.range.from; n <= scope.range.to; n++) keys.push(episodeKey(n));
  return keys;
}

export function hasExpected(entry: RadarEntry, content: ContentKey): boolean {
  return (entry.known?.[content] ?? []).some((v) => matchesExpectation(v, entry.expectation));
}

export function isComplete(entry: RadarEntry): boolean {
  if (entry.season === null) return hasExpected(entry, "movie");
  return (
    entry.episodes.length > 0 && entry.episodes.every((n) => hasExpected(entry, episodeKey(n)))
  );
}

export function nextMissingEpisode(entry: RadarEntry): number | null {
  return entry.episodes.find((n) => !hasExpected(entry, episodeKey(n))) ?? null;
}

function observedVersions(
  entry: RadarEntry,
  releases: RadarRelease[],
): Map<ContentKey, KnownVersion[]> {
  const observed = new Map<ContentKey, KnownVersion[]>();
  for (const release of releases) {
    const version = toKnownVersion(release);
    for (const content of releaseContents(release.scope, entry.season, entry.aired)) {
      const versions = observed.get(content) ?? [];
      if (!versions.some((v) => sameVersion(v, version))) versions.push(version);
      observed.set(content, versions);
    }
  }
  return observed;
}

export function evaluateReleases(
  entry: RadarEntry,
  releases: RadarRelease[],
  owned: Set<ContentKey>,
  now: number,
): EvaluateResult {
  const isBaseline = entry.known === null;
  const known: KnownVersions = { ...entry.known };
  const newAlerts: RadarAlert[] = [];
  const replaced = new Set<ContentKey>();
  const observed = observedVersions(entry, releases);

  for (const [content, versions] of observed) {
    const before = known[content] ?? [];
    const fresh = versions.filter((v) => !before.some((b) => sameVersion(b, v)));
    known[content] = [...before, ...fresh];
    if (isBaseline || owned.has(content)) continue;

    const matches = (v: KnownVersion) => matchesExpectation(v, entry.expectation);
    if (before.some(matches)) continue;

    const expected = fresh.find(matches);
    if (expected) {
      newAlerts.push({ content, level: "full", version: expected, detectedAt: now });
      replaced.add(content);
    } else if (entry.expectation.mode === "soft") {
      for (const version of fresh) {
        newAlerts.push({ content, level: "partial", version, detectedAt: now });
      }
    }
  }

  return {
    known,
    baseline: isBaseline ? [...observed.keys()] : entry.baseline,
    alerts: [...entry.alerts.filter((a) => !replaced.has(a.content)), ...newAlerts],
    newAlerts,
  };
}
