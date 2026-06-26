import { queryClient } from "@/lib/queryClient";
import { isSeries, type LibraryEntry, type TmdbMeta } from "@/lib/library";
import { parseRelease } from "@/lib/parseRelease";
import {
  search as tmdbSearch,
  tmdbKeys,
  type TmdbMediaType,
  type TmdbRawResult,
} from "@/lib/services/tmdb";
import { Clapperboard, Loader2, Search, Star, Tv, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface TmdbMatchModalProps {
  entry: LibraryEntry;
  tmdbKey: string;
  onPick: (meta: TmdbMeta) => void;
  onClose: () => void;
}

const TMDB_STALE_MS = 10 * 60_000;

// Titre de depart : nom de release nettoye, sans le marqueur de saison/episode.
function defaultQuery(entry: LibraryEntry): string {
  return parseRelease(entry.title)
    .title.replace(/\s*-\s*S\d+(?:\s*E\d+)?\s*$/i, "")
    .trim();
}

function toMeta(r: TmdbRawResult, mediaType: TmdbMediaType): TmdbMeta {
  return {
    id: r.id,
    mediaType,
    title: (mediaType === "movie" ? r.title : r.name) ?? r.original_title ?? r.original_name ?? "",
    posterPath: r.poster_path,
    year: (mediaType === "movie" ? r.release_date : r.first_air_date)?.slice(0, 4) ?? "",
    voteAverage: r.vote_average,
    overview: r.overview ?? "",
  };
}

export function TmdbMatchModal({ entry, tmdbKey, onPick, onClose }: TmdbMatchModalProps) {
  const [query, setQuery] = useState(() => defaultQuery(entry));
  const [mediaType, setMediaType] = useState<TmdbMediaType>(isSeries(entry) ? "tv" : "movie");
  const [results, setResults] = useState<TmdbRawResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(q: string, mt: TmdbMediaType) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const list = await queryClient.fetchQuery({
        queryKey: tmdbKeys.search(mt, trimmed, 1),
        queryFn: () => tmdbSearch(mt, trimmed, 1, tmdbKey),
        staleTime: TMDB_STALE_MS,
      });
      setResults(list.results);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runSearch(defaultQuery(entry), isSeries(entry) ? "tv" : "movie");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeType(mt: TmdbMediaType) {
    if (mt === mediaType) return;
    setMediaType(mt);
    runSearch(query, mt);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white/95 shadow-2xl ring-1 ring-black/10 backdrop-blur-xl dark:bg-zinc-900/95 dark:ring-white/10"
      >
        <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Compléter via TMDB
            </p>
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
              {entry.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-zinc-200 transition-colors hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <X className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query, mediaType);
          }}
          className="flex items-center gap-2 px-5 pb-3"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Titre du film ou de la série..."
              className="w-full rounded-lg border border-black/10 bg-white/70 py-2 pl-9 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-400 dark:border-white/10 dark:bg-zinc-800/60 dark:text-white"
            />
          </div>
          <div className="flex flex-none rounded-lg bg-black/5 p-0.5 dark:bg-white/10">
            {(
              [
                ["movie", Clapperboard],
                ["tv", Tv],
              ] as const
            ).map(([id, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => changeType(id)}
                title={id === "movie" ? "Film" : "Série"}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                  mediaType === id
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-zinc-700 dark:text-indigo-300"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-black/5 px-3 py-3 dark:border-white/10">
          {loading && (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          )}
          {!loading && error && (
            <p className="px-3 py-6 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {!loading && !error && results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-zinc-500">Aucun résultat trouvé.</p>
          )}
          {!loading &&
            !error &&
            results.map((r) => {
              const meta = toMeta(r, mediaType);
              return (
                <button
                  key={r.id}
                  onClick={() => onPick(meta)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                >
                  <div className="h-[72px] w-12 flex-none overflow-hidden rounded-md bg-zinc-200 ring-1 ring-black/10 dark:bg-zinc-800 dark:ring-white/10">
                    {meta.posterPath ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${meta.posterPath}`}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-1 text-center text-[9px] text-zinc-400">
                        {meta.title}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                      {meta.title}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                      {meta.year && <span>{meta.year}</span>}
                      {meta.voteAverage > 0 && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Star className="h-3 w-3 fill-amber-400" />
                          {meta.voteAverage.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {meta.overview && (
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                        {meta.overview}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
        </div>
      </motion.div>
    </motion.div>
  );
}
