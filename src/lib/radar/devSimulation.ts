import { randomCachedItem, SAMPLE } from "./devNotification";
import { notifyRadar } from "./notify";
import {
  addRadarEntry,
  applyCheckResult,
  removeRadarEntries,
  setRadarChecking,
  SIMULATED_ENTRY_ID,
} from "./radarStore";
import type { KnownVersion, KnownVersions, RadarAlert, RadarEntry } from "./types";

const CHECK_MS = 4_000;
const EPISODES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const FOUND_EPISODE = 5;
const VERSION: KnownVersion = { language: "vf", resolution: "1080p" };

// Saison en cours de diffusion : les épisodes 1 à 4 sont déjà sortis, la
// vérification trouve le 5 et il en reste 5 à venir.
export function simulateRadarCheck(): void {
  const known: KnownVersions = Object.fromEntries(
    EPISODES.slice(0, FOUND_EPISODE - 1).map((n) => [`e${n}`, [VERSION]]),
  );
  const entry: RadarEntry = {
    ...SAMPLE,
    id: SIMULATED_ENTRY_ID,
    item: randomCachedItem("tv") ?? SAMPLE.item,
    known,
    baseline: ["e1", "e2"],
    episodes: EPISODES,
    aired: EPISODES.slice(0, FOUND_EPISODE - 1),
    addedAt: Date.now(),
  };
  removeRadarEntries([SIMULATED_ENTRY_ID]);
  addRadarEntry(entry);
  setRadarChecking(true);

  setTimeout(() => {
    const content = `e${FOUND_EPISODE}`;
    const alert: RadarAlert = {
      content,
      level: "full",
      version: VERSION,
      detectedAt: Date.now(),
    };
    applyCheckResult(
      new Map([
        [
          entry.id,
          {
            expectation: entry.expectation,
            known: { [content]: [VERSION] },
            baseline: entry.baseline,
            newAlerts: [alert],
            replaced: [content],
            packs: {},
            episodes: EPISODES,
            aired: EPISODES.slice(0, FOUND_EPISODE),
          },
        ],
      ]),
      null,
    );
    setRadarChecking(false);
    notifyRadar([{ entry, alert }]);
  }, CHECK_MS);
}
