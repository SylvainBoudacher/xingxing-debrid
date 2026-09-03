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

export const allDebridKeys = {
  magnets: () => ["alldebrid", "magnets"] as const,
};

export async function deleteMagnet(apiKey: string, id: number): Promise<void> {
  const res = await fetchWithTimeout("AllDebrid", `${AD_BASE}/magnet/delete?agent=c411&id=${id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const json = await readJson<{ status: string }>("AllDebrid", res);
  if (json.status !== "success") throw new NetworkError("AllDebrid", "http");
}

export async function fetchMagnets(apiKey: string): Promise<MagnetEntry[]> {
  const res = await fetchWithTimeout("AllDebrid", `${AD_BASE}.1/magnet/status?agent=c411`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const json = await readJson<{
    status: string;
    data?: { magnets?: MagnetEntry[] };
  }>("AllDebrid", res);
  if (json.status !== "success") throw new NetworkError("AllDebrid", "http");
  return json.data?.magnets ?? [];
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
