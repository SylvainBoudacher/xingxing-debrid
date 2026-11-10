import type { ContentKey, KnownVersions, RadarAlert, RadarEntry, RadarExpectation } from "./types";

export interface EntryUpdate {
  expectation: RadarExpectation;
  known: KnownVersions;
  baseline: ContentKey[];
  alerts: RadarAlert[];
  episodes: number[];
  aired: number[];
}

const sameExpectation = (a: RadarExpectation, b: RadarExpectation) =>
  a.language === b.language && a.resolution === b.resolution && a.mode === b.mode;

// Une vérification peut durer : une ligne supprimée ou réglée autrement entre-temps
// ne reçoit pas un résultat calculé sur un état périmé.
export function mergeUpdates(
  entries: RadarEntry[],
  updates: Map<string, EntryUpdate>,
): RadarEntry[] {
  return entries.map((entry) => {
    const update = updates.get(entry.id);
    if (!update || !sameExpectation(update.expectation, entry.expectation)) return entry;
    return { ...entry, ...update };
  });
}
