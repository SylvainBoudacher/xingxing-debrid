import { getApiKey } from "@/lib/apiKeys";
import { isBrowserPreview } from "@/lib/devTauriShim";
import { httpFetch, NetworkError } from "@/lib/networkError";
import { searchTorrents } from "@/lib/services/c411";
import type { ApiProbe, StatusPageProbe } from "@/lib/serviceDiagnosis";

const PROBE_TIMEOUT_MS = 8_000;

// status.c411.org (Gatus) n'envoie pas d'en-têtes CORS : proxy Vite en preview.
const STATUS_BASE = isBrowserPreview ? "/c411-status-proxy" : "https://status.c411.org";

// Seuls les monitors qui reflètent ce que voit l'utilisateur (pas les backups).
const C411_MONITORS = [
  { key: "nginx_nginx-is-healthy", label: "Serveur web" },
  { key: "_host-is-alive", label: "Machine hôte" },
  { key: "frontend_login-is-rendered", label: "Site web" },
];
const HISTORY_SIZE = 40;

export interface ProbeSample {
  success: boolean;
  timestamp: number;
  durationMs?: number;
}

export interface StatusMonitor {
  key: string;
  label: string;
  results: ProbeSample[];
}

async function timed(url: string, init: RequestInit = {}): Promise<number> {
  const start = performance.now();
  const res = await httpFetch(url, { ...init, signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
  if (!res.ok && res.type !== "opaque") throw new Error(`HTTP ${res.status}`);
  return Math.round(performance.now() - start);
}

// Deux opérateurs différents : un seul joignable suffit à prouver que la
// connexion fonctionne.
export function probeInternet(): Promise<boolean> {
  const attempts = [
    timed("https://1.1.1.1/cdn-cgi/trace"),
    timed("https://www.google.com/generate_204", { mode: "no-cors" }),
  ];
  return new Promise((resolve) => {
    let left = attempts.length;
    for (const a of attempts)
      a.then(
        () => resolve(true),
        () => --left === 0 && resolve(false),
      );
  });
}

export async function probeAllDebrid(): Promise<ProbeSample> {
  const timestamp = Date.now();
  try {
    const durationMs = await timed("https://api.alldebrid.com/v4/ping");
    return { success: true, timestamp, durationMs };
  } catch {
    return { success: false, timestamp };
  }
}

export async function probeStatusPage(): Promise<{
  status: StatusPageProbe;
  monitors: StatusMonitor[];
}> {
  const monitors = await Promise.all(
    C411_MONITORS.map(async ({ key, label }): Promise<StatusMonitor | null> => {
      try {
        const res = await httpFetch(
          `${STATUS_BASE}/api/v1/endpoints/${key}/statuses?pageSize=${HISTORY_SIZE}`,
          { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) },
        );
        if (!res.ok) return null;
        const json = (await res.json()) as {
          results: { success: boolean; timestamp: string; duration: number }[];
        };
        const results = json.results.map((r) => ({
          success: r.success,
          timestamp: Date.parse(r.timestamp),
          durationMs: Math.round(r.duration / 1e6),
        }));
        return { key, label, results };
      } catch {
        return null;
      }
    }),
  );
  const ok = monitors.filter((m): m is StatusMonitor => m !== null);
  if (ok.length === 0) return { status: "unreachable", monitors: [] };
  const down = ok.some((m) => m.results[m.results.length - 1]?.success === false);
  return { status: down ? "outage" : "ok", monitors: ok };
}

// Vrai appel API avec la clé de l'utilisateur : seul moyen de savoir si l'API
// répond, status.c411.org ne la surveille pas.
export async function probeC411Api(): Promise<{ result: ApiProbe; durationMs?: number }> {
  const key = await getApiKey("c411_api_key");
  if (!key) return { result: "nokey" };
  const start = performance.now();
  try {
    await searchTorrents(
      { name: "a", page: 1, perPage: 1, sortBy: "publishedAt", sortOrder: "desc" },
      key,
    );
    return { result: "ok", durationMs: Math.round(performance.now() - start) };
  } catch (err) {
    if (!(err instanceof NetworkError)) return { result: "error" };
    if (err.status === 401 || err.status === 403) return { result: "auth" };
    if (err.kind === "offline" && /dns|lookup|resolve|not ?found/i.test(String(err.rawCause)))
      return { result: "dns" };
    if (err.kind === "offline" || err.kind === "timeout") return { result: "unreachable" };
    return { result: "error" };
  }
}
