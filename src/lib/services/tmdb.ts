import { fetchWithTimeout, NetworkError } from "@/lib/networkError";

const BASE = "https://api.themoviedb.org/3";
export const ANIMATION_GENRE_ID = 16;
// Plancher de votes du vivier de la roulette : ecarte les films fantomes sans
// note fiable, sans reduire le vivier a une poignee de classiques.
export const ROULETTE_VOTE_MIN = 200;

export type TmdbMediaType = "movie" | "tv";

// Sources de la page Découverte (onglets Films / Séries).
export type TmdbFeed = "trending" | "now_playing" | "top_rated";
export const TMDB_FEEDS: TmdbFeed[] = ["top_rated", "trending", "now_playing"];

// Endpoint TMDB par source : "now_playing" n'existe que pour les films, son
// équivalent séries est "on_the_air".
const FEED_ENDPOINT: Record<Exclude<TmdbFeed, "trending">, Record<TmdbMediaType, string>> = {
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

// /search/multi renvoie films, séries et personnes mélangés ; chaque résultat
// porte son propre media_type. On ignore les "person" côté appelant.
export interface TmdbMultiResult extends TmdbRawResult {
  media_type: "movie" | "tv" | "person";
}

export interface TmdbMultiResponse {
  page: number;
  total_pages: number;
  results: TmdbMultiResult[];
}

export interface TmdbTvDetail {
  seasons?: Array<{ season_number: number; episode_count: number }>;
}

export interface TmdbDetail {
  genres?: Array<{ id: number; name: string }>;
}

// queryKeys sans la cle API : rotation sans invalidation, secret hors du cache.
export const tmdbKeys = {
  feed: (f: TmdbFeed, mt: TmdbMediaType, page: number) => ["tmdb", "feed", f, mt, page] as const,
  search: (mt: TmdbMediaType, query: string, page: number) =>
    ["tmdb", "search", mt, query, page] as const,
  searchMulti: (query: string, page: number) => ["tmdb", "search", "multi", query, page] as const,
  discoverAnimation: (f: TmdbFeed, mt: TmdbMediaType, page: number) =>
    ["tmdb", "discover", "animation", f, mt, page] as const,
  roulette: (genreIds: number[], page: number) =>
    ["tmdb", "roulette", [...genreIds].sort((a, b) => a - b).join(","), page] as const,
  find: (imdbId: string) => ["tmdb", "find", imdbId.toLowerCase()] as const,
  tvDetail: (id: number) => ["tmdb", "tv", id] as const,
  detail: (mt: TmdbMediaType, id: number) => ["tmdb", "detail", mt, id] as const,
  recommendations: (mt: TmdbMediaType, id: number) => ["tmdb", "recommendations", mt, id] as const,
};

async function get<T>(url: string): Promise<T> {
  try {
    const res = await fetchWithTimeout("TMDB", url);
    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof NetworkError && err.status === 401)
      throw new NetworkError("TMDB", "http", "Clé TMDB invalide", 401);
    throw err;
  }
}

// true si TMDB accepte la clé, false si 401 (clé invalide). Les autres
// erreurs réseau remontent : hors-ligne, impossible de trancher.
export async function validateKey(apiKey: string): Promise<boolean> {
  try {
    await get(`${BASE}/configuration?api_key=${apiKey}`);
    return true;
  } catch (err) {
    if (err instanceof NetworkError && err.status === 401) return false;
    throw err;
  }
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

export function searchMulti(query: string, page: number, apiKey: string) {
  return get<TmdbMultiResponse>(
    `${BASE}/search/multi?api_key=${apiKey}&language=fr-FR&include_adult=false&query=${encodeURIComponent(query)}&page=${page}`,
  );
}

// Les sources de l'onglet Animations passent toutes par /discover : seul le tri
// change. "trending" n'a pas d'équivalent /discover, on l'approxime par la
// popularité restreinte aux sorties des 12 derniers mois.
function animationSort(f: TmdbFeed, mt: TmdbMediaType): string {
  const dateField = mt === "movie" ? "primary_release_date" : "first_air_date";
  const today = new Date().toISOString().slice(0, 10);
  switch (f) {
    case "top_rated":
      return `sort_by=vote_average.desc&vote_count.gte=${mt === "movie" ? 300 : 150}`;
    case "trending": {
      const since = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      return `sort_by=popularity.desc&${dateField}.gte=${since}&${dateField}.lte=${today}`;
    }
    case "now_playing":
      return `sort_by=${dateField}.desc&${dateField}.lte=${today}&vote_count.gte=10`;
  }
}

export function discoverAnimation(f: TmdbFeed, mt: TmdbMediaType, page: number, apiKey: string) {
  return get<TmdbListResponse>(
    `${BASE}/discover/${mt}?api_key=${apiKey}&language=fr-FR&with_genres=${ANIMATION_GENRE_ID}&${animationSort(f, mt)}&page=${page}`,
  );
}

// Vivier de la roulette. Le separateur de /discover porte la logique : la
// virgule est un ET (Western + Documentaire ne renvoie rien), le pipe un OU.
// On veut le OU, d'ou le %7C. Liste vide = pas de filtre, tout le catalogue.
export function discoverByGenres(genreIds: number[], page: number, apiKey: string) {
  const genres = genreIds.length ? `&with_genres=${genreIds.join("%7C")}` : "";
  return get<TmdbListResponse>(
    `${BASE}/discover/movie?api_key=${apiKey}&language=fr-FR&include_adult=false` +
      `&sort_by=popularity.desc&vote_count.gte=${ROULETTE_VOTE_MIN}${genres}&page=${page}`,
  );
}

export function findByImdb(imdbId: string, apiKey: string) {
  return get<TmdbFindResponse>(
    `${BASE}/find/${imdbId.toLowerCase()}?api_key=${apiKey}&external_source=imdb_id&language=fr-FR`,
  );
}

// Fiche complete d'un film / d'une serie : sert a recuperer les genres des
// entrees de bibliotheque enregistrees avant que genreIds ne soit stocke.
export function detail(mt: TmdbMediaType, id: number, apiKey: string) {
  return get<TmdbDetail>(`${BASE}/${mt}/${id}?api_key=${apiKey}&language=fr-FR`);
}

export function tvDetail(id: number, apiKey: string) {
  return get<TmdbTvDetail>(`${BASE}/tv/${id}?api_key=${apiKey}&language=fr-FR`);
}

// Titres recommandes par TMDB pour un film / une serie donne (signal
// collaboratif). Meme format que les feeds : agrege par scoreRecommendations.
export function recommendations(mt: TmdbMediaType, id: number, apiKey: string) {
  return get<TmdbListResponse>(
    `${BASE}/${mt}/${id}/recommendations?api_key=${apiKey}&language=fr-FR&page=1`,
  );
}
