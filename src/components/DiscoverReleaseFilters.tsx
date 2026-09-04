import { chipClass, CHIP_TRACK, toggleChipClass } from "@/components/chipStyles";
import { ArrowDown, ArrowUp } from "lucide-react";

export type ReleaseSort = "episode" | "seeders" | "size" | "resolution";

const SORTS = [
  ["episode", "Épisode"],
  ["seeders", "Seeders"],
  ["size", "Taille"],
  ["resolution", "Qualité"],
] as const;

interface DiscoverReleaseFiltersProps {
  sort: ReleaseSort;
  /** Le tri par épisode n'a de sens que pour les séries */
  showEpisodeSort: boolean;
  sortDir: "asc" | "desc";
  resOptions: string[];
  langOptions: string[];
  resFilter: string | null;
  langFilter: string | null;
  onSort: (key: ReleaseSort) => void;
  onResFilter: (r: string | null) => void;
  onLangFilter: (l: string | null) => void;
}

// Barre de tri (épisode / seeders / taille / qualité) et filtres résolution / langue
// des releases d'une fiche.
export function DiscoverReleaseFilters({
  sort,
  showEpisodeSort,
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
    <div className="flex flex-wrap items-center gap-2 px-5 pb-3">
      <div className={CHIP_TRACK}>
        {SORTS.filter(([key]) => key !== "episode" || showEpisodeSort).map(([key, label]) => (
          <button
            key={key}
            onClick={() => onSort(key)}
            className={`${chipClass(sort === key)} inline-flex items-center gap-1`}
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
      </div>
      {(resOptions.length > 1 || langOptions.length > 1) && (
        <div className={CHIP_TRACK}>
          {resOptions.length > 1 &&
            resOptions.map((r) => (
              <button
                key={r}
                onClick={() => onResFilter(resFilter === r ? null : r)}
                className={toggleChipClass(resFilter === r, "indigo")}
              >
                {r}
              </button>
            ))}
          {resOptions.length > 1 && langOptions.length > 1 && (
            <span className="mx-1 h-4 w-px bg-black/10 dark:bg-white/10" />
          )}
          {langOptions.length > 1 &&
            langOptions.map((l) => (
              <button
                key={l}
                onClick={() => onLangFilter(langFilter === l ? null : l)}
                className={toggleChipClass(langFilter === l, "green")}
              >
                {l}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
