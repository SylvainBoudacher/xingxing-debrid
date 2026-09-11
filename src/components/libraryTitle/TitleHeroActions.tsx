import { DebridActions, type DebridControls } from "@/components/libraryParts";
import { episodeLabel } from "@/lib/library";
import type { TitleItem } from "@/lib/libraryTitle";
import { Check, Loader2, Play, Search } from "lucide-react";
import { motion } from "motion/react";

interface TitleHeroActionsProps {
  // Lu par le bouton principal : prochain épisode à voir, ou fichier du film.
  playItem: TitleItem | null;
  playLabel: "Lire" | "Lancer" | "Reprendre";
  playKey: string;
  links: string[];
  downloadKey: string;
  whole: boolean;
  debrid: DebridControls;
  onPlay: (item: TitleItem, key: string) => void;
  onToggleWatched: () => void;
  onFindMore?: () => void;
}

const SECONDARY =
  "flex h-9 flex-none items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium transition-colors";

export function TitleHeroActions({
  playItem,
  playLabel,
  playKey,
  links,
  downloadKey,
  whole,
  debrid,
  onPlay,
  onToggleWatched,
  onFindMore,
}: TitleHeroActionsProps) {
  const playing = debrid.bulkVlc === playKey;
  const label = playItem && playLabel !== "Lire" ? episodeLabel(playItem.file.name) : null;

  return (
    <>
      {playItem && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onPlay(playItem, playKey)}
          disabled={playing}
          className="flex h-9 flex-none items-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {playing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
          {playLabel}
          {label && <span className="font-mono text-xs opacity-70">{label}</span>}
        </motion.button>
      )}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onToggleWatched}
        title={whole ? "Marquer comme non vu" : "Marquer comme vu"}
        className={`${SECONDARY} ${
          whole
            ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300"
            : "bg-black/5 text-zinc-700 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
        }`}
      >
        <Check className="h-4 w-4" strokeWidth={whole ? 3 : 2} />
        {whole ? "Vu" : "Marquer comme vu"}
      </motion.button>
      <DebridActions
        links={links}
        groupKey={downloadKey}
        debrid={debrid}
        vlc={false}
        label="Télécharger"
      />
      {onFindMore && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onFindMore}
          className={`${SECONDARY} bg-black/5 text-zinc-700 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15`}
        >
          <Search className="h-4 w-4" />
          Chercher des épisodes
        </motion.button>
      )}
    </>
  );
}
