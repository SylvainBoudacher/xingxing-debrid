import { SelectionBox } from "@/components/libraryParts";
import { BookCheck, BookX, Download, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface MangaShelfSelectionBarProps {
  count: number;
  // Tomes de la sélection qui restent à télécharger.
  downloadable: number;
  allSelected: boolean;
  busy: boolean;
  onToggleAll: () => void;
  onCancel: () => void;
  onMarkRead: (read: boolean) => void;
  onDownload: () => void;
}

const SECONDARY =
  "flex h-8 flex-none items-center gap-1.5 rounded-lg bg-black/5 px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15";

// Barre flottante du mode sélection, posée en bas de la fiche.
export function MangaShelfSelectionBar({
  count,
  downloadable,
  allSelected,
  busy,
  onToggleAll,
  onCancel,
  onMarkRead,
  onDownload,
}: MangaShelfSelectionBarProps) {
  const empty = count === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center px-4"
    >
      <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-2xl bg-white/90 p-2 pl-3 shadow-xl ring-1 ring-black/10 backdrop-blur-xl dark:bg-zinc-900/90 dark:ring-white/10">
        <button
          onClick={onToggleAll}
          className="flex items-center gap-2 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
        >
          <SelectionBox checked={allSelected} />
          Tout sélectionner
        </button>
        <span className="px-2 text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
          {count} sélectionné{count > 1 ? "s" : ""}
        </span>
        <button
          onClick={onCancel}
          className="flex h-8 flex-none items-center rounded-lg px-3 text-xs font-medium text-zinc-500 transition-colors hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
        >
          Annuler
        </button>
        <button disabled={empty} onClick={() => onMarkRead(true)} className={SECONDARY}>
          <BookCheck className="h-3.5 w-3.5" />
          Marquer lus
        </button>
        <button disabled={empty} onClick={() => onMarkRead(false)} className={SECONDARY}>
          <BookX className="h-3.5 w-3.5" />
          Marquer non lus
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={downloadable === 0 || busy}
          onClick={onDownload}
          className="flex h-8 flex-none items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Télécharger ({downloadable})
        </motion.button>
      </div>
    </motion.div>
  );
}
