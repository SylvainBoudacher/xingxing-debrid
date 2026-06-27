import { fetch } from "@tauri-apps/plugin-http";

const BASE = "https://api.themoviedb.org/3";
export const ANIMATION_GENRE_ID = 16;

export type TmdbMediaType = "movie" | "tv";

// Sources de la page Découverte (onglets Films / Séries).
export type TmdbFeed = "trending" | "popular" | "now_playing" | "top_rated";
export const TMDB_FEEDS: TmdbFeed[] = ["top_rated", "trending", "popular", "now_playing"];

// Endpoint TMDB par source : "now_playing" n'existe que pour les films, son
// équivalent séries est "on_the_air".
const FEED_ENDPOINT: Record<Exclude<TmdbFeed, "trending">, Record<TmdbMediaType, string>> = {
  popular: { movie: "popular", tv: "popular" },
  now_playing: { movie: "now_playing", tv: "on_the_air" },
  top_rated: { movie: "top_rated", tv: "top_rated" },
};

export interface TmdbRawResult {
  id: number;
  title?: string;
  original_title?: string;
  name?: string;
  original_name?: string;
  poster_path: string | null;
  release_date?: string | null;
  first_air_date?: string | null;
  vote_average: number;
  overview?: string;
  genre_ids?: number[];
}

export interface TmdbListResponse {
  page: number;
  total_pages: number;
  results: TmdbRawResult[];
}

export interface TmdbFindResponse {
  movie_results: TmdbRawResult[];
  tv_results: TmdbRawResult[];
}

export interface TmdbTvDetail {
  seasons?: Array<{ season_number: number; episode_count: number }>;
}

// queryKeys sans la cle API : rotation sans invalidation, secret hors du cache.
export const tmdbKeys = {
  feed: (f: TmdbFeed, mt: TmdbMediaType, page: number) => ["tmdb", "feed", f, mt, page] as const,
  search: (mt: TmdbMediaType, query: string, page: number) =>
    ["tmdb", "search", mt, query, page] as const,
  discoverAnimation: (mt: TmdbMediaType, page: number) =>
    ["tmdb", "discover", "animation", mt, page] as const,
  find: (imdbId: string) => ["tmdb", "find", imdbId.toLowerCase()] as const,
  tvDetail: (id: number) => ["tmdb", "tv", id] as const,
};

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(res.status === 401 ? "Clé TMDB invalide" : `Erreur TMDB ${res.status}`);
  return res.json() as Promise<T>;
}

export function feed(f: TmdbFeed, mt: TmdbMediaType, page: number, apiKey: string) {
  if (f === "trending")
    return get<TmdbListResponse>(
      `${BASE}/trending/${mt}/week?api_key=${apiKey}&language=fr-FR&page=${page}`,
    );
  return get<TmdbListResponse>(
    `${BASE}/${mt}/${FEED_ENDPOINT[f][mt]}?api_key=${apiKey}&language=fr-FR&page=${page}`,
  );
}

export function search(mt: TmdbMediaType, query: string, page: number, apiKey: string) {
  return get<TmdbListResponse>(
    `${BASE}/search/${mt}?api_key=${apiKey}&language=fr-FR&include_adult=false&query=${encodeURIComponent(query)}&page=${page}`,
  );
}

export function discoverAnimation(mt: TmdbMediaType, page: number, apiKey: string) {
  return get<TmdbListResponse>(
    `${BASE}/discover/${mt}?api_key=${apiKey}&language=fr-FR&with_genres=${ANIMATION_GENRE_ID}&sort_by=vote_average.desc&vote_count.gte=${mt === "movie" ? 300 : 150}&page=${page}`,
  );
}

export function findByImdb(imdbId: string, apiKey: string) {
  return get<TmdbFindResponse>(
    `${BASE}/find/${imdbId.toLowerCase()}?api_key=${apiKey}&external_source=imdb_id&language=fr-FR`,
  );
}

export function tvDetail(id: number, apiKey: string) {
  return get<TmdbTvDetail>(`${BASE}/tv/${id}?api_key=${apiKey}&language=fr-FR`);
}
