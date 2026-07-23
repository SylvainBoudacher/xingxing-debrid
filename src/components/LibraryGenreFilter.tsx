import type { GenreOption } from "@/lib/librarySections";
import { useDragScroll } from "@/lib/useDragScroll";
import { X } from "lucide-react";

interface LibraryGenreFilterProps {
  options: GenreOption[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onClear: () => void;
}

// Barre de genres : sélection multiple, un titre est gardé s'il porte l'un des
// genres cochés. Défilement horizontal (la liste peut faire une vingtaine
// d'entrées sur une grosse bibliothèque).
export function LibraryGenreFilter({
  options,
  selected,
  onToggle,
  onClear,
}: LibraryGenreFilterProps) {
  const { ref, dragProps } = useDragScroll<HTMLDivElement>();

  return (
    <div className="flex items-center gap-2">
      <div
        ref={ref}
        {...dragProps}
        className="flex flex-1 cursor-grab select-none items-center gap-1.5 overflow-x-auto pb-1 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((o) => {
          const on = selected.has(o.name);
          return (
            <button
              key={o.name}
              onClick={() => onToggle(o.name)}
              className={`flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-medium transition-colors ${
                on
                  ? "bg-indigo-600 text-white"
                  : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
              }`}
            >
              {o.name}
              <span className={on ? "text-indigo-200" : "text-zinc-400 dark:text-zinc-500"}>
                {o.count}
              </span>
            </button>
          );
        })}
      </div>
      {selected.size > 0 && (
        <button
          onClick={onClear}
          title="Effacer les genres"
          className="flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
          Effacer
        </button>
      )}
    </div>
  );
}
