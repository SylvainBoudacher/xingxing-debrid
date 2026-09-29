import { DownloadCard } from "@/components/DownloadCard";
import { DownloadsBulkCard } from "@/components/DownloadsBulkCard";
import { clearFinishedDownloads, type DownloadItem } from "@/lib/downloads";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

// Panneau ouvert depuis la pilule : hauteur bornée, en-tête et lot fixés en
// haut, seules les cartes défilent.
export function DownloadsPanel({
  downloads,
  showBulk,
  onClose,
}: {
  downloads: DownloadItem[];
  showBulk: boolean;
  onClose: () => void;
}) {
  const hasFinished = downloads.some((d) => d.status !== "active");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{ transformOrigin: "bottom right" }}
      className="bg-background border-border flex max-h-[70vh] w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border shadow-2xl"
    >
      <div className="border-border flex shrink-0 items-center gap-3 border-b py-2.5 pl-4 pr-2.5">
        <p className="text-foreground flex-1 text-sm font-semibold">Téléchargements</p>
        {hasFinished && (
          <button
            type="button"
            onClick={clearFinishedDownloads}
            className="text-muted-foreground hover:text-foreground cursor-pointer text-[11px] font-medium transition-colors"
          >
            Tout effacer
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors"
          aria-label="Fermer"
          title="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showBulk && (
          <div key="bulk" className="shrink-0 px-2 pt-2">
            <DownloadsBulkCard />
          </div>
        )}
      </AnimatePresence>

      <motion.div layoutScroll className="flex min-h-0 flex-col gap-2 overflow-y-auto p-2">
        <AnimatePresence initial={false}>
          {downloads.map((item) => (
            <DownloadCard key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
