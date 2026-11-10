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
  replaced: ContentKey[];
  packs: Record<string, number[]>;
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

interface ObservedVersion {
  version: KnownVersion;
  recent: boolean;
}

// Un pack ne couvre que les épisodes diffusés quand il est apparu : relire
// `aired` à chaque passage lui attribuerait aussi les épisodes suivants.
function coveredContents(
  release: RadarRelease,
  entry: RadarEntry,
  packs: Record<string, number[]>,
): ContentKey[] {
  const { scope, infoHash } = release;
  if (entry.season === null || scope?.kind !== "season" || scope.range) {
    return releaseContents(scope, entry.season, entry.aired);
  }
  if (scope.season !== entry.season) return [];
  packs[infoHash] ??= [...entry.aired];
  return packs[infoHash].map(episodeKey);
}

function observedVersions(
  entry: RadarEntry,
  releases: RadarRelease[],
  packs: Record<string, number[]>,
): Map<ContentKey, ObservedVersion[]> {
  const observed = new Map<ContentKey, ObservedVersion[]>();
  for (const release of releases) {
    const version = toKnownVersion(release);
    for (const content of coveredContents(release, entry, packs)) {
      const versions = observed.get(content) ?? [];
      const existing = versions.find((v) => sameVersion(v.version, version));
      if (existing) existing.recent ||= release.recent;
      else versions.push({ version, recent: release.recent });
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
  const packs = { ...entry.packs };
  const newAlerts: RadarAlert[] = [];
  const replaced: ContentKey[] = [];
  const observed = observedVersions(entry, releases, packs);
  const matches = (v: KnownVersion) => matchesExpectation(v, entry.expectation);

  for (const [content, versions] of observed) {
    const before = known[content] ?? [];
    const fresh = versions.filter((o) => !before.some((b) => sameVersion(b, o.version)));
    known[content] = [...before, ...fresh.map((o) => o.version)];
    if (isBaseline || owned.has(content) || before.some(matches)) continue;

    const alertable = fresh.filter((o) => o.recent).map((o) => o.version);
    const expected = alertable.find(matches);
    if (expected) {
      newAlerts.push({ content, level: "full", version: expected, detectedAt: now });
      replaced.push(content);
    } else if (entry.expectation.mode === "soft" && !known[content].some(matches)) {
      for (const version of alertable) {
        newAlerts.push({ content, level: "partial", version, detectedAt: now });
      }
    }
  }

  return {
    known,
    baseline: isBaseline ? [...observed.keys()] : entry.baseline,
    alerts: [...entry.alerts.filter((a) => !replaced.includes(a.content)), ...newAlerts],
    newAlerts,
    replaced,
    packs,
  };
}
