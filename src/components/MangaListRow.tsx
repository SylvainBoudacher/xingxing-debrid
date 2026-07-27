import { formatSize } from "@/lib/debrid";
import { mangaCoverUrl, MANGA_STATUS_LABELS } from "@/lib/mangaItem";
import { itemFromEntry, mangaProgress, type MangaEntry } from "@/lib/mangaLibrary";
import { entrySize, isFullyRead } from "@/lib/mangaSections";
import { BookMarked, Check, Trash2 } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { motion } from "motion/react";

interface MangaListRowProps {
  entry: MangaEntry;
  onOpen: () => void;
  /** Mode sélection : la ligne se coche au lieu de s'ouvrir. */
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  // Suppression directe (retire l'oeuvre de la bibliothèque).
  onRemove?: () => void;
}

// Ligne de la vue liste, calquée sur celle des films et séries : miniature,
// titre, méta et progression de lecture.
export const MangaListRow = memo(function MangaListRow({
  entry,
  onOpen,
  selectMode = false,
  selected = false,
  onToggleSelect,
  onRemove,
}: MangaListRowProps) {
  const cover = mangaCoverUrl(itemFromEntry(entry), 256);
  const progress = mangaProgress(entry);
  const size = entrySize(entry);
  const read = isFullyRead(entry);
  const ratio = progress.total > 0 ? progress.read / progress.total : 0;
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  return (
    <div className="overflow-hidden rounded-xl bg-white/80 ring-1 ring-black/5 backdrop-blur-sm dark:bg-zinc-900/70 dark:ring-white/10">
      <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.04]">
        {selectMode && (
          <span
            className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 ${
              selected
                ? "border-indigo-500 bg-indigo-500 text-white"
                : "border-black/20 dark:border-white/25"
            }`}
          >
            {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </span>
        )}

        <button
          onClick={() => (selectMode ? onToggleSelect?.() : onOpen())}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="h-14 w-10 flex-none overflow-hidden rounded-md bg-zinc-200 dark:bg-zinc-800">
            {cover ? (
              <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BookMarked className="h-4 w-4 text-zinc-400" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-medium ${read ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-900 dark:text-white"}`}
            >
              {entry.meta.title}
            </p>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="rounded bg-black/5 px-1.5 py-0.5 font-medium dark:bg-white/10">
                {MANGA_STATUS_LABELS[entry.meta.status]}
              </span>
              {entry.meta.year && <span>{entry.meta.year}</span>}
              {size > 0 && <span>{formatSize(size)}</span>}
              <span>
                {progress.read}/{progress.total} tomes lus
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </div>
          </div>
        </button>

        {onRemove && !selectMode && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (confirmDelete) onRemove();
              else setConfirmDelete(true);
            }}
            title={confirmDelete ? "Confirmer la suppression" : "Supprimer"}
            className={`flex h-7 flex-none items-center justify-center rounded-lg transition-colors ${
              confirmDelete
                ? "gap-1 bg-red-500 px-2 text-xs font-medium text-white hover:bg-red-600"
                : "w-7 text-zinc-400 hover:bg-red-500/10 hover:text-red-500"
            }`}
          >
            <Trash2 className="h-4 w-4" />
            {confirmDelete && "Sûr ?"}
          </motion.button>
        )}
      </div>
    </div>
  );
});
