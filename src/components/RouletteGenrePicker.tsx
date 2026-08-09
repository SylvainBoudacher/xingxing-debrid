import { ROULETTE_GENRES } from "@/lib/rouletteGenres";

interface RouletteGenrePickerProps {
  selected: number[];
  /** Desactive pendant le chargement et l'animation. */
  disabled: boolean;
  onToggle: (id: number) => void;
  onClear: () => void;
}

// Puces multi-selection. Aucune cochee = tirage sur tout le catalogue, ce que
// la puce "Tous genres" rend explicite au lieu de le laisser deviner.
export function RouletteGenrePicker({
  selected,
  disabled,
  onToggle,
  onClear,
}: RouletteGenrePickerProps) {
  const pill = (active: boolean) =>
    `cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 transition-colors disabled:cursor-default disabled:opacity-40 ${
      active
        ? "bg-indigo-600 text-white ring-indigo-500"
        : "bg-white/90 text-zinc-500 ring-black/10 hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-400 dark:ring-white/10 dark:hover:bg-zinc-700/80 dark:hover:text-white"
    }`;

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      <button disabled={disabled} onClick={onClear} className={pill(selected.length === 0)}>
        Tous genres
      </button>
      {ROULETTE_GENRES.map((g) => (
        <button
          key={g.id}
          disabled={disabled}
          onClick={() => onToggle(g.id)}
          className={pill(selected.includes(g.id))}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
}
