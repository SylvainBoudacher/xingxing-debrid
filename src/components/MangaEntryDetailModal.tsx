import { MangaVolumeList } from "@/components/MangaVolumeList";
import { MANGA_STATUS_LABELS } from "@/lib/mangaItem";
import type { MangaEntry, MangaVolume } from "@/lib/mangaLibrary";
import { coverUrl } from "@/lib/services/mangadex";
import { BookOpen, Loader2, RefreshCw, Search, Trash2, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";

interface MangaEntryDetailModalProps {
  entry: MangaEntry;
  downloading: string | null;
  refreshingPending: boolean;
  onRead: (volume: MangaVolume) => void;
  onDownload: (volume: MangaVolume) => void;
  onToggleRead: (volume: MangaVolume) => void;
  onRefreshPending: () => void;
  onFindMore: () => void;
  onRemove: () => void;
  onContinue: () => void;
  onClose: () => void;
}

export function MangaEntryDetailModal({
  entry,
  downloading,
  refreshingPending,
  onRead,
  onDownload,
  onToggleRead,
  onRefreshPending,
  onFindMore,
  onRemove,
  onContinue,
  onClose,
}: MangaEntryDetailModalProps) {
  const cover = entry.meta.coverFileName
    ? coverUrl(entry.mangaId, entry.meta.coverFileName, 512)
    : null;
  const readable = entry.volumes.some((v) => v.localPath);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white/95 shadow-2xl ring-1 ring-black/10 backdrop-blur-xl dark:bg-zinc-900/95 dark:ring-white/10"
      >
        <div className="flex items-start gap-4 border-b border-black/5 p-5 dark:border-white/10">
          {cover && (
            <img
              src={cover}
              alt={entry.meta.title}
              className="h-32 w-22 shrink-0 rounded-lg object-cover ring-1 ring-black/10 dark:ring-white/10"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {entry.meta.title}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {[
                entry.meta.year,
                MANGA_STATUS_LABELS[entry.meta.status],
                `${entry.volumes.length} tome${entry.volumes.length > 1 ? "s" : ""}`,
                entry.meta.lastVolume ? `sur ${entry.meta.lastVolume} parus` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {readable && (
                <button
                  onClick={onContinue}
                  className="flex h-7 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Continuer la lecture
                </button>
              )}
              <button
                onClick={onFindMore}
                className="flex h-7 items-center gap-1.5 rounded-lg bg-indigo-500/10 px-2.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25"
              >
                <Search className="h-3.5 w-3.5" />
                Chercher d'autres tomes
              </button>
              <button
                onClick={onRemove}
                className="flex h-7 items-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 text-xs font-medium text-red-600 ring-1 ring-red-500/20 transition-colors hover:bg-red-500/20 dark:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Retirer
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-zinc-200 transition-colors hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <X className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {entry.pending && entry.pending.length > 0 && (
          <div className="flex items-center gap-3 border-b border-amber-500/20 bg-amber-500/10 px-5 py-2.5">
            <p className="flex-1 text-xs text-amber-700 dark:text-amber-400">
              {entry.pending.length} torrent{entry.pending.length > 1 ? "s" : ""} en cours de
              débridage chez AllDebrid.
            </p>
            <button
              disabled={refreshingPending}
              onClick={onRefreshPending}
              className="flex h-7 flex-none items-center gap-1.5 rounded-lg bg-amber-500/15 px-2.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/25 disabled:opacity-40 dark:text-amber-400"
            >
              {refreshingPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Vérifier
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {entry.volumes.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">
              Aucun tome disponible pour le moment.
            </p>
          ) : (
            <MangaVolumeList
              entry={entry}
              downloading={downloading}
              onRead={onRead}
              onDownload={onDownload}
              onToggleRead={onToggleRead}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
