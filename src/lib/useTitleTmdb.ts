import type { TmdbMeta } from "@/lib/library";
import {
  detail as tmdbDetail,
  personCredits,
  recommendations,
  tmdbKeys,
  tvSeason,
  type TmdbEpisode,
  type TmdbPersonCrewCredit,
  type TmdbSeasonDetail,
} from "@/lib/services/tmdb";
import { TMDB_STALE_MS } from "@/lib/tmdbCache";
import { mapTmdb, type TmdbItem } from "@/lib/tmdbItem";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

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

// Nombre de suggestions gardées : au-delà, TMDB descend vers des titres sans
// rapport et la rangée n'en finit plus.
const SUGGESTIONS_MAX = 20;

// Titres recommandés pour la fiche ouverte. Chargés seulement une fois la fiche
// prête : l'ouverture ne partage pas sa bande passante avec le bas de page.
export function useTitleRecommendations(
  meta: TmdbMeta | undefined,
  tmdbKey: string | undefined,
  enabled: boolean,
): TmdbItem[] {
  const mediaType = meta?.mediaType ?? "movie";
  const { data } = useQuery({
    queryKey: tmdbKeys.recommendations(mediaType, meta?.id ?? 0),
    enabled: enabled && !!meta && !!tmdbKey,
    staleTime: TMDB_STALE_MS,
    queryFn: () => recommendations(mediaType, meta!.id, tmdbKey as string),
  });
  return useMemo(
    () =>
      (data?.results ?? [])
        .filter((r) => r.poster_path)
        .slice(0, SUGGESTIONS_MAX)
        .map((r) => mapTmdb(r, mediaType)),
    [data, mediaType],
  );
}

// Postes retenus dans la filmographie : la realisation d'un film, la creation
// d'une serie. Producteur ou scenariste ramenerait des titres sans lien visible
// avec la fiche ouverte.
const DIRECTING_JOBS = new Set(["Director", "Creator"]);

// Autres titres realises (ou crees) par la meme personne, le titre ouvert exclu.
// Tries par popularite : la filmographie TMDB est dans un ordre arbitraire.
export function useDirectorWorks(
  directorId: number | undefined,
  currentId: number | undefined,
  tmdbKey: string | undefined,
  enabled: boolean,
): TmdbItem[] {
  const { data } = useQuery({
    queryKey: tmdbKeys.personCredits(directorId ?? 0),
    enabled: enabled && !!directorId && !!tmdbKey,
    staleTime: TMDB_STALE_MS,
    queryFn: () => personCredits(directorId as number, tmdbKey as string),
  });
  return useMemo(() => {
    // Une personne peut occuper plusieurs postes sur le meme titre : Map par id.
    const byId = new Map<number, TmdbPersonCrewCredit>();
    for (const credit of data?.crew ?? []) {
      if (!DIRECTING_JOBS.has(credit.job) || !credit.poster_path) continue;
      if (credit.id === currentId || byId.has(credit.id)) continue;
      byId.set(credit.id, credit);
    }
    return [...byId.values()]
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .slice(0, SUGGESTIONS_MAX)
      .map((credit) => mapTmdb(credit, credit.media_type));
  }, [data, currentId]);
}
