import c411Logo from "@/assets/sources/C411.webp";
import nyaaLogo from "@/assets/sources/nyaa.webp";
import { DiscoverReleaseFilters, type ReleaseSort } from "@/components/DiscoverReleaseFilters";
import { DiscoverReleaseRow } from "@/components/DiscoverReleaseRow";
import { NetworkErrorState } from "@/components/NetworkErrorState";
import {
  filterMovieReleases,
  filterTvReleases,
  releasesQueryKey,
  RESOLUTION_RANK,
  searchC411,
  sortOccupants,
  type Occupant,
} from "@/lib/discoverReleases";
import { networkErrorMessage } from "@/lib/networkError";
import { tmdbKeys, tvDetail as tmdbTvDetail } from "@/lib/services/tmdb";
import { TMDB_STALE_MS } from "@/lib/tmdbCache";
import type { TmdbItem } from "@/lib/tmdbItem";
import { useDragScroll } from "@/lib/useDragScroll";
import { useQuery } from "@tanstack/react-query";
import { Heart, SlidersHorizontal, Star, X } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

interface TmdbSeason {
  number: number;
  episodeCount: number;
}

interface DiscoverReleasesModalProps {
  item: TmdbItem;
  tmdbKey: string;
  getC411Key: () => string;
  liked: boolean;
  sendingHash: string | null;
  libraryHash: string | null;
  onToggleLike: (item: TmdbItem) => void;
  onClose: () => void;
  onSend: (occ: Occupant, addToLibrary: boolean) => void;
  /** Lance une recherche brute sur un tracker (C411 / Nyaa) via la page principale */
  onSearchTracker: (query: string, source: "c411" | "nyaa") => void;
}

