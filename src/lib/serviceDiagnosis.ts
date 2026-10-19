// Interprétation pure des sondes de santé : à partir de ce qu'on a pu joindre,
// détermine qui est fautif (connexion de l'utilisateur, service, blocage FAI).

export type MonitoredService = "C411" | "AllDebrid";
export const MONITORED_SERVICES: MonitoredService[] = ["C411", "AllDebrid"];

export type HealthCause = "internet" | "outage" | "blocked" | "api";

// Résultat d'un appel réel à l'API C411 (avec la clé de l'utilisateur).
export type ApiProbe = "ok" | "auth" | "dns" | "unreachable" | "error" | "nokey";
// Synthèse de status.c411.org.
export type StatusPageProbe = "ok" | "outage" | "unreachable";

export interface Diagnosis {
  ok: boolean;
  cause?: HealthCause;
  message?: string;
}

export const CAUSE_LABELS: Record<HealthCause, string> = {
  internet: "Connexion internet coupée",
  outage: "Service en panne",
  blocked: "Accès bloqué",
  api: "API en erreur",
};

const OK: Diagnosis = { ok: true };
const NO_INTERNET: Diagnosis = {
  ok: false,
  cause: "internet",
  message: "Votre connexion internet semble coupée.",
};

export function diagnoseC411(p: {
  internet: boolean;
  statusPage: StatusPageProbe;
  api: ApiProbe;
}): Diagnosis {
  if (!p.internet) return NO_INTERNET;
  // Clé refusée : problème de réglage, déjà expliqué par le message d'erreur habituel.
  if (p.api === "ok" || p.api === "auth") return OK;
  if (p.statusPage === "outage")
    return {
      ok: false,
      cause: "outage",
      message: "C411 est en panne, confirmé par sa page de statut.",
    };
  if (p.api === "dns")
    return {
      ok: false,
      cause: "blocked",
      message: "Votre fournisseur d'accès semble bloquer C411. Changez de DNS (voir l'aide).",
    };
  if (p.statusPage === "unreachable")
    return {
      ok: false,
      cause: "outage",
      message: "C411 et sa page de statut sont injoignables : panne probable côté C411.",
    };
  if (p.api === "nokey") return OK;
  if (p.api === "unreachable")
    return {
      ok: false,
      cause: "blocked",
      message:
        "C411 est en ligne selon sa page de statut, mais injoignable depuis votre connexion. Essayez de changer de DNS.",
    };
  return {
    ok: false,
    cause: "api",
    message: "Le site C411 est en ligne, mais son API renvoie des erreurs.",
  };
}

export function diagnoseAllDebrid(p: { internet: boolean; ping: boolean }): Diagnosis {
  if (!p.internet) return NO_INTERNET;
  if (p.ping) return OK;
  return {
    ok: false,
    cause: "outage",
    message: "AllDebrid ne répond pas : panne probable côté AllDebrid.",
  };
}
