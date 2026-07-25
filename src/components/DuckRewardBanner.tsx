import { motion } from "motion/react";
import { Gift } from "lucide-react";

// Bandeau en tete du Canardex: les cartes de recompenses sont tout en bas de la
// liste, sans lui on ne sait pas qu'il y a quelque chose a reclamer.
export function DuckRewardBanner({ count, onSee }: { count: number; onSee: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mt-3 flex items-center gap-2 rounded-lg bg-amber-400/15 px-3 py-2 ring-1 ring-amber-400/50"
    >
      <Gift className="h-4 w-4 shrink-0 text-amber-500" />
      <p className="flex-1 text-xs font-medium text-amber-700 dark:text-amber-300">
        {count > 1 ? `${count} récompenses à réclamer` : "1 récompense à réclamer"}
      </p>
      <button
        onClick={onSee}
        className="rounded-md bg-amber-400 px-2 py-1 text-[11px] font-semibold text-amber-950 transition-colors hover:bg-amber-300"
      >
        Voir
      </button>
    </motion.div>
  );
}
