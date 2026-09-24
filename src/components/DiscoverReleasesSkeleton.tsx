import { motion } from "motion/react";

const BAR = "rounded bg-zinc-300/70 dark:bg-zinc-700/70";

// Squelette de chargement des choix rapides d'une fiche.
export function DiscoverReleasesSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-2">
      {Array.from({ length: 3 }, (_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.07 }}
          className="flex animate-pulse flex-col gap-3 rounded-xl bg-white/80 dark:bg-zinc-800/60 p-4"
        >
          <div className={`h-7 w-16 ${BAR}`} />
          <div className="space-y-2">
            <div className={`h-3 w-24 ${BAR}`} />
            <div className={`h-2.5 w-20 ${BAR}`} />
          </div>
          <div className="h-9 rounded-full bg-zinc-300/70 dark:bg-zinc-700/70" />
        </motion.div>
      ))}
    </div>
  );
}
