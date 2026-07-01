import {
  groupIsWholeWatched,
  groupProgressRatio,
  groupTotalCount,
  groupWatchedCount,
  type SeriesGroup,
} from "@/lib/library";
import { Check, Trash2 } from "lucide-react";
import { memo, useEffect, useState } from "react";

interface SeriesGroupPosterCardProps {
  group: SeriesGroup;
  expanded: boolean;
  onToggle: () => void;
  // Suppression directe au survol (retire toute la série de la bibliothèque).
  onRemove?: () => void;
  // Mode sélection multiple : le clic coche la série au lieu de l'ouvrir.
  selectMode?: boolean;
  selected?: boolean;
}

export const SeriesGroupPosterCard = memo(function SeriesGroupPosterCard({
  group,
  expanded,
  onToggle,
  onRemove,
  selectMode = false,
  selected = false,
}: SeriesGroupPosterCardProps) {
  const whole = groupIsWholeWatched(group);
  const ratio = groupProgressRatio(group);
  const watched = groupWatchedCount(group);
  const total = groupTotalCount(group);
  const title = group.tmdb.title;
  const year = group.tmdb.year;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const active = expanded || (selectMode && selected);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  return (
    <button
      onClick={onToggle}
      onMouseLeave={() => setConfirmDelete(false)}
      className={`group relative block aspect-[2/3] cursor-pointer overflow-hidden rounded-xl text-left ring-2 transition-[box-shadow,ring-color,transform] duration-200 hover:-translate-y-1 active:scale-[0.98] ${
        active
          ? "ring-indigo-500"
          : "ring-black/8 dark:ring-white/10 hover:ring-indigo-400/50 dark:hover:ring-indigo-400/40 hover:shadow-[0_18px_40px_-14px_rgba(0,0,0,0.45)]"
      }`}
    >
      {group.tmdb.posterPath ? (
        <img
          src={`https://image.tmdb.org/t/p/w342${group.tmdb.posterPath}`}
          alt={title}
          width={342}
          height={513}
          loading="lazy"
          decoding="async"
          className={`block h-full w-full object-cover transition-[filter] duration-300 ${whole ? "brightness-50" : "group-hover:brightness-105"}`}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-indigo-500/25 via-zinc-200 to-zinc-300 px-3 text-center dark:from-indigo-500/20 dark:via-zinc-800 dark:to-zinc-900">
          <span className="line-clamp-4 text-xs font-medium text-zinc-700 dark:text-zinc-200">
            {title}
          </span>
        </div>
      )}

      {/* Case de sélection (mode multi-sélection) */}
      {selectMode && (
        <span
          className={`absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 shadow backdrop-blur-sm ${
            selected ? "border-indigo-500 bg-indigo-500 text-white" : "border-white/80 bg-black/40"
          }`}
        >
          {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </span>
      )}

      {whole && !selectMode && (
        <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      )}

      <span
        className={`absolute right-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm ${
          onRemove && !selectMode ? "transition-opacity group-hover:opacity-0" : ""
        }`}
      >
        {group.entries.length} S
      </span>

      {/* Suppression directe au survol */}
      {onRemove && !selectMode && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (confirmDelete) onRemove();
            else setConfirmDelete(true);
          }}
          title={confirmDelete ? "Confirmer la suppression" : "Retirer de la bibliothèque"}
          className={`absolute right-1.5 top-1.5 z-10 flex h-6 items-center justify-center gap-1 rounded-full text-white opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100 ${
            confirmDelete
              ? "bg-red-500 px-2 text-[10px] font-semibold"
              : "w-6 bg-red-500/85 hover:bg-red-500"
          }`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {confirmDelete && "Sûr ?"}
        </span>
      )}

      <div
        className="absolute inset-x-0 bottom-0 px-2.5 pb-2 pt-8"
        style={{
          WebkitMaskImage: "linear-gradient(to top, black 60%, transparent)",
          maskImage: "linear-gradient(to top, black 60%, transparent)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent" />
        <p className="relative truncate text-xs font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
          {title}
        </p>
        <div className="relative mt-0.5 flex items-center gap-2 text-[10px] text-zinc-200 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
          {year && <span>{year}</span>}
          <span>
            {watched}/{total}
          </span>
        </div>
        <div className="relative mt-1 h-1 w-full overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      </div>
    </button>
  );
});
