import { Collapse } from "@/components/Collapse";
import { DiscoverQuickPicks } from "@/components/DiscoverQuickPicks";
import { DiscoverReleaseFilters, type ReleaseSort } from "@/components/DiscoverReleaseFilters";
import { DiscoverReleaseRow } from "@/components/DiscoverReleaseRow";
import { DiscoverReleasesEmpty } from "@/components/DiscoverReleasesEmpty";
import { DiscoverReleasesSkeleton } from "@/components/DiscoverReleasesSkeleton";
import { DiscoverSeasonTabs, type TmdbSeason } from "@/components/DiscoverSeasonTabs";
import { ExpandableText } from "@/components/ExpandableText";
import { NetworkErrorState } from "@/components/NetworkErrorState";
import { TmdbGenres } from "@/components/TmdbGenres";
import {
  compareScope,
  filterMovieReleases,
  filterTvReleases,
  releasesQueryKey,
  RESOLUTION_RANK,
  searchC411,
  sortOccupants,
  type Occupant,
  type SeasonSelection,
} from "@/lib/discoverReleases";
import { networkErrorMessage } from "@/lib/networkError";
import { quickPicks } from "@/lib/releasePicks";
import { loadReleasesView, releasesViewQueryKey } from "@/lib/releasesView";
import { tmdbKeys, tvDetail as tmdbTvDetail } from "@/lib/services/tmdb";
import { TMDB_STALE_MS } from "@/lib/tmdbCache";
import type { TmdbItem } from "@/lib/tmdbItem";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Heart, Star, X } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

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

// Fiche d'un film / d'une série : saisons (TV), choix rapides par résolution,
// et liste complète des releases C411 (tri, filtres) repliée pour les initiés.
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
  const [selectedSeason, setSelectedSeason] = useState<SeasonSelection | null>(null);
  const [releaseSort, setReleaseSort] = useState<ReleaseSort>(
    item.mediaType === "tv" ? "episode" : "seeders",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [resFilter, setResFilter] = useState<string | null>(null);
  const [langFilter, setLangFilter] = useState<string | null>(null);
  const [expertOpen, setExpertOpen] = useState(false);

  const viewQuery = useQuery({
    queryKey: releasesViewQueryKey,
    staleTime: Infinity,
    queryFn: loadReleasesView,
  });
  const fullView = viewQuery.data === "full";

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

  // Toutes les releases TV (saison null) : deja prefetchee par openItem(), sert
  // uniquement a savoir si une integrale existe pour choisir l'onglet par defaut.
  const allTvReleasesQuery = useQuery({
    queryKey: releasesQueryKey(item.mediaType, item.id, null),
    enabled: item.mediaType === "tv",
    staleTime: 60_000,
    queryFn: async () => {
      const { torrents, nTitles } = await searchC411(item, getC411Key());
      return sortOccupants(filterTvReleases(torrents, nTitles, null));
    },
  });

  const hasComplete = !!allTvReleasesQuery.data?.some((o) => o.scope?.kind === "complete");

  const defaultSeason = useMemo<SeasonSelection | null>(() => {
    if (!seasons || !allTvReleasesQuery.data) return null;
    return hasComplete ? "complete" : (seasons[0]?.number ?? null);
  }, [seasons, allTvReleasesQuery.data, hasComplete]);

  const activeSeason: SeasonSelection | null = selectedSeason ?? defaultSeason;

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
    enabled: item.mediaType === "movie" || activeSeason !== null,
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
    : allTvReleasesQuery.isError
      ? networkErrorMessage(allTvReleasesQuery.error)
      : releasesQuery.isError
        ? networkErrorMessage(releasesQuery.error)
        : null;

  function retryReleases() {
    if (tvDetailQuery.isError) tvDetailQuery.refetch();
    if (allTvReleasesQuery.isError) allTvReleasesQuery.refetch();
    if (releasesQuery.isError) releasesQuery.refetch();
  }

  const picks = useMemo(
    () => (releases && !fullView ? quickPicks(releases, item.mediaType === "tv") : []),
    [releases, fullView, item.mediaType],
  );

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
                releaseSort === "episode"
                  ? compareScope(a, b) || b.seeders - a.seeders
                  : releaseSort === "size"
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

  function changeSeason(season: SeasonSelection) {
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
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl ring-1 ring-black/10 dark:ring-white/10 overflow-hidden shadow-2xl"
      >
        <div className="flex shrink-0 items-start gap-4 px-5 pt-5 pb-4">
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
            <TmdbGenres
              mediaType={item.mediaType}
              id={item.id}
              genreIds={item.genreIds}
              tmdbKey={tmdbKey}
              className="mt-1.5"
            />
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

        <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          {item.overview && <ExpandableText text={item.overview} className="mx-5 mb-4" />}

          {item.mediaType === "tv" && (
            <DiscoverSeasonTabs
              seasons={seasons}
              activeSeason={activeSeason}
              hasComplete={hasComplete}
              onChange={changeSeason}
            />
          )}

          <div className="px-5">
            {(releases === null || !viewQuery.data) && !releasesError && (
              <DiscoverReleasesSkeleton />
            )}
            {releasesError && (
              <div className="flex justify-center py-16">
                <NetworkErrorState message={releasesError} onRetry={retryReleases} />
              </div>
            )}
            {viewQuery.data && releases !== null && releases.length === 0 && (
              <DiscoverReleasesEmpty
                message={
                  item.mediaType === "tv"
                    ? activeSeason === "complete"
                      ? "Aucune intégrale disponible pour cette série."
                      : "Aucune version disponible pour cette saison."
                    : "Aucune version disponible pour ce film."
                }
                onSearchC411={() => onSearchTracker(item.title, "c411")}
                onSearchNyaa={() => onSearchTracker(item.originalTitle || item.title, "nyaa")}
              />
            )}
            {viewQuery.data && picks.length > 0 && (
              <>
                <DiscoverQuickPicks
                  picks={picks}
                  sendingHash={sendingHash}
                  libraryHash={libraryHash}
                  onSend={onSend}
                />
                <button
                  onClick={() => setExpertOpen(!expertOpen)}
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${expertOpen ? "rotate-180" : ""}`}
                  />
                  Choisir une version précise ({releases?.length})
                </button>
              </>
            )}
          </div>

          {viewQuery.data && releases !== null && releases.length > 0 && (
            <Collapse open={expertOpen || picks.length === 0}>
              <div className="pt-3">
                <DiscoverReleaseFilters
                  sort={releaseSort}
                  showEpisodeSort={item.mediaType === "tv"}
                  sortDir={sortDir}
                  resOptions={resOptions}
                  langOptions={langOptions}
                  resFilter={resFilter}
                  langFilter={langFilter}
                  onSort={changeSort}
                  onResFilter={setResFilter}
                  onLangFilter={setLangFilter}
                />
                <div className="px-3 space-y-1.5">
                  {visibleReleases?.length === 0 && (
                    <p className="py-10 text-center text-sm text-zinc-500">
                      Aucune version ne correspond aux filtres.
                    </p>
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
              </div>
            </Collapse>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
