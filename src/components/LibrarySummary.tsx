import type { LibraryEntry } from "@/lib/library";
import { formatLibrarySize, libraryStats } from "@/lib/libraryStats";
import { useMemo } from "react";

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

// Repère fixe sur toute la bibliothèque : ne suit ni la recherche ni les filtres.
export function LibrarySummary({ entries }: { entries: LibraryEntry[] }) {
  const stats = useMemo(() => libraryStats(entries), [entries]);
  if (stats.titles === 0) return null;

  const parts = [
    plural(stats.titles, "titre"),
    plural(stats.movies, "film"),
    plural(stats.series, "série"),
    formatLibrarySize(stats.size),
    `${Math.round((stats.watched / stats.titles) * 100)} % vus`,
  ];

  return (
    <p className="mb-3 text-center text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
      {parts.join(" · ")}
    </p>
  );
}