// Fiche d'un film / d'une série : saisons (TV), tri et filtres des releases
// C411, actions d'envoi vers AllDebrid.
export function DiscoverReleasesModal({
  item,
  tmdbKey,
  getC411Key,
  liked,
  sendingHash,
  libraryHash,
  onToggleLike,
  onClose,
  onSend,
  onSearchTracker,
}: DiscoverReleasesModalProps) {
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [releaseSort, setReleaseSort] = useState<ReleaseSort>("seeders");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [resFilter, setResFilter] = useState<string | null>(null);
  const [langFilter, setLangFilter] = useState<string | null>(null);

  const { ref: seasonScrollRef, dragProps: seasonDragProps } = useDragScroll<HTMLDivElement>();

  // Detail TV (saisons) : sert a peupler le selecteur de saison et a defaut
  // d'une saison choisie, la premiere.
  const tvDetailQuery = useQuery({
    queryKey: tmdbKeys.tvDetail(item.id),
    enabled: item.mediaType === "tv",
    staleTime: TMDB_STALE_MS,
    queryFn: () => tmdbTvDetail(item.id, tmdbKey),
  });

  const seasons = useMemo<TmdbSeason[] | null>(() => {
    if (item.mediaType !== "tv" || !tvDetailQuery.data) return null;
    return (tvDetailQuery.data.seasons ?? [])
      .filter((s) => s.season_number > 0)
      .map((s) => ({ number: s.season_number, episodeCount: s.episode_count }));
  }, [item, tvDetailQuery.data]);

  const activeSeason = selectedSeason ?? seasons?.[0]?.number ?? null;

  // Releases C411 du film / de la saison selectionnee. TanStack gere la course
  // (les resultats perimes sont ignores) et le cache (re-ouverture, switch saison).
  //
  // Pour les series TV, le prefetch C411 est lance dans openItem() en parallele
  // du tvDetailQuery, donc les torrents sont souvent deja en cache quand
  // tvDetailQuery.isSuccess devient true — le waterfall est elimine.
  const releasesQuery = useQuery({
    queryKey: releasesQueryKey(
      item.mediaType,
      item.id,
      item.mediaType === "tv" ? activeSeason : null,
    ),
    enabled: item.mediaType === "movie" || tvDetailQuery.isSuccess,
    staleTime: 60_000,
    queryFn: async () => {
      const { torrents, nTitles } = await searchC411(item, getC411Key());
      return item.mediaType === "movie"
        ? sortOccupants(filterMovieReleases(torrents, nTitles, item))
        : sortOccupants(filterTvReleases(torrents, nTitles, activeSeason));
    },
  });

  const releases = releasesQuery.data ?? null;
  const releasesError = tvDetailQuery.isError
    ? networkErrorMessage(tvDetailQuery.error)
    : releasesQuery.isError
      ? networkErrorMessage(releasesQuery.error)
      : null;

  function retryReleases() {
    if (tvDetailQuery.isError) tvDetailQuery.refetch();
    if (releasesQuery.isError) releasesQuery.refetch();
  }

  const resOptions = useMemo(
    () =>
      releases
        ? [...new Set(releases.map((o) => o.resolution).filter((r): r is string => !!r))].sort(
            (a, b) => (RESOLUTION_RANK[b] ?? 0) - (RESOLUTION_RANK[a] ?? 0),
          )
        : [],
    [releases],
  );

  const langOptions = useMemo(
    () => (releases ? [...new Set(releases.flatMap((o) => o.languages))] : []),
    [releases],
  );

  const visibleReleases = useMemo(
    () =>
      releases
        ? [...releases]
            .filter(
              (o) =>
                (!resFilter || o.resolution === resFilter) &&
                (!langFilter || o.languages.includes(langFilter)),
            )
            .sort((a, b) => {
              const cmp =
                releaseSort === "size"
                  ? b.fileSize - a.fileSize
                  : releaseSort === "resolution"
                    ? (RESOLUTION_RANK[b.resolution ?? ""] ?? 0) -
                        (RESOLUTION_RANK[a.resolution ?? ""] ?? 0) || b.seeders - a.seeders
                    : b.seeders - a.seeders;
              return sortDir === "asc" ? -cmp : cmp;
            })
        : null,
    [releases, resFilter, langFilter, releaseSort, sortDir],
  );

  function changeSeason(season: number) {
    if (season === activeSeason) return;
    setSelectedSeason(season);
    setResFilter(null);
    setLangFilter(null);
  }

  function changeSort(key: ReleaseSort) {
    if (releaseSort === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setReleaseSort(key);
      setSortDir("desc");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl ring-1 ring-black/10 dark:ring-white/10 overflow-hidden shadow-2xl"
      >
        <div className="flex items-start gap-4 px-5 pt-5 pb-4">
          {item.posterPath && (
            <img
              src={`https://image.tmdb.org/t/p/w154${item.posterPath}`}
              alt=""
              className="h-24 w-16 shrink-0 rounded-lg object-cover ring-1 ring-black/10 dark:ring-white/10"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
              Versions disponibles
            </p>
            <p className="text-base font-semibold text-zinc-900 dark:text-white leading-snug">
              {item.title}
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
              <span>{item.year}</span>
              {item.voteAverage > 0 && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Star className="h-3 w-3 fill-amber-400" />
                  {item.voteAverage.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onToggleLike(item)}
            className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            <Heart
              className={`h-3.5 w-3.5 transition-colors ${
                liked ? "fill-rose-500 text-rose-500" : "text-zinc-500 dark:text-zinc-400"
              }`}
            />
          </button>
          <button
            onClick={onClose}
            className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {item.overview && (
          <p className="mx-5 mb-4 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-4">
            {item.overview}
          </p>
        )}

        {item.mediaType === "tv" && (
          <div
            ref={seasonScrollRef}
            {...seasonDragProps}
            className="flex gap-1.5 overflow-x-auto px-5 pt-0.5 pb-3 cursor-grab select-none active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {seasons === null
              ? Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className="h-[26px] w-24 shrink-0 rounded-full bg-white/80 dark:bg-zinc-800/60 animate-pulse"
                  />
                ))
              : seasons.map((s) => (
                  <button
                    key={s.number}
                    onClick={() => changeSeason(s.number)}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium leading-normal ring-1 transition-colors ${
                      activeSeason === s.number
                        ? "bg-indigo-600 text-white ring-indigo-500"
                        : "bg-white/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 ring-black/10 dark:ring-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    Saison {s.number}
                    <span
                      className={`ml-1 ${activeSeason === s.number ? "text-indigo-200" : "text-zinc-400 dark:text-zinc-600"}`}
                    >
                      {s.episodeCount} ép.
                    </span>
                  </button>
                ))}
          </div>
        )}

        {releases === null && !releasesError && (
          <div className="flex flex-wrap items-center gap-1.5 px-5 pb-3">
            <SlidersHorizontal className="mr-0.5 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600" />
            {[64, 48, 56, 52, 44, 48].map((w, i) => (
              <div
                key={i}
                className="h-6 animate-pulse rounded-full bg-white/80 dark:bg-zinc-800/60"
                style={{ width: w }}
              />
            ))}
          </div>
        )}

        {releases !== null && releases.length > 0 && (
          <DiscoverReleaseFilters
            sort={releaseSort}
            sortDir={sortDir}
            resOptions={resOptions}
            langOptions={langOptions}
            resFilter={resFilter}
            langFilter={langFilter}
            onSort={changeSort}
            onResFilter={setResFilter}
            onLangFilter={setLangFilter}
          />
        )}

        <div className="h-[32rem] max-h-[65vh] overflow-y-auto px-3 pb-3 space-y-1.5">
          {releases === null &&
            !releasesError &&
            Array.from({ length: 6 }, (_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: i * 0.07 }}
                className="flex items-center gap-4 rounded-xl bg-white/80 dark:bg-zinc-800/60 px-4 py-3"
              >
                <div className="min-w-0 flex-1 animate-pulse">
                  <div className="mb-2 flex items-center gap-1.5">
                    <div className="h-[18px] w-12 rounded-md bg-zinc-300/70 dark:bg-zinc-700/70" />
                    <div className="h-[18px] w-10 rounded-md bg-zinc-300/70 dark:bg-zinc-700/70" />
                    <div className="h-[18px] w-12 rounded-md bg-zinc-300/70 dark:bg-zinc-700/70" />
                    <div className="h-[18px] w-9 rounded-md bg-zinc-300/70 dark:bg-zinc-700/70" />
                  </div>
                  <div className="mb-2 flex items-center gap-3">
                    <div className="h-3 w-14 rounded bg-zinc-300/70 dark:bg-zinc-700/70" />
                    <div className="h-3 w-20 rounded bg-zinc-300/70 dark:bg-zinc-700/70" />
                    <div className="h-3 w-16 rounded bg-zinc-300/60 dark:bg-zinc-700/50" />
                  </div>
                  <div className="h-2.5 w-3/4 rounded bg-zinc-300/40 dark:bg-zinc-700/40" />
                </div>
                <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-300/70 dark:bg-zinc-700/70 animate-pulse" />
              </motion.div>
            ))}
          {releasesError && (
            <div className="flex h-full items-center justify-center">
              <NetworkErrorState message={releasesError} onRetry={retryReleases} />
            </div>
          )}
          {releases !== null && releases.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-5 px-6">
              <p className="text-center text-sm text-zinc-500">
                {item.mediaType === "tv"
                  ? "Aucune version disponible pour cette saison."
                  : "Aucune version disponible pour ce film."}
              </p>
              <div className="flex flex-col items-center gap-3">
                <p className="max-w-xs text-center text-xs text-zinc-400 dark:text-zinc-500">
                  Peut-être juste mal répertorié entre TMDB et C411. Cherchez directement sur un
                  tracker :
                </p>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => onSearchTracker(item.title, "c411")}
                    className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-zinc-700 ring-1 ring-black/10 transition-colors hover:bg-zinc-100 dark:bg-zinc-800/80 dark:text-zinc-200 dark:ring-white/10 dark:hover:bg-zinc-700/80"
                  >
                    <img
                      src={c411Logo}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover bg-white"
                    />
                    Chercher sur C411
                  </button>
                  <button
                    onClick={() => onSearchTracker(item.originalTitle || item.title, "nyaa")}
                    className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-zinc-700 ring-1 ring-black/10 transition-colors hover:bg-zinc-100 dark:bg-zinc-800/80 dark:text-zinc-200 dark:ring-white/10 dark:hover:bg-zinc-700/80"
                  >
                    <img
                      src={nyaaLogo}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover bg-white"
                    />
                    Chercher sur Nyaa
                  </button>
                </div>
              </div>
            </div>
          )}
          {releases !== null && releases.length > 0 && visibleReleases?.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-sm text-zinc-500">
                Aucune version ne correspond aux filtres.
              </p>
            </div>
          )}
          {visibleReleases?.map((occ, i) => (
            <DiscoverReleaseRow
              key={occ.infoHash}
              occ={occ}
              index={i}
              isTv={item.mediaType === "tv"}
              sendingHash={sendingHash}
              libraryHash={libraryHash}
              onSend={onSend}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
