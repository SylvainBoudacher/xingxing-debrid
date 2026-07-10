import { SEARCH_FILTER_LABELS, SEARCH_FILTERS, type SearchFilter } from "@/lib/useDiscoverFeed";
import { Clapperboard, Tv } from "lucide-react";
import { motion } from "motion/react";

interface DiscoverSearchFiltersProps {
  /** Visibles uniquement sur les résultats de recherche */
  visible: boolean;
  active: SearchFilter;
  onChange: (f: SearchFilter) => void;
}

// Filtres d'affinage de la recherche générale (Tout / Films / Séries).
export function DiscoverSearchFilters({ visible, active, onChange }: DiscoverSearchFiltersProps) {
  return (
    <motion.div
      initial={false}
      animate={
        visible
          ? { opacity: 1, y: 0, height: "auto", marginBottom: 24 }
          : { opacity: 0, y: -12, height: 0, marginBottom: 0 }
      }
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 26,
        opacity: { duration: 0.15 },
      }}
      className={`overflow-hidden ${visible ? "" : "pointer-events-none"}`}
    >
      <div className="flex justify-center gap-1.5">
        {SEARCH_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => onChange(f)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 transition-colors ${
              active === f
                ? "bg-indigo-600 text-white ring-indigo-500"
                : "bg-white/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 ring-black/10 dark:ring-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            {f === "movie" ? (
              <Clapperboard className="h-3.5 w-3.5" />
            ) : f === "tv" ? (
              <Tv className="h-3.5 w-3.5" />
            ) : null}
            {SEARCH_FILTER_LABELS[f]}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
