import { fetch } from "@tauri-apps/plugin-http";

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
  const res = await fetch(`${AD_BASE}.1/magnet/status?agent=c411`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const json = (await res.json()) as {
    status: string;
    data?: { magnets?: MagnetEntry[] };
  };
  if (json.status !== "success") throw new Error("Erreur AllDebrid");
  return json.data?.magnets ?? [];
}
