import { ExpandableText } from "@/components/ExpandableText";
import { TmdbGenres } from "@/components/TmdbGenres";
import { posterUrl } from "@/lib/posterPreload";
import { RARITY_STYLE, rarityOf } from "@/lib/rouletteRarity";
import type { TmdbItem } from "@/lib/tmdbItem";
import { Heart, RotateCcw, Star } from "lucide-react";
import { motion } from "motion/react";

interface RouletteResultProps {
  item: TmdbItem;
  liked: boolean;
  tmdbKey: string;
  onOpen: (item: TmdbItem) => void;
  onToggleLike: (item: TmdbItem) => void;
  onReroll: () => void;
}

export function RouletteResult({
  item,
  liked,
  tmdbKey,
  onOpen,
  onToggleLike,
  onReroll,
}: RouletteResultProps) {
  const rarity = RARITY_STYLE[rarityOf(item.voteAverage)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ borderColor: `${rarity.color}55` }}
      className="mt-6 flex gap-5 rounded-2xl border bg-white/70 p-5 ring-1 ring-black/5 backdrop-blur-xl dark:bg-zinc-900/60 dark:ring-white/5"
    >
      <div className="w-[120px] shrink-0 overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800">
        {item.posterPath && (
          <img src={posterUrl(item.posterPath)} alt={item.title} className="w-full" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <span
          style={{ color: rarity.color, backgroundColor: `${rarity.color}1a` }}
          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
        >
          {rarity.label}
        </span>

        <h3 className="mt-2 text-lg font-semibold leading-tight text-zinc-900 dark:text-white">
          {item.title}
        </h3>

        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
          <span>{item.year}</span>
          {item.voteAverage > 0 && (
            <span className="flex items-center gap-1 text-amber-500">
              <Star className="h-3 w-3 fill-amber-500" />
              {item.voteAverage.toFixed(1)}
            </span>
          )}
        </div>

        <TmdbGenres
          mediaType="movie"
          id={item.id}
          genreIds={item.genreIds}
          tmdbKey={tmdbKey}
          className="mt-2"
        />

        {item.overview && (
          <ExpandableText
            text={item.overview}
            lines={3}
            className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400"
          />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpen(item)}
            className="cursor-pointer rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Voir les releases
          </button>
          <button
            onClick={() => onToggleLike(item)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-zinc-600 ring-1 ring-black/10 transition-colors hover:text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-400 dark:ring-white/10 dark:hover:text-white"
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
            {liked ? "Dans ma liste" : "Ajouter à ma liste"}
          </button>
          <button
            onClick={onReroll}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-zinc-600 ring-1 ring-black/10 transition-colors hover:text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-400 dark:ring-white/10 dark:hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Relancer
          </button>
        </div>
      </div>
    </motion.div>
  );
}
