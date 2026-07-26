import { MangaVolumeList } from "@/components/MangaVolumeList";
import { Button } from "@/components/ui/button";
import { MANGA_STATUS_LABELS } from "@/lib/mangaItem";
import type { MangaEntry, MangaVolume, ReadingDirection } from "@/lib/mangaLibrary";
import { coverUrl } from "@/lib/services/mangadex";
import { ArrowLeftRight, BookOpen, Loader2, RefreshCw, Search, Trash2, X } from "lucide-react";
import { motion } from "motion/react";

interface MangaEntryDetailModalProps {
  entry: MangaEntry;
  downloading: string | null;
  refreshingPending: boolean;
  onRead: (volume: MangaVolume) => void;
  onDownload: (volume: MangaVolume) => void;
  onToggleRead: (volume: MangaVolume) => void;
  onDirection: (direction: ReadingDirection) => void;
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
  onDirection,
  onRefreshPending,
  onFindMore,
  onRemove,
  onContinue,
  onClose,
}: MangaEntryDetailModalProps) {
  const cover = entry.meta.coverFileName
    ? coverUrl(entry.mangaId, entry.meta.coverFileName, 512)
    : null;
  const direction = entry.readingDirection ?? "rtl";
  const readable = entry.volumes.some((v) => v.localPath);

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
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950"
      >
        <div className="flex items-start gap-4 border-b border-black/5 p-5 dark:border-white/5">
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
            <p className="mt-0.5 text-xs text-zinc-500">
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
                <Button size="sm" onClick={onContinue}>
                  <BookOpen />
                  Continuer la lecture
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={onFindMore}>
                <Search />
                Chercher d'autres tomes
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDirection(direction === "rtl" ? "ltr" : "rtl")}
                title="Sens de lecture"
              >
                <ArrowLeftRight />
                {direction === "rtl" ? "Droite à gauche" : "Gauche à droite"}
              </Button>
              <Button size="sm" variant="outline" onClick={onRemove}>
                <Trash2 />
                Retirer
              </Button>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {entry.pending && entry.pending.length > 0 && (
          <div className="flex items-center gap-3 border-b border-amber-500/20 bg-amber-500/10 px-5 py-2.5">
            <p className="flex-1 text-xs text-amber-700 dark:text-amber-400">
              {entry.pending.length} torrent{entry.pending.length > 1 ? "s" : ""} en cours de
              débridage chez AllDebrid.
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={refreshingPending}
              onClick={onRefreshPending}
            >
              {refreshingPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Vérifier
            </Button>
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
