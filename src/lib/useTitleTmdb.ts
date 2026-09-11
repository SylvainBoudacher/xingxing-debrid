import type { TmdbMeta } from "@/lib/library";
import {
  detail as tmdbDetail,
  tmdbKeys,
  tvSeason,
  type TmdbEpisode,
  type TmdbSeasonDetail,
} from "@/lib/services/tmdb";
import { TMDB_STALE_MS } from "@/lib/tmdbCache";
import { useQueries, useQuery } from "@tanstack/react-query";

// Fiche TMDB complète (backdrop, durée d'un film). Même clé que TmdbGenres :
// un seul appel pour les deux.
export function useTmdbDetail(meta: TmdbMeta | undefined, tmdbKey: string | undefined) {
  return useQuery({
    queryKey: tmdbKeys.detail(meta?.mediaType ?? "movie", meta?.id ?? 0),
    enabled: !!meta && !!tmdbKey,
    staleTime: TMDB_STALE_MS,
    queryFn: () => tmdbDetail(meta!.mediaType, meta!.id, tmdbKey as string),
  }).data;
}

// Épisodes TMDB indexés par saison puis par numéro.
export type SeasonEpisodes = Map<number, Map<number, TmdbEpisode>>;

// Hors du composant : combine reste la même référence et ne se recalcule
// qu'au changement des résultats.
function indexSeasons(results: Array<{ data?: TmdbSeasonDetail }>): SeasonEpisodes {
  const map: SeasonEpisodes = new Map();
  for (const { data } of results) {
    if (!data) continue;
    map.set(data.season_number, new Map((data.episodes ?? []).map((e) => [e.episode_number, e])));
  }
  return map;
}

// Détail des seules saisons affichées, chargé à la demande puis gardé en cache.
export function useTmdbSeasons(
  tvId: number | null,
  seasons: number[],
  tmdbKey: string | undefined,
): SeasonEpisodes {
  return useQueries({
    queries: seasons.map((season) => ({
      queryKey: tmdbKeys.tvSeason(tvId ?? 0, season),
      enabled: tvId !== null && !!tmdbKey,
      staleTime: TMDB_STALE_MS,
      queryFn: () => tvSeason(tvId as number, season, tmdbKey as string),
    })),
    combine: indexSeasons,
  });
}
