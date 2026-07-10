import { ArrowDown, ArrowUp, SlidersHorizontal } from "lucide-react";

export type ReleaseSort = "seeders" | "size" | "resolution";

const SORTS = [
  ["seeders", "Seeders"],
  ["size", "Taille"],
  ["resolution", "Qualité"],
] as const;

interface DiscoverReleaseFiltersProps {
  sort: ReleaseSort;
  sortDir: "asc" | "desc";
  resOptions: string[];
  langOptions: string[];
  resFilter: string | null;
  langFilter: string | null;
  onSort: (key: ReleaseSort) => void;
  onResFilter: (r: string | null) => void;
  onLangFilter: (l: string | null) => void;
}

// Barre de tri (seeders / taille / qualité) et filtres résolution / langue
// des releases d'une fiche.
export function DiscoverReleaseFilters({
  sort,
  sortDir,
  resOptions,
  langOptions,
  resFilter,
  langFilter,
  onSort,
  onResFilter,
  onLangFilter,
}: DiscoverReleaseFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-5 pb-3">
      <SlidersHorizontal className="mr-0.5 h-3.5 w-3.5 text-zinc-500" />
      {SORTS.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onSort(key)}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors ${
            sort === key
              ? "bg-indigo-600 text-white ring-indigo-500"
              : "bg-white/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 ring-black/10 dark:ring-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          {label}
          {sort === key &&
            (sortDir === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUp className="h-3 w-3" />
            ))}
        </button>
      ))}
      {(resOptions.length > 1 || langOptions.length > 1) && (
        <span className="mx-1 h-4 w-px bg-black/10 dark:bg-white/10" />
      )}
      {resOptions.length > 1 &&
        resOptions.map((r) => (
          <button
            key={r}
            onClick={() => onResFilter(resFilter === r ? null : r)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ring-1 transition-colors ${
              resFilter === r
                ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 ring-indigo-500/50"
                : "bg-white/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 ring-black/10 dark:ring-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            {r}
          </button>
        ))}
      {langOptions.length > 1 &&
        langOptions.map((l) => (
          <button
            key={l}
            onClick={() => onLangFilter(langFilter === l ? null : l)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ring-1 transition-colors ${
              langFilter === l
                ? "bg-green-500/15 text-green-600 dark:text-green-400 ring-green-500/40"
                : "bg-white/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 ring-black/10 dark:ring-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            {l}
          </button>
        ))}
    </div>
  );
}
