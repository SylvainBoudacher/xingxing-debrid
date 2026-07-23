import { motion } from "motion/react";
import { Check, FolderPlus, MousePointerClick } from "lucide-react";

interface LibraryCustomBarProps {
  categoryCount: number;
  selectMode: boolean;
  onCreate: () => void;
  onToggleSelect: () => void;
}

// Rangée d'actions du mode Personnalisé. Elle n'apparaît que dans ce mode et
// dit explicitement quoi faire : créer une catégorie, puis ranger des titres.
// Sans elle, la création de catégories et le glisser-déposer restaient à
// deviner.
export function LibraryCustomBar({
  categoryCount,
  selectMode,
  onCreate,
  onToggleSelect,
}: LibraryCustomBarProps) {
  const hint = selectMode
    ? "Cochez les titres à ranger, puis « Classer dans » en bas de l'écran."
    : categoryCount === 0
      ? "Créez une catégorie (Films du dimanche, À revoir...), puis glissez-y vos titres."
      : "Glissez une jaquette d'une catégorie à l'autre, ou rangez-en plusieurs d'un coup.";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-indigo-500/[0.07] px-3 py-2 ring-1 ring-indigo-500/15 dark:bg-indigo-400/[0.08] dark:ring-indigo-400/20"
    >
      <button
        onClick={onCreate}
        className="flex h-8 flex-none items-center gap-1.5 rounded-full bg-indigo-600 px-3 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
      >
        <FolderPlus className="h-3.5 w-3.5" />
        Nouvelle catégorie
      </button>

      <button
        onClick={onToggleSelect}
        disabled={categoryCount === 0}
        title={
          categoryCount === 0
            ? "Créez d'abord une catégorie"
            : "Sélectionner plusieurs titres pour les ranger"
        }
        className={`flex h-8 flex-none items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          selectMode
            ? "bg-indigo-600 text-white"
            : "bg-white/70 text-zinc-700 ring-1 ring-black/10 hover:bg-white dark:bg-white/10 dark:text-zinc-200 dark:ring-white/10 dark:hover:bg-white/15"
        }`}
      >
        {selectMode ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Terminer le rangement
          </>
        ) : (
          <>
            <MousePointerClick className="h-3.5 w-3.5" />
            Ranger des titres
          </>
        )}
      </button>

      <p className="min-w-0 flex-1 text-right text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
        {hint}
      </p>
    </motion.div>
  );
}
