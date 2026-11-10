import { RadarPoster } from "@/components/radar/RadarPoster";
import { STATUS_RING } from "@/components/radar/statusRing";
import { libraryLabel, rowSummary } from "@/lib/radar/labels";
import type { ContentKey, RadarEntry } from "@/lib/radar/types";
import type { RadarStatus } from "@/lib/radar/view";
import { Check, Pencil, Trash2 } from "lucide-react";
import { motion } from "motion/react";

interface RadarPosterCardProps {
  entry: RadarEntry;
  status: RadarStatus;
  owned: { certain: Set<ContentKey>; uncertain: Set<ContentKey> };
  selected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

const ACTION =
  "absolute top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full text-white opacity-0 shadow backdrop-blur-sm transition-opacity group-hover:opacity-100 focus:opacity-100";

export function RadarPosterCard({
  entry,
  status,
  owned,
  selected,
  onToggleSelect,
  onView,
  onEdit,
  onRemove,
}: RadarPosterCardProps) {
  const { item, season } = entry;
  const title = season !== null ? `${item.title}, saison ${season}` : item.title;
  const library = libraryLabel(entry, owned);
  const stop = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    action();
  };
  return (
    <motion.div
      role="button"
      tabIndex={0}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onView}
      onKeyDown={(e) => e.key === "Enter" && onView()}
      className={`group relative block aspect-[2/3] cursor-pointer overflow-hidden rounded-xl bg-zinc-200 ring-2 transition-shadow duration-200 hover:shadow-[0_18px_40px_-14px_rgba(0,0,0,0.45)] dark:bg-zinc-800 ${
        selected ? "ring-indigo-500" : STATUS_RING[status]
      }`}
    >
      <RadarPoster path={item.posterPath} />

      <button
        type="button"
        onClick={stop(onToggleSelect)}
        aria-label={`Sélectionner ${item.title}`}
        aria-pressed={selected}
        className={`absolute left-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 shadow backdrop-blur-sm transition-opacity ${
          selected
            ? "border-indigo-500 bg-indigo-500 text-white"
            : "border-white/80 bg-black/40 text-transparent opacity-0 group-hover:opacity-100 focus:opacity-100"
        }`}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </button>

      <button
        type="button"
        onClick={stop(onEdit)}
        aria-label={`Modifier ${item.title}`}
        title="Modifier"
        className={`${ACTION} right-9 bg-black/50 hover:bg-black/70`}
      >
        <Pencil className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={stop(onRemove)}
        aria-label={`Retirer ${item.title}`}
        title="Retirer du radar"
        className={`${ACTION} right-1.5 bg-red-500/85 hover:bg-red-500`}
      >
        <Trash2 className="h-3 w-3" />
      </button>

      <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2 pt-8">
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent" />
        <p className="relative truncate text-xs font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
          {title}
        </p>
        <p className="relative truncate text-[10px] text-zinc-200 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
          {rowSummary(entry, status)}
        </p>
        {library && (
          <p className="relative truncate text-[10px] text-emerald-300 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
            {library}
          </p>
        )}
      </div>
    </motion.div>
  );
}
