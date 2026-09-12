import { TitleEpisodeRow } from "@/components/libraryTitle/TitleEpisodeRow";
import { TitleMissingNote } from "@/components/libraryTitle/TitleMissingNote";
import { TitleSectionBar } from "@/components/libraryTitle/TitleSectionBar";
import type { DebridControls } from "@/components/libraryParts";
import type { LibraryEntry } from "@/lib/library";
import {
  displayedSeasons,
  episodeRanges,
  initialRangeIndex,
  missingEpisodes,
  rangeItems,
  type TitleItem,
  type TitleSection,
} from "@/lib/libraryTitle";
import type { EpisodeSelection } from "@/lib/useEpisodeSelection";
import { useTmdbSeasons } from "@/lib/useTitleTmdb";
import { useMemo, useState } from "react";

interface TitleEpisodeListProps {
  section: TitleSection;
  // Série TMDB : active titres, vignettes et épisodes manquants.
  tvId: number | null;
  tmdbKey?: string;
  nextLink: string | null;
  sectionKey: string;
  debrid: DebridControls;
  onChange: (entry: LibraryEntry) => void;
  onPlay: (item: TitleItem, key: string) => void;
  onWatch: (item: TitleItem) => void;
  simple: boolean;
  selection?: EpisodeSelection;
  onSelectEpisodes?: () => void;
  onFindMore?: () => void;
}

// Liste d'une section. Montée avec key={section.key} : chaque changement de
// saison repart sur la plage du prochain épisode à voir.
export function TitleEpisodeList({
  section,
  tvId,
  tmdbKey,
  nextLink,
  sectionKey,
  debrid,
  onChange,
  onPlay,
  onWatch,
  simple,
  selection,
  onSelectEpisodes,
  onFindMore,
}: TitleEpisodeListProps) {
  const items = section.items;
  const ranges = useMemo(() => episodeRanges(items.length), [items.length]);
  const [rangeIndex, setRangeIndex] = useState(() => initialRangeIndex(items));
  const visible = useMemo(() => rangeItems(items, ranges, rangeIndex), [items, ranges, rangeIndex]);
  const seasons = useMemo(
    () => (tvId === null ? [] : displayedSeasons(section, visible)),
    [tvId, section, visible],
  );
  const tmdbSeasons = useTmdbSeasons(tvId, seasons, tmdbKey);

  const sectionEpisodes =
    section.season !== null ? [...(tmdbSeasons.get(section.season)?.values() ?? [])] : [];
  const missing = missingEpisodes(section, sectionEpisodes, new Date().toISOString().slice(0, 10));

  return (
    <div className="overflow-hidden rounded-2xl bg-white/70 ring-1 ring-black/5 dark:bg-zinc-900/60 dark:ring-white/10">
      <TitleSectionBar
        section={section}
        ranges={ranges}
        rangeIndex={Math.min(rangeIndex, Math.max(ranges.length - 1, 0))}
        onRangeChange={setRangeIndex}
        sectionKey={sectionKey}
        debrid={debrid}
        onChange={onChange}
        selection={selection}
        onSelectEpisodes={onSelectEpisodes}
      />
      <ul className="divide-y divide-black/5 dark:divide-white/5">
        {visible.map((it, i) => (
          <TitleEpisodeRow
            key={`${it.entry.infoHash}-${it.file.name}`}
            index={i}
            item={it}
            episode={
              it.season !== null && it.episode !== null
                ? tmdbSeasons.get(it.season)?.get(it.episode)
                : undefined
            }
            isNext={it.file.link === nextLink}
            simple={simple}
            debrid={debrid}
            onPlay={onPlay}
            onWatch={onWatch}
            selection={selection}
          />
        ))}
      </ul>
      {missing.length > 0 && !selection && (
        <TitleMissingNote episodes={missing} onFindMore={onFindMore} />
      )}
    </div>
  );
}
