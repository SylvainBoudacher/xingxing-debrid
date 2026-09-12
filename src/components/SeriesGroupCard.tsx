import { memo, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChevronRight, Trash2 } from "lucide-react";
import { formatSize } from "@/lib/debrid";
import {
  groupIsWholeWatched,
  groupNextUnwatched,
  groupProgressRatio,
  groupSeasons,
  groupSize,
  groupTotalCount,
  groupWatchedCount,
  setWholeWatched,
  toggleFile,
  videoFiles,
  type LibraryEntry,
  type SeriesGroup,
} from "@/lib/library";
import {
  Checkbox,
  DebridActions,
  ResumeButton,
  type DebridControls,
} from "@/components/libraryParts";
import { setResume } from "@/lib/resumeWatch";

interface SeriesGroupCardProps {
  group: SeriesGroup;
  onChange: (entry: LibraryEntry) => void;
  onRemove: (infoHash: string) => void;
  // Ouvre la fiche plein écran de la série.
  onOpen: (tmdbId: number) => void;
  debrid: DebridControls;
  autoWatchOnPlay?: boolean;
}

export const SeriesGroupCard = memo(function SeriesGroupCard({
  group,
  onChange,
  onRemove,
  onOpen,
  debrid,
  autoWatchOnPlay = false,
}: SeriesGroupCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const whole = groupIsWholeWatched(group);
  const ratio = groupProgressRatio(group);
  const title = group.tmdb.title;
  const watched = groupWatchedCount(group);
  const total = groupTotalCount(group);
  const allLinks = group.entries.flatMap((e) => videoFiles(e).map((f) => f.link));
  const groupKey = `series-${group.tmdbId}`;
  const nextData = groupNextUnwatched(group);
  const size = groupSize(group);
  const seasonCount = useMemo(() => groupSeasons(group).length, [group]);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  function handleAllWatched() {
    const val = !whole;
    for (const e of group.entries) onChange(setWholeWatched(e, val));
  }

  function handleDeleteAll() {
    for (const e of group.entries) onRemove(e.infoHash);
  }

  return (
    <div
      data-title-key={`g${group.tmdbId}`}
      className="rounded-xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-sm overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.04]">
        <Checkbox checked={whole} onClick={handleAllWatched} />

        <button
          onClick={() => onOpen(group.tmdbId)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <p
                className={`truncate text-sm font-medium ${whole ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-900 dark:text-white"}`}
              >
                {title}
              </p>
              <span className="flex-none text-xs text-zinc-400 dark:text-zinc-500">
                {seasonCount} saison{seasonCount > 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              {size > 0 && <span>{formatSize(size)}</span>}
              <span>
                {watched}/{total} vus
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </div>
          </div>
          <ChevronRight className="h-4 w-4 flex-none text-zinc-400" />
        </button>

        {nextData && (
          <ResumeButton
            next={nextData.file}
            groupKey={`resume-${groupKey}`}
            debrid={debrid}
            started={groupWatchedCount(group) > 0}
            onResume={() => {
              setResume({ kind: "group", group });
              if (autoWatchOnPlay) onChange(toggleFile(nextData.entry, nextData.file.name));
            }}
          />
        )}

        <DebridActions
          links={allLinks}
          groupKey={groupKey}
          debrid={debrid}
          onVlcClick={autoWatchOnPlay ? handleAllWatched : undefined}
        />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (confirmDelete) handleDeleteAll();
            else setConfirmDelete(true);
          }}
          title={confirmDelete ? "Confirmer la suppression" : "Supprimer"}
          className={`flex h-7 flex-none items-center justify-center rounded-lg transition-colors ${
            confirmDelete
              ? "gap-1 bg-red-500 px-2 text-xs font-medium text-white hover:bg-red-600"
              : "w-7 text-zinc-400 hover:bg-red-500/10 hover:text-red-500"
          }`}
        >
          <Trash2 className="h-4 w-4" />
          {confirmDelete && "Sûr ?"}
        </motion.button>
      </div>
    </div>
  );
});
