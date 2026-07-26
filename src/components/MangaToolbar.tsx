import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDragScroll } from "@/lib/useDragScroll";
import type { MangaFilter, MangaGrouping, MangaLayout, MangaSort } from "@/lib/mangaPrefs";
import { Layers, LayoutGrid, List, Search } from "lucide-react";

const FILTERS: { id: MangaFilter; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "todo", label: "À lire" },
  { id: "done", label: "Lu" },
];

const GROUP_MODES: { id: MangaGrouping; label: string }[] = [
  { id: "none", label: "Aucun" },
  { id: "category", label: "Personnalisé" },
];

const SORTS: { id: MangaSort; label: string }[] = [
  { id: "recent", label: "Plus récents" },
  { id: "title", label: "Titre (A-Z)" },
  { id: "size", label: "Taille" },
];

interface MangaToolbarProps {
  query: string;
  onQuery: (value: string) => void;
  filter: MangaFilter;
  counts: Record<MangaFilter, number>;
  onFilter: (value: MangaFilter) => void;
  grouping: MangaGrouping;
  onGrouping: (value: MangaGrouping) => void;
  layout: MangaLayout;
  onLayout: (value: MangaLayout) => void;
  sort: MangaSort;
  onSort: (value: MangaSort) => void;
}

// Recherche, filtres et tri de l'onglet Mangas : mêmes commandes que l'onglet
// films et séries, sur les champs propres aux mangas.
export function MangaToolbar({
  query,
  onQuery,
  filter,
  counts,
  onFilter,
  grouping,
  onGrouping,
  layout,
  onLayout,
  sort,
  onSort,
}: MangaToolbarProps) {
  const { ref, dragProps } = useDragScroll<HTMLDivElement>();

  return (
    <>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Rechercher un manga..."
          className="w-full rounded-lg border border-black/10 bg-white/70 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-zinc-900/60 dark:text-white"
        />
      </div>

      {/* La barre défile horizontalement plutôt que d'écraser ses libellés
      quand elle déborde ; le glisser remplace la molette horizontale. */}
      <div
        ref={ref}
        {...dragProps}
        className="mb-4 cursor-grab overflow-x-auto select-none active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-full min-w-max items-center justify-between gap-2">
          <div className="flex flex-none items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => onFilter(f.id)}
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
            <div className="flex items-center gap-1 rounded-full bg-black/5 p-0.5 dark:bg-white/10">
              <Layers className="ml-2 mr-0.5 h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
              {GROUP_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onGrouping(m.id)}
                  title={
                    m.id === "category"
                      ? "Grouper par catégorie personnalisée"
                      : "Aucun regroupement"
                  }
                  className={`flex h-7 items-center rounded-full px-2.5 text-xs font-medium transition-colors ${
                    grouping === m.id
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center rounded-full bg-black/5 p-0.5 dark:bg-white/10">
              {(
                [
                  ["list", List],
                  ["grid", LayoutGrid],
                ] as const
              ).map(([id, Icon]) => (
                <button
                  key={id}
                  onClick={() => onLayout(id)}
                  title={id === "list" ? "Vue liste" : "Vue jaquettes"}
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

            <Select value={sort} onValueChange={(v) => onSort(v as MangaSort)}>
              <SelectTrigger className="h-8 w-auto gap-1 rounded-full px-3 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </>
  );
}
