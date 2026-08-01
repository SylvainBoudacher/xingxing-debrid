import { queryClient } from "@/lib/queryClient";
import { tmdbKeys, TMDB_FEEDS, type TmdbListResponse } from "@/lib/services/tmdb";
import { letterboxdPage } from "@/lib/letterboxdFeed";
import { preloadPosters } from "@/lib/posterPreload";

// Precharge les jaquettes des grilles atteignables des l'ouverture de la
// Decouverte : les listes TMDB page 1 (deja prefetchees par useAppInit) et la
// page 1 du classement Letterboxd (servie depuis le bundle). L'ordre suit la
// vue par defaut (Films / Mieux notes) puis les sources voisines.
function page1(key: readonly unknown[]): (string | null)[] {
  const list = queryClient.getQueryData<TmdbListResponse>(key);
  return list ? list.results.map((r) => r.poster_path) : [];
}

export function preloadDiscoverPosters(hasTmdbKey: boolean): void {
  const paths: (string | null)[] = [];
  if (hasTmdbKey) paths.push(...page1(tmdbKeys.feed("top_rated", "movie", 1)));
  paths.push(...letterboxdPage(1).map((i) => i.posterPath));
  if (hasTmdbKey) {
    for (const f of TMDB_FEEDS) {
      for (const mt of ["movie", "tv"] as const) {
        paths.push(...page1(tmdbKeys.feed(f, mt, 1)));
      }
      paths.push(...page1(tmdbKeys.discoverAnimation(f, "movie", 1)));
      paths.push(...page1(tmdbKeys.discoverAnimation(f, "tv", 1)));
    }
  }
  preloadPosters(paths);
}
