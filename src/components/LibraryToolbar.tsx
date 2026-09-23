import type { LibraryCounts } from "@/lib/library";
import type { LibraryFilter, LibraryLayout } from "@/lib/libraryPrefs";
import { useDragScroll } from "@/lib/useDragScroll";
import { CheckSquare, LayoutGrid, List, Search } from "lucide-react";
import type { ReactNode, Ref } from "react";

const FILTERS: { id: LibraryFilter; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "todo", label: "À voir" },
  { id: "done", label: "Vu" },
];

interface LibraryToolbarProps {
  barRef: Ref<HTMLDivElement>;
  top: number;
  stuck: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  filter: LibraryFilter;
  counts: LibraryCounts;
  onFilterChange: (filter: LibraryFilter) => void;
  layout: LibraryLayout;
  onLayoutChange: (layout: LibraryLayout) => void;
  selectMode: boolean;
  onToggleSelect: () => void;
  displayMenu: ReactNode;
}

// Recherche + filtres : collés sous le header, pour rester à portée sans
// remonter en haut d'une grosse bibliothèque. Une fois accrochés, ils prennent
// l'aspect d'une carte flottante (verre + ombre) ; posés, ils se fondent dans la
// page. Le padding et la bordure existent dans les deux états (-mx compensé)
// pour que rien ne bouge à la bascule. Le z-index dépasse celui des pastilles
// des jaquettes (z-10), qui sinon défileraient par-dessus.
export function LibraryToolbar({
  barRef,
  top,
  stuck,
  query,
  onQueryChange,
  filter,
  counts,
  onFilterChange,
  layout,
  onLayoutChange,
  selectMode,
  onToggleSelect,
  displayMenu,
}: LibraryToolbarProps) {
  const { ref: scrollRef, dragProps } = useDragScroll<HTMLDivElement>();

  return (
    <div
      ref={barRef}
      style={{ top }}
      className={`sticky z-20 -mx-3 mb-4 rounded-2xl border p-3 transition-[background-color,border-color,box-shadow] duration-200 ${
        stuck
          ? "border-black/10 bg-white/70 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/70"
          : "border-transparent"
      }`}
    >
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Rechercher un titre..."
          className="w-full rounded-lg border border-black/10 bg-white/70 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-zinc-900/60 dark:text-white"
        />
      </div>

      {/* La barre défile horizontalement plutôt que d'écraser ses libellés quand
      elle déborde (min-w-max), le glisser reproduit le défilement là où la
      molette horizontale manque. */}
      <div
        ref={scrollRef}
        {...dragProps}
        className="cursor-grab overflow-x-auto select-none active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-full min-w-max items-center justify-between gap-2">
          <div className="flex flex-none items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => onFilterChange(f.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f.id
                    ? "bg-indigo-600 text-white"
                    : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
                }`}
              >
                {f.label} ({counts[f.id]})
              </button>
            ))}
          </div>

          <div className="flex flex-none items-center gap-2">
            {layout === "grid" && (
              <button
                onClick={onToggleSelect}
                title="Sélection multiple"
                className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
                  selectMode
                    ? "bg-indigo-600 text-white"
                    : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
                }`}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Sélection
              </button>
            )}

            {displayMenu}

            <div className="flex items-center rounded-full bg-black/5 p-0.5 dark:bg-white/10">
              {(
                [
                  ["list", List],
                  ["grid", LayoutGrid],
                ] as const
              ).map(([id, Icon]) => (
                <button
                  key={id}
                  onClick={() => onLayoutChange(id)}
                  title={id === "list" ? "Vue liste" : "Vue grille"}
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                    layout === id
                      ? "bg-white text-indigo-600 shadow-sm dark:bg-zinc-700 dark:text-indigo-300"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
