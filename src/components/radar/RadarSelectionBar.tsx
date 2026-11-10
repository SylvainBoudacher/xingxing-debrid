import { Trash2, X } from "lucide-react";
import { motion } from "motion/react";

interface RadarSelectionBarProps {
  count: number;
  onDelete: () => void;
  onCancel: () => void;
}

export function RadarSelectionBar({ count, onDelete, onCancel }: RadarSelectionBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-4"
    >
      <div className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 p-1.5 pl-4 shadow-lg backdrop-blur dark:border-white/10 dark:bg-zinc-900/90">
        <span className="mr-1 whitespace-nowrap text-xs font-medium text-zinc-600 dark:text-zinc-300">
          {count} sélectionné{count > 1 ? "s" : ""}
        </span>
        <button
          onClick={onDelete}
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Retirer
        </button>
        <button
          onClick={onCancel}
          aria-label="Annuler la sélection"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
