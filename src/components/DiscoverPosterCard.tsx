import { memo } from "react";
import { motion } from "motion/react";
import { Check, Heart, Star } from "lucide-react";
import type { TmdbItem } from "@/lib/tmdbItem";

interface DiscoverPosterCardProps {
  item: TmdbItem;
  index: number;
  liked: boolean;
  inLibrary: boolean;
  subtitle: string;
  onOpen: (item: TmdbItem) => void;
  onToggleLike: (item: TmdbItem) => void;
}

// Memoisee : la grille Decouverte grossit par pages (scroll infini) et chaque
// ajout re-rendait toutes les cartes deja affichees.
export const DiscoverPosterCard = memo(function DiscoverPosterCard({
  item,
  index,
  liked,
  inLibrary,
  subtitle,
  onOpen,
  onToggleLike,
}: DiscoverPosterCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.25,
          delay: Math.min((index % 20) * 0.02, 0.3),
        },
      }}
      whileHover={{
        scale: 1.03,
        y: -5,
        transition: { type: "spring", stiffness: 300, damping: 22 },
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onOpen(item)}
      className="group cursor-pointer text-left"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-900 ring-1 ring-black/8 dark:ring-white/8 transition-all duration-500 ease-out group-hover:ring-black/20 dark:group-hover:ring-white/25 group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)] dark:group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.7)]">
        {item.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-[filter] duration-500 ease-out group-hover:brightness-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400 dark:text-zinc-600 px-2 text-center">
            {item.title}
          </div>
        )}
        {item.voteAverage > 0 && (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 backdrop-blur-sm">
            <Star className="h-2.5 w-2.5 fill-amber-400" />
            {item.voteAverage.toFixed(1)}
          </span>
        )}
        <span
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike(item);
          }}
          className={`absolute left-1.5 top-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-opacity hover:bg-black/80 ${
            liked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <Heart
            className={`h-3.5 w-3.5 transition-colors ${
              liked ? "fill-rose-500 text-rose-500" : "text-white"
            }`}
          />
        </span>
        {inLibrary && (
          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-md bg-emerald-600/85 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
            Dans la bibliotheque
          </span>
        )}
      </div>
      <p className="mt-2 text-xs font-medium text-zinc-900 dark:text-white leading-snug line-clamp-1">
        {item.title}
      </p>
      <p className="text-[11px] text-zinc-500 line-clamp-1">{subtitle}</p>
    </motion.button>
  );
});
