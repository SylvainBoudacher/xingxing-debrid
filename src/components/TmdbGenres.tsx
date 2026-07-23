import { detail as tmdbDetail, tmdbKeys, type TmdbMediaType } from "@/lib/services/tmdb";
import { TMDB_STALE_MS } from "@/lib/tmdbCache";
import { genreNames } from "@/lib/tmdbGenres";
import { useQuery } from "@tanstack/react-query";

interface TmdbGenresProps {
  mediaType: TmdbMediaType;
  id: number;
  /** Genres deja connus (feeds Decouverte, entrees recentes de la bibliotheque). */
  genreIds?: number[];
  /** Sans cle, pas de repli reseau : rien ne s'affiche si genreIds est vide. */
  tmdbKey?: string;
  className?: string;
}

// Puces de genres. Les feeds TMDB renvoient genre_ids, mais les entrees de
// bibliotheque enregistrees avant ce champ retombent sur /movie|tv/{id}.
export function TmdbGenres({ mediaType, id, genreIds, tmdbKey, className }: TmdbGenresProps) {
  const needsFetch = !genreIds?.length && !!tmdbKey;

  const detailQuery = useQuery({
    queryKey: tmdbKeys.detail(mediaType, id),
    enabled: needsFetch,
    staleTime: TMDB_STALE_MS,
    queryFn: () => tmdbDetail(mediaType, id, tmdbKey as string),
  });

  const names = genreIds?.length
    ? genreNames(genreIds)
    : genreNames(detailQuery.data?.genres?.map((g) => g.id));

  if (names.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className ?? ""}`}>
      {names.map((name) => (
        <span
          key={name}
          className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-600 ring-1 ring-indigo-500/20 dark:text-indigo-300"
        >
          {name}
        </span>
      ))}
    </div>
  );
}
