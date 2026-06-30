import { fetch } from "@tauri-apps/plugin-http";
import { toast } from "sonner";

// Délai au-delà duquel un appel réseau est considéré comme un timeout. Aligné
// sur le timeout du client reqwest côté Rust (voir http_client dans lib.rs).
const DEFAULT_TIMEOUT_MS = 20_000;

export type NetworkService = "C411" | "AllDebrid" | "TMDB" | "nyaa.si";
export type NetworkErrorKind = "timeout" | "offline" | "http" | "parse";

// Erreur réseau typée : porte le service fautif et la nature du problème pour
// qu'un message spécifique (et un bouton Réessayer) puisse être affiché.
export class NetworkError extends Error {
  constructor(
    readonly service: NetworkService,
    readonly kind: NetworkErrorKind,
    message?: string,
    readonly status?: number,
  ) {
    super(message ?? defaultMessage(service, kind, status));
    this.name = "NetworkError";
  }
}

function defaultMessage(service: NetworkService, kind: NetworkErrorKind, status?: number): string {
  switch (kind) {
    case "timeout":
      return `${service} ne répond pas (délai dépassé).`;
    case "offline":
      return `Impossible de joindre ${service}. Vérifiez votre connexion.`;
    case "http":
      return `${service} a renvoyé une erreur${status ? ` (${status})` : ""}.`;
    case "parse":
      return `Réponse inattendue de ${service}.`;
  }
}

function classify(service: NetworkService, err: unknown): NetworkError {
  if (err instanceof NetworkError) return err;
  const name = err instanceof Error ? err.name : "";
  const msg = String(err);
  if (name === "TimeoutError" || name === "AbortError" || /timeout|timed out|abort/i.test(msg)) {
    return new NetworkError(service, "timeout");
  }
  return new NetworkError(service, "offline");
}

// fetch avec timeout dur (AbortSignal) qui normalise toute erreur réseau ou HTTP
// en NetworkError. Les services passent par ici plutôt que d'appeler fetch nu.
export async function fetchWithTimeout(
  service: NetworkService,
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    throw classify(service, err);
  }
  if (!res.ok) throw new NetworkError(service, "http", undefined, res.status);
  return res;
}

// Message lisible pour l'utilisateur. Les NetworkError portent déjà un message
// français ; les erreurs Rust (invoke) sont déjà des chaînes formatées.
export function networkErrorMessage(err: unknown): string {
  if (err instanceof NetworkError) return err.message;
  return String(err);
}

// Toast d'erreur réseau, avec un bouton Réessayer optionnel.
export function toastNetworkError(err: unknown, retry?: () => void) {
  toast.error(
    networkErrorMessage(err),
    retry ? { action: { label: "Réessayer", onClick: retry } } : undefined,
  );
}
