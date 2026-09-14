import type { MangaLayout } from "@/lib/mangaPrefs";
import type { ShelfCounts, ShelfFilter } from "@/lib/mangaShelf";
import { LayoutGrid, List, ListChecks } from "lucide-react";

interface MangaShelfBarProps {
  counts: ShelfCounts;
  filter: ShelfFilter;
  onFilter: (filter: ShelfFilter) => void;
  layout: MangaLayout;
  onLayout: (layout: MangaLayout) => void;
  selecting: boolean;
  onToggleSelect: () => void;
}

const FILTERS: Array<[ShelfFilter, string, keyof ShelfCounts]> = [
  ["all", "Tous", "total"],
  ["owned", "Possédés", "owned"],
  ["unread", "Non lus", "unread"],
  ["missing", "Manquants", "missing"],
];

export function MangaShelfBar({
  counts,
  filter,
  onFilter,
  layout,
  onLayout,
  selecting,
  onToggleSelect,
}: MangaShelfBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 overflow-x-auto">
        {FILTERS.map(([id, label, count]) =>
          id === "missing" && counts.missing === 0 ? null : (
            <button
              key={id}
              onClick={() => onFilter(id)}
              className={`flex h-7 flex-none items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
                filter === id
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
              }`}
            >
              {label}
              <span className="tabular-nums opacity-60">{counts[count]}</span>
            </button>
          ),
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onToggleSelect}
          className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
            selecting
              ? "bg-indigo-600 text-white hover:bg-indigo-500"
              : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
          }`}
        >
          <ListChecks className="h-3.5 w-3.5" />
          Sélectionner
        </button>
        <div className="flex items-center rounded-full bg-black/5 p-0.5 dark:bg-white/10">
          {(
            [
              ["grid", LayoutGrid, "Vue grille"],
              ["list", List, "Vue liste"],
            ] as const
          ).map(([id, Icon, title]) => (
            <button
              key={id}
              onClick={() => onLayout(id)}
              title={title}
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                layout === id
                  ? "bg-white text-indigo-600 shadow-sm dark:bg-zinc-700 dark:text-indigo-300"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
