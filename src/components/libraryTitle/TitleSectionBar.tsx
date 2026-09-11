import { SelectionBox, type DebridControls } from "@/components/libraryParts";
import { TitleSectionMenu } from "@/components/libraryTitle/TitleSectionMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setSeasonItemsWatched, type LibraryEntry } from "@/lib/library";
import {
  isItemWatched,
  rangeLabel,
  type EpisodeRange,
  type TitleSection,
} from "@/lib/libraryTitle";
import type { EpisodeSelection } from "@/lib/useEpisodeSelection";
import { ChevronDown } from "lucide-react";

interface TitleSectionBarProps {
  section: TitleSection;
  ranges: EpisodeRange[];
  rangeIndex: number;
  onRangeChange: (index: number) => void;
  // Clé des actions AllDebrid de la saison (spinners).
  sectionKey: string;
  debrid: DebridControls;
  onChange: (entry: LibraryEntry) => void;
  selection?: EpisodeSelection;
  onSelectEpisodes?: () => void;
}

// En-tête de la saison affichée : plage d'épisodes et menu regroupant les
// actions qui portent sur la saison entière.
export function TitleSectionBar({
  section,
  ranges,
  rangeIndex,
  onRangeChange,
  sectionKey,
  debrid,
  onChange,
  selection,
  onSelectEpisodes,
}: TitleSectionBarProps) {
  const items = section.items;
  const seen = items.filter(isItemWatched).length;
  const allSeen = seen === items.length;
  const links = items.map((it) => it.file.link);
  const allSelected = !!selection && links.every((l) => selection.has(l));

  return (
    <div className="flex items-center gap-3 border-b border-black/5 bg-black/[0.02] px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
      {selection ? (
        <button
          onClick={() => selection.setMany(links, !allSelected)}
          title="Sélectionner toute la saison"
        >
          <SelectionBox checked={allSelected} />
        </button>
      ) : null}
      <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        {section.label}
      </span>
      <span className="flex-none text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
        {seen}/{items.length} vus
      </span>
      {ranges.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-7 flex-none items-center gap-1 rounded-lg bg-black/5 px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15">
              {rangeLabel(items, ranges[rangeIndex])}
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
            {ranges.map((r, i) => (
              <DropdownMenuItem key={r.start} onClick={() => onRangeChange(i)}>
                {rangeLabel(items, r)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {!selection && (
        <div className="ml-auto flex-none">
          <TitleSectionMenu
            count={items.length}
            links={links}
            sectionKey={sectionKey}
            debrid={debrid}
            allSeen={allSeen}
            onToggleSeenAll={() => setSeasonItemsWatched(items, !allSeen, onChange)}
            onSelectEpisodes={onSelectEpisodes}
          />
        </div>
      )}
    </div>
  );
}
