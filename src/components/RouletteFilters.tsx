import { RouletteGenrePicker } from "@/components/RouletteGenrePicker";
import { RouletteOwnedFilter } from "@/components/RouletteOwnedFilter";
import { RoulettePoolCount } from "@/components/RoulettePoolCount";
import { RouletteSourcePicker } from "@/components/RouletteSourcePicker";
import { genresApply, type RouletteSource } from "@/lib/rouletteSource";

interface RouletteFiltersProps {
  source: RouletteSource;
  genreIds: number[];
  excludeOwned: boolean;
  /** Taille du vivier annoncee par TMDB. null = pas encore connue. */
  poolCount: number | null;
  disabled: boolean;
  onSelectSource: (source: RouletteSource) => void;
  onToggleGenre: (id: number) => void;
  onClearGenres: () => void;
  onToggleExcludeOwned: () => void;
}

export function RouletteFilters({
  source,
  genreIds,
  excludeOwned,
  poolCount,
  disabled,
  onSelectSource,
  onToggleGenre,
  onClearGenres,
  onToggleExcludeOwned,
}: RouletteFiltersProps) {
  return (
    <div className="rounded-2xl bg-white/60 p-5 ring-1 ring-black/5 backdrop-blur-xl dark:bg-zinc-900/50 dark:ring-white/5">
      <RouletteSourcePicker source={source} disabled={disabled} onSelect={onSelectSource} />

      <div className="my-5 h-px bg-black/5 dark:bg-white/5" />

      <div className={genresApply(source) ? undefined : "opacity-40"}>
        <RouletteGenrePicker
          selected={genreIds}
          disabled={disabled || !genresApply(source)}
          onToggle={onToggleGenre}
          onClear={onClearGenres}
        />
        {genresApply(source) && genreIds.length > 1 && (
          <p className="mt-2.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            Les genres se cumulent : le film tiré portera les {genreIds.length} genres cochés.
          </p>
        )}
      </div>

      <div className="my-5 h-px bg-black/5 dark:bg-white/5" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <RouletteOwnedFilter
          checked={excludeOwned}
          disabled={disabled}
          onToggle={onToggleExcludeOwned}
        />
        <RoulettePoolCount count={poolCount} />
      </div>
    </div>
  );
}
