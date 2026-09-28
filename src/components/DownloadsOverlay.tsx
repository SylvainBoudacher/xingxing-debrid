import { DownloadCard } from "@/components/DownloadCard";
import {
  cancelAllActiveDownloads,
  clearFinishedDownloads,
  getBulkDownloadSnapshot,
  getDownloadsSnapshot,
  subscribeBulkDownload,
  subscribeDownloads,
} from "@/lib/downloads";
import { Download } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";

// En-tête récapitulatif d'un téléchargement groupé (lot de N en parallèle),
// affiché en tête de la liste des téléchargements.
function BulkSummaryRow() {
  const progress = useSyncExternalStore(subscribeBulkDownload, getBulkDownloadSnapshot);
  if (!progress) return null;

  const pending = progress.total - progress.done - progress.active;
  const pct = progress.total ? (progress.done / progress.total) * 100 : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: "spring", stiffness: 400, damping: 34 }}
      className="bg-background border-border rounded-2xl border p-3 shadow-lg"
    >
      <div className="flex items-center gap-2.5">
        <span className="bg-muted text-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <Download className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-foreground truncate text-sm font-semibold">Téléchargement groupé</p>
          <p className="text-muted-foreground truncate text-[11px]">
            {progress.active} en cours{pending > 0 && ` · ${pending} en attente`}
          </p>
        </div>
        <span className="text-muted-foreground shrink-0 text-xs font-semibold tabular-nums">
          {progress.done}/{progress.total}
        </span>
      </div>
      <div className="bg-muted mt-2.5 h-1 overflow-hidden rounded-full">
        <motion.div
          className="bg-primary h-full rounded-full"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ ease: "easeOut", duration: 0.3 }}
        />
      </div>
      <button
        onClick={cancelAllActiveDownloads}
        className="mt-2 w-full cursor-pointer text-center text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:text-red-500"
      >
        Annuler tous les téléchargements
      </button>
    </motion.div>
  );
}

export function DownloadsOverlay() {
  const downloads = useSyncExternalStore(subscribeDownloads, getDownloadsSnapshot);
  const bulk = useSyncExternalStore(subscribeBulkDownload, getBulkDownloadSnapshot);
  // Un lot d'un seul fichier n'a pas besoin de récapitulatif : sa carte suffit.
  const showBulk = !!bulk && bulk.total > 1;

  if (downloads.length === 0 && !showBulk) return null;

  const hasFinished = downloads.some((d) => d.status !== "active");

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-[380px] flex-col gap-2">
      {hasFinished && (
        <button
          onClick={clearFinishedDownloads}
          className="cursor-pointer self-end text-[11px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          Tout effacer
        </button>
      )}
      <AnimatePresence initial={false}>
        {showBulk && <BulkSummaryRow key="bulk-summary" />}
        {downloads.map((item) => (
          <DownloadCard key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}
