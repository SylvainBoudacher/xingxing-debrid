import { fetchWithTimeout } from "@/lib/networkError";

const BASE = "https://api.mangadex.org";
const COVERS = "https://uploads.mangadex.org/covers";

// Tag "Doujinshi" : exclu partout, ces entrees polluent la recherche (une
// requete "attack on titan" remonte une dizaine de doujinshi avant l'oeuvre).
const DOUJINSHI_TAG = "b13b2a48-c720-44a9-9c77-39c9979373fb";

export const MANGA_PAGE_SIZE = 32;

// Sources du catalogue. MangaDex n'a pas d'endpoint "tendances" : la
// popularite (followedCount) en tient lieu.
export type MangaFeed = "popular" | "top_rated" | "latest";
export const MANGA_FEEDS: MangaFeed[] = ["top_rated", "popular", "latest"];

const FEED_ORDER: Record<MangaFeed, string> = {
  popular: "order[followedCount]=desc",
  top_rated: "order[rating]=desc",
  latest: "order[latestUploadedChapter]=desc",
};

export interface MangaRawRelationship {
  id: string;
  type: string;
  attributes?: { fileName?: string };
}

export interface MangaRaw {
  id: string;
  attributes: {
    // Cle = code langue ("en", "ja-ro", "fr"...). MangaDex ne garantit aucune
    // langue en particulier, pas meme l'anglais.
    title: Record<string, string>;
    altTitles: Record<string, string>[];
    description: Record<string, string>;
    year: number | null;
    status: string;
    lastVolume: string | null;
    originalLanguage: string;
    tags: Array<{ id: string; attributes: { name: Record<string, string> } }>;
  };
  relationships: MangaRawRelationship[];
}

export interface MangaListResponse {
  data: MangaRaw[];
  limit: number;
  offset: number;
  total: number;
}

export interface MangaTagRaw {
  id: string;
  attributes: { name: Record<string, string>; group: string };
}

export const mangadexKeys = {
  feed: (f: MangaFeed, page: number) => ["mangadex", "feed", f, page] as const,
  search: (query: string, page: number) => ["mangadex", "search", query, page] as const,
  detail: (id: string) => ["mangadex", "detail", id] as const,
  tags: () => ["mangadex", "tags"] as const,
};

// MangaDex (derriere Cloudflare) repond 400 a toute requete sans User-Agent.
// Le navigateur en pose un d'office, pas le client HTTP de Tauri : sans cet
// en-tete, l'app native echoue alors que la preview navigateur fonctionne.
const HEADERS = { "User-Agent": "xingxing-debrid" };

async function get<T>(url: string): Promise<T> {
  const res = await fetchWithTimeout("MangaDex", url, { headers: HEADERS });
  return res.json() as Promise<T>;
}

// Parametres communs a toutes les listes : couverture incluse dans la reponse
// (sinon il faudrait un appel par oeuvre), doujinshi et contenus adultes exclus.
function commonParams(page: number, tagIds: string[] = []): string {
  const parts = [
    `limit=${MANGA_PAGE_SIZE}`,
    `offset=${page * MANGA_PAGE_SIZE}`,
    "includes[]=cover_art",
    `excludedTags[]=${DOUJINSHI_TAG}`,
    "contentRating[]=safe",
    "contentRating[]=suggestive",
    ...tagIds.map((t) => `includedTags[]=${t}`),
  ];
  return parts.join("&");
}

export function feed(f: MangaFeed, page: number, tagIds: string[] = []) {
  return get<MangaListResponse>(`${BASE}/manga?${commonParams(page, tagIds)}&${FEED_ORDER[f]}`);
}

// La pertinence seule remonte parfois les spin-offs avant l'oeuvre principale
// ("one piece" -> "One Piece Academy"). Le nombre de suiveurs en second critere
// remet l'oeuvre attendue en tete.
export function search(query: string, page: number, tagIds: string[] = []) {
  return get<MangaListResponse>(
    `${BASE}/manga?${commonParams(page, tagIds)}&title=${encodeURIComponent(query)}` +
      "&order[relevance]=desc&order[followedCount]=desc",
  );
}

export function detail(id: string) {
  return get<{ data: MangaRaw }>(`${BASE}/manga/${id}?includes[]=cover_art`);
}

export function tags() {
  return get<{ data: MangaTagRaw[] }>(`${BASE}/manga/tag`);
}

// `size` absent = image pleine resolution (plusieurs Mo) : ne l'utiliser que
// pour la fiche detaillee, jamais pour une grille.
export function coverUrl(mangaId: string, fileName: string, size: 256 | 512 | null = 512): string {
  return `${COVERS}/${mangaId}/${fileName}${size ? `.${size}.jpg` : ""}`;
}
