import type { TmdbItem } from "@/lib/tmdbItem";
import { Clapperboard, Loader2, Tv } from "lucide-react";
import { motion } from "motion/react";

interface SearchSuggestionsProps {
  suggestions: TmdbItem[];
  loading: boolean;
  highlightedIndex: number;
  onSelect: (item: TmdbItem) => void;
  onHover: (index: number) => void;
}

export function SearchSuggestions({
  suggestions,
  loading,
  highlightedIndex,
  onSelect,
  onHover,
}: SearchSuggestionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white/90 dark:bg-zinc-800/80 shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.7)]"
    >
      {suggestions.length === 0 && loading ? (
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Recherche...
        </div>
      ) : (
        <ul className="max-h-80 overflow-y-auto py-1.5">
          {suggestions.map((item, i) => {
            const active = i === highlightedIndex;
            return (
              <li key={`${item.mediaType}-${item.id}`}>
                <button
                  type="button"
                  // évite le blur de l'input avant le clic
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => onHover(i)}
                  onClick={() => onSelect(item)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                    active
                      ? "bg-indigo-500/12 dark:bg-indigo-500/20"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {item.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${item.posterPath}`}
                      alt=""
                      className="h-12 w-8 shrink-0 rounded object-cover ring-1 ring-black/10 dark:ring-white/10"
                    />
                  ) : (
                    <span className="flex h-12 w-8 shrink-0 items-center justify-center rounded bg-black/8 dark:bg-white/8">
                      {item.mediaType === "movie" ? (
                        <Clapperboard className="h-4 w-4 text-zinc-400" />
                      ) : (
                        <Tv className="h-4 w-4 text-zinc-400" />
                      )}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-900 dark:text-white">
                      {item.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
                      {item.mediaType === "movie" ? (
                        <Clapperboard className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                      ) : (
                        <Tv className="h-3 w-3 text-cyan-500 dark:text-cyan-400" />
                      )}
                      {item.mediaType === "movie" ? "Film" : "Série"}
                      {item.year && (
                        <span className="text-zinc-400 dark:text-zinc-600">· {item.year}</span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
