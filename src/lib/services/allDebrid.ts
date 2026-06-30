import { fetchWithTimeout, NetworkError } from "@/lib/networkError";

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

export const allDebridKeys = {
  magnets: () => ["alldebrid", "magnets"] as const,
};

export async function fetchMagnets(apiKey: string): Promise<MagnetEntry[]> {
  const res = await fetchWithTimeout("AllDebrid", `${AD_BASE}.1/magnet/status?agent=c411`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const json = (await res.json()) as {
    status: string;
    data?: { magnets?: MagnetEntry[] };
  };
  if (json.status !== "success") throw new NetworkError("AllDebrid", "http");
  return json.data?.magnets ?? [];
}
