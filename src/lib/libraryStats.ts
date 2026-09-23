import {
  groupIsWholeWatched,
  groupLibraryEntries,
  isSeries,
  isWholeWatched,
  type LibraryEntry,
} from "@/lib/library";

export interface LibraryStats {
  titles: number;
  movies: number;
  series: number;
  size: number;
  watched: number;
}

// Compté sur les cartes affichées : une série regroupée est un seul titre, vu
// seulement quand toutes ses entrées le sont.
export function libraryStats(entries: LibraryEntry[]): LibraryStats {
  const stats: LibraryStats = { titles: 0, movies: 0, series: 0, size: 0, watched: 0 };
  for (const item of groupLibraryEntries(entries)) {
    stats.titles++;
    if (item.type === "group") {
      stats.series++;
      if (groupIsWholeWatched(item.group)) stats.watched++;
    } else {
      if (isSeries(item.entry)) stats.series++;
      else stats.movies++;
      if (isWholeWatched(item.entry)) stats.watched++;
    }
  }
  for (const e of entries) stats.size += e.size;
  return stats;
}

const GB = 1024 ** 3;
const TB = 1024 ** 4;

export function formatLibrarySize(bytes: number): string {
  const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  if (bytes >= TB) return `${fmt(bytes / TB)} To`;
  if (bytes >= GB) return `${fmt(bytes / GB)} Go`;
  return `${Math.round(bytes / 1024 ** 2)} Mo`;
}
