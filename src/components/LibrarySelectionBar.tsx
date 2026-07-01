import { motion } from "motion/react";
import { Eye, EyeOff, Trash2, X, type LucideIcon } from "lucide-react";

interface LibrarySelectionBarProps {
  count: number;
  onMarkWatched: () => void;
  onMarkUnwatched: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function LibrarySelectionBar({
  count,
  onMarkWatched,
  onMarkUnwatched,
  onDelete,
  onCancel,
}: LibrarySelectionBarProps) {
  const disabled = count === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-4"
    >
      <div className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 p-1.5 pl-4 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/90">
        <span className="mr-1 whitespace-nowrap text-xs font-medium text-zinc-600 dark:text-zinc-300">
          {count} sélectionné{count > 1 ? "s" : ""}
        </span>
        <BarButton icon={Eye} label="Vu" onClick={onMarkWatched} disabled={disabled} />
        <BarButton icon={EyeOff} label="Non vu" onClick={onMarkUnwatched} disabled={disabled} />
        <BarButton icon={Trash2} label="Supprimer" onClick={onDelete} disabled={disabled} danger />
        <button
          onClick={onCancel}
          title="Quitter la sélection"
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

function BarButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors disabled:opacity-40 ${
        danger
          ? "text-red-600 hover:bg-red-500/10 dark:text-red-400"
          : "text-zinc-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
