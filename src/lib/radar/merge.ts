import type {
  ContentKey,
  KnownVersion,
  KnownVersions,
  RadarAlert,
  RadarEntry,
  RadarExpectation,
} from "./types";
import { sameVersion } from "./versions";

export interface EntryUpdate {
  expectation: RadarExpectation;
  known: KnownVersions;
  baseline: ContentKey[];
  newAlerts: RadarAlert[];
  replaced: ContentKey[];
  packs: Record<string, number[]>;
  episodes: number[];
  aired: number[];
}

const sameExpectation = (a: RadarExpectation, b: RadarExpectation) =>
  a.language === b.language && a.resolution === b.resolution && a.mode === b.mode;

function unionKnown(current: KnownVersions | null, next: KnownVersions): KnownVersions {
  const known: KnownVersions = { ...current };
  for (const [content, versions] of Object.entries(next)) {
    const merged: KnownVersion[] = [...(known[content] ?? [])];
    for (const v of versions) if (!merged.some((m) => sameVersion(m, v))) merged.push(v);
    known[content] = merged;
  }
  return known;
}

// Une vérification peut durer : le résultat s'applique à l'état courant de la
// ligne, et une ligne supprimée ou réglée autrement entre-temps l'ignore.
export function mergeUpdates(
  entries: RadarEntry[],
  updates: Map<string, EntryUpdate>,
): RadarEntry[] {
  return entries.map((entry) => {
    const update = updates.get(entry.id);
    if (!update || !sameExpectation(update.expectation, entry.expectation)) return entry;
    return {
      ...entry,
      known: unionKnown(entry.known, update.known),
      baseline: update.baseline,
      packs: { ...update.packs, ...entry.packs },
      alerts: [
        ...entry.alerts.filter((a) => !update.replaced.includes(a.content)),
        ...update.newAlerts,
      ],
      episodes: update.episodes,
      aired: update.aired,
    };
  });
}
