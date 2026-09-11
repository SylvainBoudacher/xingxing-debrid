import {
  Checkbox,
  DebridActions,
  SelectionBox,
  type DebridControls,
} from "@/components/libraryParts";
import { formatSize } from "@/lib/debrid";
import { toggleFile, type LibraryEntry } from "@/lib/library";
import { fileDisplayName, formatRuntime, isItemWatched, type TitleItem } from "@/lib/libraryTitle";
import type { TmdbEpisode } from "@/lib/services/tmdb";
import type { EpisodeSelection } from "@/lib/useEpisodeSelection";
import { Check, Loader2, Play } from "lucide-react";

interface TitleEpisodeRowProps {
  item: TitleItem;
  // Épisode TMDB correspondant, absent sans correspondance (nom de fichier).
  episode?: TmdbEpisode;
  // Image de repli sans vignette d'épisode (backdrop d'un film).
  fallbackImage?: string | null;
  isNext: boolean;
  simple: boolean;
  debrid: DebridControls;
  onChange: (entry: LibraryEntry) => void;
  onPlay: (item: TitleItem, key: string) => void;
  selection?: EpisodeSelection;
}

export function TitleEpisodeRow({
  item,
  episode,
  fallbackImage,
  isNext,
  simple,
  debrid,
  onChange,
  onPlay,
  selection,
}: TitleEpisodeRowProps) {
  const { file } = item;
  const watched = isItemWatched(item);
  const playing = debrid.bulkVlc === file.link;
  const selected = selection?.has(file.link) ?? false;
  const still = episode?.still_path ?? fallbackImage;
  const name = episode?.name || fileDisplayName(file.name, simple);

  return (
    <li
      onClick={selection ? () => selection.toggle(file.link) : undefined}
      className={`flex items-center gap-4 px-4 py-3 transition-colors ${
        selection ? "cursor-pointer" : ""
      } ${selected ? "bg-indigo-500/10" : "hover:bg-black/[0.025] dark:hover:bg-white/[0.04]"}`}
    >
      {selection && <SelectionBox checked={selected} />}

      <button
        onClick={() => onPlay(item, file.link)}
        disabled={playing}
        title="Lire avec VLC"
        className={`group relative aspect-video w-40 flex-none overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800 ${
          isNext ? "ring-2 ring-emerald-500" : "ring-1 ring-black/10 dark:ring-white/10"
        } ${selection ? "pointer-events-none" : ""}`}
      >
        {still ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${still}`}
            alt=""
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover ${watched ? "brightness-[0.6]" : ""}`}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-mono text-sm font-semibold text-zinc-400 dark:text-zinc-500">
            {item.episode !== null ? `E${item.episode}` : ""}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center transition-colors group-hover:bg-black/40">
          {playing ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : (
            <Play className="h-7 w-7 fill-white text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100" />
          )}
        </span>
        {watched && (
          <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`flex items-baseline gap-2 text-sm font-medium ${
            watched ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100"
          }`}
        >
          {episode && item.episode !== null && (
            <span className="flex-none font-mono text-xs text-amber-600 dark:text-amber-400">
              E{item.episode}
            </span>
          )}
          <span className="truncate">{name}</span>
        </p>
        {episode?.overview && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {episode.overview}
          </p>
        )}
        <div className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          {episode?.runtime ? (
            <span className="flex-none">{formatRuntime(episode.runtime)}</span>
          ) : null}
          {file.size > 0 && <span className="flex-none">{formatSize(file.size)}</span>}
          {episode && !simple && (
            <span className="truncate font-mono">{fileDisplayName(file.name, false)}</span>
          )}
        </div>
      </div>

      {!selection && (
        <div className="flex flex-none items-center gap-2">
          <Checkbox checked={watched} onClick={() => onChange(toggleFile(item.entry, file.name))} />
          <DebridActions links={[file.link]} groupKey={file.link} debrid={debrid} vlc={false} />
        </div>
      )}
    </li>
  );
}
