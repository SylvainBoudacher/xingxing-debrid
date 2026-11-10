import type { LibraryEntry } from "@/lib/library";
import type { TmdbEpisode } from "@/lib/services/tmdb";
import { evaluateReleases, isComplete } from "./evaluate";
import type { EntryUpdate } from "./merge";
import { ownedContents } from "./ownership";
import type { RadarAlert, RadarEntry, RadarRelease } from "./types";

export interface RadarCheckDeps {
  fetchReleases(entry: RadarEntry): Promise<RadarRelease[]>;
  fetchEpisodes(entry: RadarEntry): Promise<TmdbEpisode[]>;
  library: LibraryEntry[];
  now: number;
  today: string;
}

export interface RadarCheckResult {
  updates: Map<string, EntryUpdate>;
  failed: string[];
  newAlerts: { entry: RadarEntry; alert: RadarAlert }[];
}

const CHECK_CONCURRENCY = 2;

export function shouldCheck(entry: RadarEntry): boolean {
  return !isComplete(entry);
}

async function checkEntry(
  entry: RadarEntry,
  deps: RadarCheckDeps,
): Promise<{ update: EntryUpdate; newAlerts: RadarAlert[] }> {
  const [tmdbEpisodes, releases] = await Promise.all([
    entry.season === null ? Promise.resolve([]) : deps.fetchEpisodes(entry),
    deps.fetchReleases(entry),
  ]);
  const episodes = tmdbEpisodes.map((e) => e.episode_number);
  const aired = tmdbEpisodes
    .filter((e) => !!e.air_date && e.air_date <= deps.today)
    .map((e) => e.episode_number);
  const current = { ...entry, episodes, aired };
  const { certain } = ownedContents(current, deps.library);
  const { known, baseline, alerts, newAlerts } = evaluateReleases(
    current,
    releases,
    certain,
    deps.now,
  );
  return {
    update: { expectation: entry.expectation, known, baseline, alerts, episodes, aired },
    newAlerts,
  };
}

export async function checkEntries(
  entries: RadarEntry[],
  deps: RadarCheckDeps,
): Promise<RadarCheckResult> {
  const result: RadarCheckResult = { updates: new Map(), failed: [], newAlerts: [] };
  const outcomes = new Array<Awaited<ReturnType<typeof checkEntry>> | null>(entries.length);
  let next = 0;

  async function worker() {
    while (next < entries.length) {
      const index = next++;
      outcomes[index] = await checkEntry(entries[index], deps).catch(() => null);
    }
  }
  await Promise.all(Array.from({ length: CHECK_CONCURRENCY }, worker));

  entries.forEach((entry, index) => {
    const outcome = outcomes[index];
    if (!outcome) {
      result.failed.push(entry.id);
      return;
    }
    result.updates.set(entry.id, outcome.update);
    for (const alert of outcome.newAlerts) result.newAlerts.push({ entry, alert });
  });
  return result;
}
