import {
  Checkbox,
  DebridActions,
  ResumeButton,
  SelectionBox,
  type DebridControls,
} from "@/components/libraryParts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setSeasonItemsWatched, toggleFile, type LibraryEntry } from "@/lib/library";
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
  autoWatchOnPlay: boolean;
  selection?: EpisodeSelection;
}

// En-tête de la saison affichée : tout vu, plage d'épisodes, reprise, VLC et
// téléchargement de toute la saison.
export function TitleSectionBar({
  section,
  ranges,
  rangeIndex,
  onRangeChange,
  sectionKey,
  debrid,
  onChange,
  autoWatchOnPlay,
  selection,
}: TitleSectionBarProps) {
  const items = section.items;
  const seen = items.filter(isItemWatched).length;
  const allSeen = seen === items.length;
  const links = items.map((it) => it.file.link);
  const next = items.find((it) => !isItemWatched(it)) ?? null;
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
      ) : (
        <Checkbox
          checked={allSeen}
          onClick={() => setSeasonItemsWatched(items, !allSeen, onChange)}
        />
      )}
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
        <div className="ml-auto flex flex-none items-center gap-3">
          {next && (
            <ResumeButton
              next={next.file}
              groupKey={`resume-${sectionKey}`}
              debrid={debrid}
              started={seen > 0}
              hideSeason
              onResume={() => autoWatchOnPlay && onChange(toggleFile(next.entry, next.file.name))}
            />
          )}
          <DebridActions links={links} groupKey={sectionKey} debrid={debrid} />
        </div>
      )}
    </div>
  );
}
