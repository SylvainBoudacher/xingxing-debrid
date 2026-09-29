import {
  cancelAllActiveDownloads,
  getBulkDownloadSnapshot,
  getDownloadsSnapshot,
  subscribeBulkDownload,
  subscribeDownloads,
} from "@/lib/downloads";
import { summarizeDownloads } from "@/lib/downloadsSummary";
import { Download } from "lucide-react";
import { motion } from "motion/react";
import { useSyncExternalStore } from "react";

// En-tête récapitulatif d'un téléchargement groupé (lot de N en parallèle),
// affiché en tête du panneau des téléchargements.
export function DownloadsBulkCard() {
  const progress = useSyncExternalStore(subscribeBulkDownload, getBulkDownloadSnapshot);
  const downloads = useSyncExternalStore(subscribeDownloads, getDownloadsSnapshot);
  if (!progress) return null;

  const pending = progress.total - progress.done - progress.active;
  // Avance avec les octets des fichiers en cours, pas seulement à chaque fin.
  const pct = summarizeDownloads(downloads, progress).progress * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: "spring", stiffness: 400, damping: 34 }}
      className="bg-background border-border rounded-2xl border p-3"
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
