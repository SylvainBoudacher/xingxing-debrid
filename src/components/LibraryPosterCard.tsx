import { memo, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, Clapperboard, Trash2 } from "lucide-react";
import { parseRelease } from "@/lib/parseRelease";
import {
  isSeries,
  isWholeWatched,
  progressRatio,
  watchedCount,
  totalCount,
  type LibraryEntry,
} from "@/lib/library";

interface LibraryPosterCardProps {
  entry: LibraryEntry;
  simple: boolean;
  expanded: boolean;
  onToggle: () => void;
  // Présent uniquement si l'entrée peut être complétée via TMDB.
  onEnrichTmdb?: () => void;
  // Suppression directe au survol (retire l'entrée de la bibliothèque).
  onRemove?: () => void;
  // Mode sélection multiple : le clic coche la carte au lieu de l'ouvrir.
  selectMode?: boolean;
  selected?: boolean;
}

export const LibraryPosterCard = memo(function LibraryPosterCard({
  entry,
  simple,
  expanded,
  onToggle,
  onEnrichTmdb,
  onRemove,
  selectMode = false,
  selected = false,
}: LibraryPosterCardProps) {
  const tmdb = entry.tmdb;
  const series = isSeries(entry);
  const whole = isWholeWatched(entry);
  const ratio = progressRatio(entry);
  const title = tmdb?.title ?? (simple ? parseRelease(entry.title).title : entry.title);
  const year = tmdb?.year ?? "";
  const [confirmDelete, setConfirmDelete] = useState(false);
  const active = expanded || (selectMode && selected);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  return (
    <motion.button
      layout
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      onMouseLeave={() => setConfirmDelete(false)}
      className={`group relative block aspect-[2/3] cursor-pointer overflow-hidden rounded-xl text-left ring-2 transition-[box-shadow,ring-color] duration-200 ${
        active
          ? "ring-indigo-500"
          : "ring-black/8 dark:ring-white/10 hover:ring-indigo-400/50 dark:hover:ring-indigo-400/40 hover:shadow-[0_18px_40px_-14px_rgba(0,0,0,0.45)]"
      }`}
    >
      {tmdb?.posterPath ? (
        <img
          src={`https://image.tmdb.org/t/p/w342${tmdb.posterPath}`}
          alt={title}
          width={342}
          height={513}
          loading="lazy"
          decoding="async"
          className={`block h-full w-full object-cover transition-[filter] duration-300 ${whole ? "brightness-50" : "group-hover:brightness-105"}`}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-indigo-500/25 via-zinc-200 to-zinc-300 px-3 text-center dark:from-indigo-500/20 dark:via-zinc-800 dark:to-zinc-900">
          <span className="line-clamp-4 text-xs font-medium text-zinc-700 dark:text-zinc-200">
            {title}
          </span>
          {onEnrichTmdb && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onEnrichTmdb();
              }}
              className="flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-1 text-[11px] font-medium text-indigo-700 transition-colors hover:bg-indigo-500/25 dark:bg-indigo-500/20 dark:text-indigo-200"
            >
              <Clapperboard className="h-3 w-3" />
              Compléter via TMDB
            </span>
          )}
        </div>
      )}

      {/* Case de sélection (mode multi-sélection) */}
      {selectMode && (
        <span
          className={`absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 shadow backdrop-blur-sm ${
            selected ? "border-indigo-500 bg-indigo-500 text-white" : "border-white/80 bg-black/40"
          }`}
        >
          {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </span>
      )}

      {/* Pastille « vu » */}
      {whole && !selectMode && (
        <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
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

      {/* Dégradé + flou derrière le texte pour la lisibilité */}
      <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2 pt-8">
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent" />
        <p className="relative truncate text-xs font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
          {title}
        </p>
        <div className="relative mt-0.5 flex items-center gap-2 text-[10px] text-zinc-200 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
          {year && <span>{year}</span>}
          {series && (
            <span>
              {watchedCount(entry)}/{totalCount(entry)}
            </span>
          )}
        </div>
        {series && (
          <div className="relative mt-1 h-1 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </div>
        )}
      </div>
    </motion.button>
  );
});
