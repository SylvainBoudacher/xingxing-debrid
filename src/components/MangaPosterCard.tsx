import { mangaCoverUrl, MANGA_STATUS_LABELS, type MangaItem } from "@/lib/mangaItem";
import { BookMarked, Check } from "lucide-react";
import { motion } from "motion/react";
import { memo } from "react";

interface MangaPosterCardProps {
  item: MangaItem;
  index: number;
  /** Tomes possedes / tomes lus, quand l'oeuvre est en bibliotheque. */
  progress: { total: number; read: number } | null;
  onOpen: (item: MangaItem) => void;
}

// Memoisee : la grille grandit par pages et chaque ajout re-rendrait sinon
// toutes les couvertures deja affichees.
export const MangaPosterCard = memo(function MangaPosterCard({
  item,
  index,
  progress,
  onOpen,
}: MangaPosterCardProps) {
  const cover = mangaCoverUrl(item, 256);
  return (
    <motion.button
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 200,
          damping: 26,
          delay: Math.min((index % 20) * 0.03, 0.35),
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
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-zinc-200 ring-1 ring-black/8 transition-all duration-500 ease-out group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)] group-hover:ring-black/20 dark:bg-zinc-900 dark:ring-white/8 dark:group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.7)] dark:group-hover:ring-white/25">
        {cover ? (
          <img
            src={cover}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-[filter] duration-500 ease-out group-hover:brightness-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-zinc-400 dark:text-zinc-600">
            {item.title}
          </div>
        )}

        {item.lastVolume !== null && (
          <span className="absolute right-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-200 backdrop-blur-sm">
            {item.lastVolume} tomes
          </span>
        )}

        {progress && (
          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-md bg-emerald-600/85 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {progress.read === progress.total && progress.total > 0 ? (
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            ) : (
              <BookMarked className="h-2.5 w-2.5" />
            )}
            {progress.read} / {progress.total}
          </span>
        )}
      </div>

      <p className="mt-2 line-clamp-1 text-xs font-medium leading-snug text-zinc-900 dark:text-white">
        {item.title}
      </p>
      <p className="line-clamp-1 text-[11px] text-zinc-500">
        {[item.year, MANGA_STATUS_LABELS[item.status]].filter(Boolean).join(" · ")}
      </p>
    </motion.button>
  );
});
