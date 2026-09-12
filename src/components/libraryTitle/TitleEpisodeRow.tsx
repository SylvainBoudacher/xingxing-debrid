import { FadeImage } from "@/components/FadeImage";
import { DebridActions, SelectionBox, type DebridControls } from "@/components/libraryParts";
import { formatSize } from "@/lib/debrid";
import { fileDisplayName, formatRuntime, isItemWatched, type TitleItem } from "@/lib/libraryTitle";
import type { TmdbEpisode } from "@/lib/services/tmdb";
import type { EpisodeSelection } from "@/lib/useEpisodeSelection";
import { Check, Loader2, Play } from "lucide-react";
import { motion } from "motion/react";

// Cascade d'apparition des lignes, plafonnée : au-delà, elles arrivent ensemble.
const CASCADE_STEP = 0.035;
const CASCADE_MAX = 8;

interface TitleEpisodeRowProps {
  // Rang dans la liste affichée : cadence l'apparition en cascade.
  index: number;
  item: TitleItem;
  // Épisode TMDB correspondant, absent sans correspondance (nom de fichier).
  episode?: TmdbEpisode;
  isNext: boolean;
  simple: boolean;
  debrid: DebridControls;
  onPlay: (item: TitleItem, key: string) => void;
  // Bascule vu/non vu de l'épisode.
  onWatch: (item: TitleItem) => void;
  selection?: EpisodeSelection;
}

export function TitleEpisodeRow({
  index,
  item,
  episode,
  isNext,
  simple,
  debrid,
  onPlay,
  onWatch,
  selection,
}: TitleEpisodeRowProps) {
  const { file } = item;
  const watched = isItemWatched(item);
  const playing = debrid.bulkVlc === file.link;
  const selected = selection?.has(file.link) ?? false;
  const still = episode?.still_path;
  const name = episode?.name || fileDisplayName(file.name, simple);

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, CASCADE_MAX) * CASCADE_STEP }}
      onClick={selection ? () => selection.toggle(file.link) : undefined}
      className={`group/row flex items-center gap-4 px-4 py-3 transition-colors ${
        selection ? "cursor-pointer" : ""
      } ${selected ? "bg-indigo-500/10" : "hover:bg-black/[0.025] dark:hover:bg-white/[0.04]"}`}
    >
      {selection && <SelectionBox checked={selected} />}

      <div className="relative aspect-video w-40 flex-none">
        <button
          onClick={() => onPlay(item, file.link)}
          disabled={playing}
          title="Lire avec VLC"
          className={`group h-full w-full overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800 ${
            isNext ? "ring-2 ring-emerald-500" : "ring-1 ring-black/10 dark:ring-white/10"
          } ${selection ? "pointer-events-none" : ""}`}
        >
          {still ? (
            <FadeImage
              src={`https://image.tmdb.org/t/p/w300${still}`}
              alt=""
              loading="lazy"
              decoding="async"
              className={`h-full w-full object-cover transition ${
                watched ? "brightness-[0.4] grayscale" : ""
              }`}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-mono text-sm font-semibold text-zinc-400 dark:text-zinc-500">
              {item.episode !== null ? `E${item.episode}` : ""}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center rounded-lg transition-colors group-hover:bg-black/40">
            {playing ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <Play className="h-7 w-7 fill-white text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100" />
            )}
          </span>
        </button>

        {/* Pastille d'état et bascule vu/non vu : masquée tant que l'épisode
        n'est pas vu et que la ligne n'est pas survolée. */}
        {!selection && (
          <button
            onClick={() => onWatch(item)}
            title={watched ? "Marquer comme non vu" : "Marquer comme vu"}
            className={`group/mark absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full shadow transition hover:scale-110 active:scale-95 ${
              watched
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "border-2 border-white/80 bg-black/40 text-white opacity-0 backdrop-blur-sm hover:bg-black/60 focus-visible:opacity-100 group-hover/row:opacity-100"
            }`}
          >
            <Check
              className={`h-3.5 w-3.5 transition-opacity ${watched ? "" : "opacity-0 group-hover/mark:opacity-100"}`}
              strokeWidth={3}
            />
          </button>
        )}
      </div>

      <div className={`min-w-0 flex-1 ${watched ? "opacity-55" : ""}`}>
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
        <DebridActions links={[file.link]} groupKey={file.link} debrid={debrid} vlc={false} />
      )}
    </motion.li>
  );
}
