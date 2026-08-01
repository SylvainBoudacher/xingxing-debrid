import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LibrarySort } from "@/lib/libraryPrefs";
import type { GenreOption, GroupMode } from "@/lib/librarySections";
import { Check, SlidersHorizontal, X } from "lucide-react";

export const SORTS: { id: LibrarySort; label: string }[] = [
  { id: "manual", label: "Manuel" },
  { id: "recent", label: "Plus récents" },
  { id: "title", label: "Titre (A-Z)" },
  { id: "size", label: "Taille" },
  { id: "progress", label: "À finir" },
];

export const GROUP_MODES: { id: GroupMode; label: string; hint: string }[] = [
  { id: "none", label: "Aucun", hint: "Aucun regroupement" },
  { id: "type", label: "Type", hint: "Séparer films / séries" },
  { id: "genre", label: "Genre", hint: "Grouper par genre (films et séries séparés)" },
  { id: "category", label: "Personnalisé", hint: "Vos catégories, rangées au glisser-déposer" },
];

interface LibraryDisplayMenuProps {
  sort: LibrarySort;
  onSortChange: (sort: LibrarySort) => void;
  /** Le tri manuel (glisser-déposer) n'existe qu'en vue liste. */
  allowManualSort: boolean;
  grouping: GroupMode;
  onGroupingChange: (grouping: GroupMode) => void;
  genreOptions: GenreOption[];
  genreFilter: Set<string>;
  onToggleGenre: (name: string) => void;
  onClearGenres: () => void;
}

// Tri, regroupement et genres réunis dans un seul menu : la barre d'outils ne
// garde que ce qui se manipule en un clic (filtres, sélection, vue).
export function LibraryDisplayMenu({
  sort,
  onSortChange,
  allowManualSort,
  grouping,
  onGroupingChange,
  genreOptions,
  genreFilter,
  onToggleGenre,
  onClearGenres,
}: LibraryDisplayMenuProps) {
  // Mis en avant seulement quand un genre filtre la bibliothèque : le
  // regroupement, lui, ne cache aucun titre.
  const active = genreFilter.size > 0;
  const sorts = SORTS.filter((s) => s.id !== "manual" || allowManualSort);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title="Tri, regroupement et genres"
          className={`flex h-8 flex-none items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
            active
              ? "bg-indigo-600 text-white"
              : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Affichage
          {genreFilter.size > 0 && (
            <span className="rounded-full bg-white/25 px-1.5 text-[10px] leading-4">
              {genreFilter.size}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 space-y-4 p-3">
        <Section label="Trier par">
          <div className="space-y-0.5">
            {sorts.map((s) => (
              <button
                key={s.id}
                onClick={() => onSortChange(s.id)}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  sort === s.id
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                    : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
                }`}
              >
                {s.label}
                {sort === s.id && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </Section>

        <Section label="Regrouper">
          <div className="flex flex-wrap gap-1.5">
            {GROUP_MODES.map((m) => (
              <Chip
                key={m.id}
                label={m.label}
                title={m.hint}
                on={grouping === m.id}
                onClick={() => onGroupingChange(m.id)}
              />
            ))}
          </div>
        </Section>

        {genreOptions.length > 0 && (
          <Section
            label="Genres"
            action={
              genreFilter.size > 0 && (
                <button
                  onClick={onClearGenres}
                  className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                >
                  <X className="h-3 w-3" />
                  Effacer
                </button>
              )
            }
          >
            <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">
              {genreOptions.map((o) => (
                <Chip
                  key={o.name}
                  label={o.name}
                  count={o.count}
                  on={genreFilter.has(o.name)}
                  onClick={() => onToggleGenre(o.name)}
                />
              ))}
            </div>
          </Section>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Section({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          {label}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

function Chip({
  label,
  count,
  title,
  on,
  onClick,
}: {
  label: string;
  count?: number;
  title?: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium transition-colors ${
        on
          ? "bg-indigo-600 text-white"
          : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={on ? "text-indigo-200" : "text-zinc-400 dark:text-zinc-500"}>{count}</span>
      )}
    </button>
  );
}
