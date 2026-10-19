import { fetchWithTimeout, NetworkError, readJson } from "@/lib/networkError";

const AD_BASE = "https://api.alldebrid.com/v4";

export interface MagnetEntry {
  id: number;
  filename: string;
  size: number;
  status: string;
  statusCode: number;
  downloaded: number;
  seeders: number;
  downloadSpeed: number;
  uploadDate: number;
  completionDate: number;
}

// Codes AllDebrid : 0-3 = en cours (queue/download/compress/upload),
// 4 = prêt, >= 5 = erreur.
export function isMagnetActive(m: MagnetEntry): boolean {
  return m.statusCode >= 0 && m.statusCode <= 3;
}

export function isMagnetReady(m: MagnetEntry): boolean {
  return m.statusCode === 4;
}

export function isMagnetError(m: MagnetEntry): boolean {
  return m.statusCode >= 5;
}

// Réponse { status: "error" } : message selon le code AllDebrid renvoyé.
export function allDebridApiError(json: { error?: { code?: string } }): NetworkError {
  const code = json.error?.code;
  const message = code?.startsWith("AUTH_")
    ? "Clé API AllDebrid invalide ou refusée. Vérifiez-la dans les paramètres."
    : code === "MAINTENANCE"
      ? "AllDebrid est en maintenance. Réessayez plus tard."
      : `AllDebrid a refusé la demande${code ? ` (${code})` : ""}.`;
  return new NetworkError("AllDebrid", "http", message);
}

export const allDebridKeys = {
  magnets: () => ["alldebrid", "magnets"] as const,
  // Sous la clé magnets : invalider la liste invalide aussi ces statuts.
  magnetStatuses: (ids: number[]) => ["alldebrid", "magnets", "status", ids.join(",")] as const,
};

export async function deleteMagnet(apiKey: string, id: number): Promise<void> {
  const res = await fetchWithTimeout("AllDebrid", `${AD_BASE}/magnet/delete?agent=c411&id=${id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const json = await readJson<{ status: string; error?: { code?: string } }>("AllDebrid", res);
  if (json.status !== "success") throw allDebridApiError(json);
}

export async function fetchMagnets(apiKey: string): Promise<MagnetEntry[]> {
  const res = await fetchWithTimeout("AllDebrid", `${AD_BASE}.1/magnet/status?agent=c411`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const json = await readJson<{
    status: string;
    error?: { code?: string };
    data?: { magnets?: MagnetEntry[] };
  }>("AllDebrid", res);
  if (json.status !== "success") throw allDebridApiError(json);
  return json.data?.magnets ?? [];
}

// Statut d'un seul magnet : l'API n'accepte qu'un id par appel. Un magnet
// supprimé entre-temps du compte (MAGNET_INVALID_ID) renvoie undefined : il ne
// doit pas bloquer le suivi des autres. L'API répond alors 200 ou 4xx selon les
// cas ; clé refusée et limite de débit restent des erreurs.
async function fetchMagnet(apiKey: string, id: number): Promise<MagnetEntry | undefined> {
  let res: Response;
  try {
    res = await fetchWithTimeout("AllDebrid", `${AD_BASE}.1/magnet/status?agent=c411&id=${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch (err) {
    const status = err instanceof NetworkError ? err.status : undefined;
    if (status && status >= 400 && status < 500 && ![401, 403, 429].includes(status)) {
      return undefined;
    }
    throw err;
  }
  const json = await readJson<{
    status: string;
    error?: { code?: string };
    data?: { magnets?: MagnetEntry[] | MagnetEntry };
  }>("AllDebrid", res);
  if (json.error?.code === "MAGNET_INVALID_ID") return undefined;
  if (json.status !== "success") throw allDebridApiError(json);
  // La doc montre un tableau ; l'API v4 renvoyait l'objet seul quand un id
  // était précisé. Les deux formes sont acceptées.
  const magnets = json.data?.magnets;
  return Array.isArray(magnets) ? magnets[0] : magnets;
}

// Au-delà, un appel par magnet dépasserait la limite AllDebrid (12 requêtes/s,
// appels en parallèle) : la liste complète redevient le moindre mal.
const MAX_SINGLE_CALLS = 10;

// Statuts des seuls magnets suivis : quelques Ko au lieu de la liste complète
// du compte, qui peut peser lourd quand elle est relue toutes les 5 s.
export async function fetchMagnetStatuses(apiKey: string, ids: number[]): Promise<MagnetEntry[]> {
  if (ids.length > MAX_SINGLE_CALLS) {
    const wanted = new Set(ids);
    return (await fetchMagnets(apiKey)).filter((m) => wanted.has(m.id));
  }
  const magnets = await Promise.all(ids.map((id) => fetchMagnet(apiKey, id)));
  return magnets.filter((m): m is MagnetEntry => m !== undefined);
}

// true si AllDebrid accepte la cle, false si elle est refusee. Les autres
// erreurs reseau remontent : hors-ligne, impossible de trancher.
export async function validateKey(apiKey: string): Promise<boolean> {
  let res: Response;
  try {
    res = await fetchWithTimeout("AllDebrid", `${AD_BASE}/user?agent=c411`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch (err) {
    if (err instanceof NetworkError && (err.status === 401 || err.status === 403)) return false;
    throw err;
  }
  // AllDebrid repond 200 avec { status: "error" } sur une cle invalide.
  const json = await readJson<{ status: string }>("AllDebrid", res);
  return json.status === "success";
}
