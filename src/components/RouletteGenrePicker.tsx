import { ROULETTE_GENRES } from "@/lib/rouletteGenres";
import { Check, RotateCcw } from "lucide-react";

interface RouletteGenrePickerProps {
  selected: number[];
  /** Desactive pendant le chargement, l'animation et en mode Letterboxd. */
  disabled: boolean;
  onToggle: (id: number) => void;
  onClear: () => void;
}

// Selection cumulative : le tirage ne garde que les films portant TOUS les
// genres coches. Le bouton de remise a zero n'apparaît que s'il a un effet.
export function RouletteGenrePicker({
  selected,
  disabled,
  onToggle,
  onClear,
}: RouletteGenrePickerProps) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Genres
          {selected.length > 0 && (
            <span className="ml-1.5 text-indigo-600 dark:text-indigo-400">({selected.length})</span>
          )}
        </span>
        {selected.length > 0 && !disabled && (
          <button
            onClick={onClear}
            className="flex cursor-pointer items-center gap-1 text-[11px] font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
            Tout décocher
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ROULETTE_GENRES.map(({ id, name, Icon }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onToggle(id)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 transition-all disabled:cursor-default disabled:opacity-40 ${
                active
                  ? "bg-indigo-600 text-white ring-indigo-500 shadow-sm shadow-indigo-600/30"
                  : "bg-white/70 text-zinc-600 ring-black/10 hover:bg-white hover:text-zinc-900 dark:bg-white/5 dark:text-zinc-400 dark:ring-white/10 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              {active ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : (
                <Icon className="h-3.5 w-3.5 opacity-70" />
              )}
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
