import { mangaCoverUrl, MANGA_STATUS_LABELS, type MangaItem } from "@/lib/mangaItem";
import { BookOpen } from "lucide-react";
import { motion } from "motion/react";

interface MangaSearchSuggestionsProps {
  suggestions: MangaItem[];
  highlightedIndex: number;
  onSelect: (item: MangaItem) => void;
  onHover: (index: number) => void;
}

export function MangaSearchSuggestions({
  suggestions,
  highlightedIndex,
  onSelect,
  onHover,
}: MangaSearchSuggestionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden border-t border-black/8 dark:border-white/8"
    >
      <ul className="max-h-80 overflow-y-auto py-1.5">
        {suggestions.map((item, i) => {
          const active = i === highlightedIndex;
          const cover = mangaCoverUrl(item, 256);
          return (
            <li key={item.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => onHover(i)}
                onClick={() => onSelect(item)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                  active
                    ? "bg-indigo-500/12 dark:bg-indigo-500/20"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {cover ? (
                  <img
                    src={cover}
                    alt=""
                    className="h-12 w-8 shrink-0 rounded object-cover ring-1 ring-black/10 dark:ring-white/10"
                  />
                ) : (
                  <span className="flex h-12 w-8 shrink-0 items-center justify-center rounded bg-black/8 dark:bg-white/8">
                    <BookOpen className="h-4 w-4 text-zinc-400" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-900 dark:text-white">
                    {item.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <BookOpen className="h-3 w-3 text-orange-500 dark:text-orange-400" />
                    {MANGA_STATUS_LABELS[item.status]}
                    {item.year && (
                      <span className="text-zinc-400 dark:text-zinc-500">· {item.year}</span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
