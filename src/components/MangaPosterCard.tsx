import { mangaCoverUrl, MANGA_STATUS_LABELS, type MangaItem } from "@/lib/mangaItem";
import { BookMarked, Check, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { memo, useEffect, useState } from "react";

interface MangaPosterCardProps {
  item: MangaItem;
  index: number;
  /** Tomes possedes / tomes lus, quand l'oeuvre est en bibliotheque. */
  progress: { total: number; read: number } | null;
  /** Position dans un classement (Top SensCritique), affichee sur la jaquette. */
  rank?: number;
  onOpen: (item: MangaItem) => void;
  /** Mode sélection : la carte affiche sa case au lieu de son survol habituel. */
  selectMode?: boolean;
  selected?: boolean;
  // Suppression directe au survol (retire l'oeuvre de la bibliothèque).
  onRemove?: () => void;
}

// Memoisee : la grille grandit par pages et chaque ajout re-rendrait sinon
// toutes les couvertures deja affichees.
export const MangaPosterCard = memo(function MangaPosterCard({
  item,
  index,
  progress,
  rank,
  onOpen,
  selectMode = false,
  selected = false,
  onRemove,
}: MangaPosterCardProps) {
  const cover = mangaCoverUrl(item, 256);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);
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
      onMouseLeave={() => setConfirmDelete(false)}
      className="group cursor-pointer text-left"
    >
      <div
        className={`relative aspect-[2/3] overflow-hidden rounded-xl bg-zinc-200 ring-1 transition-all duration-500 ease-out group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)] group-hover:ring-black/20 dark:bg-zinc-900 dark:group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.7)] dark:group-hover:ring-white/25 ${
          selected ? "ring-2 ring-indigo-500" : "ring-black/8 dark:ring-white/8"
        }`}
      >
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

        {selectMode && (
          <span
            className={`absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 shadow backdrop-blur-sm ${
              selected
                ? "border-indigo-500 bg-indigo-500 text-white"
                : "border-white/80 bg-black/40"
            }`}
          >
            {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </span>
        )}

        {rank !== undefined && !selectMode && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-200 backdrop-blur-sm">
            #{rank}
          </span>
        )}

        {/* Suppression directe au survol */}
        {onRemove && !selectMode && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              if (confirmDelete) onRemove();
              else setConfirmDelete(true);
            }}
            title={confirmDelete ? "Confirmer la suppression" : "Retirer de la bibliothèque"}
            className={`absolute right-1.5 top-1.5 z-10 flex h-6 items-center justify-center gap-1 rounded-full text-white opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100 ${
              confirmDelete
                ? "bg-red-500 px-2 text-[10px] font-semibold"
                : "w-6 bg-red-500/85 hover:bg-red-500"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {confirmDelete && "Sûr ?"}
          </span>
        )}

        {item.lastVolume !== null && (
          <span
            className={`absolute rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-200 backdrop-blur-sm ${
              onRemove && !selectMode ? "bottom-1.5 left-1.5" : "right-1.5 top-1.5"
            }`}
          >
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
