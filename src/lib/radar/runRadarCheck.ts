import { getApiKey } from "@/lib/apiKeys";
import { loadLibrary } from "@/lib/library";
import { queryClient } from "@/lib/queryClient";
import { tmdbKeys, tvSeason } from "@/lib/services/tmdb";
import { TMDB_STALE_MS } from "@/lib/tmdbCache";
import { checkEntries, shouldCheck, type RadarCheckDeps } from "./check";
import { notifyRadar } from "./notify";
import { applyCheckResult, getRadarState, loadRadar, setRadarChecking } from "./radarStore";
import { fetchRadarReleases } from "./releases";

async function buildDeps(): Promise<RadarCheckDeps | null> {
  const [c411Key, tmdbKey] = await Promise.all([
    getApiKey("c411_api_key"),
    getApiKey("tmdb_api_key"),
  ]);
  if (!c411Key || !tmdbKey) return null;
  return {
    fetchReleases: (entry) => fetchRadarReleases(entry, c411Key),
    fetchEpisodes: async ({ item, season }) => {
      const detail = await queryClient.fetchQuery({
        queryKey: tmdbKeys.tvSeason(item.id, season!),
        queryFn: () => tvSeason(item.id, season!, tmdbKey),
        staleTime: TMDB_STALE_MS,
      });
      return detail.episodes ?? [];
    },
    library: await loadLibrary(),
    now: Date.now(),
    today: new Date().toISOString().slice(0, 10),
  };
}

async function run({ onOpenRadar, silent }: RadarCheckOptions): Promise<void> {
  await loadRadar();
  setRadarChecking(true);
  try {
    const deps = await buildDeps();
    if (!deps) return;
    const entries = getRadarState().entries.filter(shouldCheck);
    const { updates, failed, newAlerts } = await checkEntries(entries, deps);
    applyCheckResult(updates, failed.length === 0 ? deps.now : null);
    if (silent) return;
    const current = getRadarState().entries;
    notifyRadar(
      newAlerts.filter(({ entry, alert }) =>
        current.find((e) => e.id === entry.id)?.alerts.includes(alert),
      ),
      onOpenRadar,
    );
  } finally {
    setRadarChecking(false);
  }
}

export interface RadarCheckOptions {
  onOpenRadar?: () => void;
  silent?: boolean;
}

let running: Promise<void> | null = null;

export function runRadarCheck(options: RadarCheckOptions = {}): Promise<void> {
  running ??= run(options).finally(() => {
    running = null;
  });
  return running;
}

// Après un ajout ou une modification : établit l'état de la ligne sans notifier.
export async function checkRadarEntry(id: string): Promise<void> {
  const entry = getRadarState().entries.find((e) => e.id === id);
  if (!entry) return;
  const deps = await buildDeps();
  if (!deps) return;
  const { updates } = await checkEntries([entry], deps);
  const update = updates.get(id);
  if (!update) return;
  applyCheckResult(new Map([[id, { ...update, newAlerts: [], replaced: [] }]]), null);
}
