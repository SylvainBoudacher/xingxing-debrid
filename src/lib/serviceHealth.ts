import { listen } from "@tauri-apps/api/event";
import { setNetworkObserver } from "@/lib/networkError";
import {
  diagnoseAllDebrid,
  diagnoseC411,
  MONITORED_SERVICES,
  type Diagnosis,
  type HealthCause,
  type MonitoredService,
} from "@/lib/serviceDiagnosis";
import {
  probeAllDebrid,
  probeC411Api,
  probeInternet,
  probeStatusPage,
  type StatusMonitor,
} from "@/lib/serviceProbes";

// Suivi de santé de C411 et AllDebrid. Passif : chaque appel réseau réel
// alimente le store. Les sondes ne partent qu'après un échec (puis toutes les
// CHECK_INTERVAL_MS tant que le service est en panne) ou depuis la page de statut.

export interface ServiceHealth {
  status: "unknown" | "ok" | "down";
  checking: boolean;
  cause?: HealthCause;
  message?: string;
  /** Début de la panne en cours. */
  since?: number;
  checkedAt?: number;
  latencyMs?: number;
}

export interface HealthState {
  internet: boolean | null;
  services: Record<MonitoredService, ServiceHealth>;
  c411Monitors: StatusMonitor[];
}

// Délai minimal entre deux vérifications d'un même service. AllDebrid est
// sondé moins souvent : son ping est un simple signe de vie, inutile de le marteler.
const CHECK_INTERVAL_MS: Record<MonitoredService, number> = {
  C411: 30_000,
  AllDebrid: 120_000,
};

let state: HealthState = {
  internet: null,
  services: {
    C411: { status: "unknown", checking: false },
    AllDebrid: { status: "unknown", checking: false },
  },
  c411Monitors: [],
};

const listeners = new Set<() => void>();
const inFlight = new Map<MonitoredService, Promise<void>>();
const recheckTimers = new Map<MonitoredService, ReturnType<typeof setTimeout>>();

export function subscribeHealth(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getHealth(): HealthState {
  return state;
}

function setState(next: Partial<HealthState>) {
  state = { ...state, ...next };
  listeners.forEach((fn) => fn());
}

function patchService(service: MonitoredService, patch: Partial<ServiceHealth>) {
  setState({
    services: { ...state.services, [service]: { ...state.services[service], ...patch } },
  });
}

function applyDiagnosis(service: MonitoredService, d: Diagnosis, latencyMs?: number) {
  const prev = state.services[service];
  patchService(service, {
    status: d.ok ? "ok" : "down",
    checking: false,
    cause: d.cause,
    message: d.message,
    since: d.ok ? undefined : prev.status === "down" ? prev.since : Date.now(),
    checkedAt: Date.now(),
    latencyMs,
  });
}

async function runCheck(service: MonitoredService) {
  patchService(service, { checking: true });
  if (service === "C411") {
    const [internet, page, api] = await Promise.all([
      probeInternet(),
      probeStatusPage(),
      probeC411Api(),
    ]);
    setState({ internet, c411Monitors: page.monitors });
    applyDiagnosis(
      service,
      diagnoseC411({ internet, statusPage: page.status, api: api.result }),
      api.durationMs,
    );
  } else {
    const [internet, ping] = await Promise.all([probeInternet(), probeAllDebrid()]);
    setState({ internet });
    applyDiagnosis(service, diagnoseAllDebrid({ internet, ping: ping.success }), ping.durationMs);
  }
  scheduleRecheck(service);
}

export function checkService(service: MonitoredService): Promise<void> {
  if (simulated) return Promise.resolve();
  const running = inFlight.get(service);
  if (running) return running;
  const p = runCheck(service).finally(() => inFlight.delete(service));
  inFlight.set(service, p);
  return p;
}

function isFresh(service: MonitoredService): boolean {
  const at = state.services[service].checkedAt;
  return at !== undefined && Date.now() - at < CHECK_INTERVAL_MS[service];
}

// Sans `force`, les services vérifiés récemment sont laissés de côté.
export function checkAllServices(force = false): Promise<void> {
  const due = MONITORED_SERVICES.filter((s) => force || !isFresh(s));
  return Promise.all(due.map(checkService)).then(() => undefined);
}

function scheduleRecheck(service: MonitoredService) {
  clearTimeout(recheckTimers.get(service));
  recheckTimers.delete(service);
  if (state.services[service].status !== "down") return;
  recheckTimers.set(
    service,
    setTimeout(() => checkService(service), CHECK_INTERVAL_MS[service]),
  );
}

function report(service: MonitoredService, ok: boolean) {
  // Les sondes passent elles-mêmes par fetchWithTimeout : on ignore leurs
  // propres résultats pendant une vérification.
  if (simulated || inFlight.has(service)) return;
  const current = state.services[service];
  if (ok) {
    if (current.status === "down") applyDiagnosis(service, { ok: true });
    else if (current.status === "unknown") patchService(service, { status: "ok" });
    return;
  }
  // Panne déjà confirmée : la revérification périodique s'en charge. Service
  // tout juste vérifié et sain : inutile de le resonder à chaque échec.
  if (current.status === "down" || isFresh(service)) return;
  void checkService(service);
}

// Dev : état forcé pour prévisualiser l'interface de panne. Les vraies
// vérifications sont suspendues jusqu'à endHealthSimulation.
let simulated = false;

export function simulateHealth(sim: {
  internet: boolean;
  services: Partial<Record<MonitoredService, Diagnosis>>;
  failMonitors?: boolean;
}) {
  simulated = true;
  recheckTimers.forEach(clearTimeout);
  recheckTimers.clear();
  const c411Monitors = sim.failMonitors
    ? state.c411Monitors.map((m) => ({
        ...m,
        results: m.results.map((r, i) =>
          i >= m.results.length - 6 ? { ...r, success: false } : r,
        ),
      }))
    : state.c411Monitors;
  setState({ internet: sim.internet, c411Monitors });
  for (const s of MONITORED_SERVICES) applyDiagnosis(s, sim.services[s] ?? { ok: true });
}

export function endHealthSimulation(): Promise<void> {
  simulated = false;
  return checkAllServices(true);
}

function isMonitored(service: string): service is MonitoredService {
  return (MONITORED_SERVICES as string[]).includes(service);
}

let initialized = false;

// Branche le suivi passif : appels du frontend (fetchWithTimeout) et erreurs
// réseau des commandes Rust (événement "service-error").
export function initServiceHealth() {
  if (initialized) return;
  initialized = true;
  setNetworkObserver((service, ok) => {
    if (isMonitored(service)) report(service, ok);
  });
  void listen<string>("service-error", (e) => {
    if (isMonitored(e.payload)) report(e.payload, false);
  });
}
