import { fetchWithTimeout } from "@/lib/networkError";
import { isBrowserPreview } from "@/lib/devTauriShim";
import type { C411Torrent } from "@/lib/c411";

// En preview navigateur, C411 n'autorise pas le CORS : on passe par le proxy
// Vite /c411-proxy (voir vite.config.ts), dev uniquement.
const BASE = isBrowserPreview ? "/c411-proxy" : "https://c411.org";

export interface C411SearchResponse {
  data: C411Torrent[];
  meta: { total: number; page: number; totalPages: number };
}

export interface C411SearchParams {
  name: string;
  page: number;
  perPage: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

// La cle API n'entre pas dans la queryKey : une rotation de cle ne doit pas
// fragmenter le cache, et le secret ne doit pas trainer dans les cles de cache.
export const c411Keys = {
  search: (p: C411SearchParams) =>
    ["c411", "search", p.name, p.page, p.perPage, p.sortBy, p.sortOrder] as const,
};

export async function searchTorrents(
  p: C411SearchParams,
  apiKey: string,
): Promise<C411SearchResponse> {
  const url = `${BASE}/api/torrents?page=${p.page}&perPage=${p.perPage}&sortBy=${p.sortBy}&sortOrder=${p.sortOrder}&name=${encodeURIComponent(p.name)}&apikey=${apiKey}`;
  const res = await fetchWithTimeout("C411", url);
  return (await res.json()) as C411SearchResponse;
}
