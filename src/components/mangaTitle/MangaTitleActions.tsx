import type { MangaVolume } from "@/lib/mangaLibrary";
import { volumeLabel } from "@/lib/mangaShelf";
import { BookOpen, Download, Loader2, Search } from "lucide-react";
import { motion } from "motion/react";

interface MangaTitleActionsProps {
  next: MangaVolume | null;
  // Au moins un tome entamé ou lu : on reprend plutôt qu'on ne commence.
  started: boolean;
  missingDownloads: number;
  bulkDownloading: boolean;
  onContinue: () => void;
  onDownloadAll: () => void;
  onFindMore: () => void;
}

const SECONDARY =
  "flex h-9 flex-none items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium transition-colors";

export function MangaTitleActions({
  next,
  started,
  missingDownloads,
  bulkDownloading,
  onContinue,
  onDownloadAll,
  onFindMore,
}: MangaTitleActionsProps) {
  return (
    <>
      {next && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onContinue}
          className="flex h-9 flex-none items-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <BookOpen className="h-4 w-4" />
          {started ? "Continuer" : "Commencer"}
          <span className="text-xs font-medium opacity-70">{volumeLabel(next)}</span>
        </motion.button>
      )}
      {missingDownloads > 0 && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          disabled={bulkDownloading}
          onClick={onDownloadAll}
          className={`${SECONDARY} bg-indigo-600 text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {bulkDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Tout télécharger ({missingDownloads})
        </motion.button>
      )}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onFindMore}
        className={`${SECONDARY} bg-black/5 text-zinc-700 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15`}
      >
        <Search className="h-4 w-4" />
        Chercher d'autres tomes
      </motion.button>
    </>
  );
}
