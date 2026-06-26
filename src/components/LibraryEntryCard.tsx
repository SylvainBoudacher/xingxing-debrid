import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Trash2 } from "lucide-react";
import { formatSize } from "@/lib/debrid";
import { parseRelease } from "@/lib/parseRelease";
import {
  groupBySeason,
  hasMultipleSeasons,
  isSeries,
  isWholeWatched,
  nextUnwatched,
  progressRatio,
  setWholeWatched,
  toggleFile,
  videoFiles,
  watchedCount,
  totalCount,
  type LibraryEntry,
} from "@/lib/library";
import {
  Checkbox,
  DebridActions,
  EntryEpisodes,
  PROVIDER_CLASS,
  PROVIDER_LABEL,
  ResumeButton,
  type DebridControls,
} from "@/components/libraryParts";

export type { DebridControls };

interface LibraryEntryCardProps {
  entry: LibraryEntry;
  onChange: (entry: LibraryEntry) => void;
  onRemove: (infoHash: string) => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay?: boolean;
  defaultExpanded?: boolean;
}

export const LibraryEntryCard = memo(function LibraryEntryCard({
  entry,
  onChange,
  onRemove,
  debrid,
  simple,
  autoWatchOnPlay = false,
  defaultExpanded = false,
}: LibraryEntryCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const series = isSeries(entry);
  const whole = isWholeWatched(entry);
  const vids = videoFiles(entry);
  const multiSeason = series && hasMultipleSeasons(entry);
  const seasonCount = multiSeason ? groupBySeason(vids).length : 0;
  const allLinks = vids.map((f) => f.link);
  const parsed = simple ? parseRelease(entry.title) : null;
  const displayTitle = parsed ? parsed.title : entry.title;
  const next = series && !whole ? nextUnwatched(entry) : null;
  const ratio = progressRatio(entry);
  const resumeKey = `resume-${entry.infoHash}`;

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  return (
    <div className="rounded-xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.04]">
        <Checkbox checked={whole} onClick={() => onChange(setWholeWatched(entry, !whole))} />

        <button
          onClick={() => series && setExpanded((v) => !v)}
          className={`flex min-w-0 flex-1 items-center gap-2 text-left ${series ? "cursor-pointer" : "cursor-default"}`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <p
                className={`truncate text-sm font-medium ${whole ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-900 dark:text-white"}`}
              >
                {displayTitle}
              </p>
              {multiSeason && (
                <span className="flex-none text-xs text-zinc-400 dark:text-zinc-500">
                  {seasonCount} saisons
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span
                className={`rounded px-1.5 py-0.5 font-medium ring-1 ${PROVIDER_CLASS[entry.provider]}`}
              >
                {PROVIDER_LABEL[entry.provider]}
              </span>
              {parsed?.quality && (
                <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 font-semibold uppercase text-indigo-600 dark:text-indigo-300">
                  {parsed.quality}
                </span>
              )}
              {parsed?.codec && (
                <span className="rounded bg-black/5 px-1.5 py-0.5 font-semibold uppercase dark:bg-white/10">
                  {parsed.codec}
                </span>
              )}
              {entry.size > 0 && <span>{formatSize(entry.size)}</span>}
              {series && (
                <span>
                  {watchedCount(entry)}/{totalCount(entry)} vus
                </span>
              )}
            </div>
            {series && (
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              </div>
            )}
          </div>
          {series && (
            <ChevronDown
              className={`h-4 w-4 flex-none text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          )}
        </button>

        {next && (
          <ResumeButton
            next={next}
            groupKey={resumeKey}
            debrid={debrid}
            started={watchedCount(entry) > 0}
            onResume={() => autoWatchOnPlay && onChange(toggleFile(entry, next.name))}
          />
        )}

        <DebridActions
          links={allLinks}
          groupKey={entry.infoHash}
          debrid={debrid}
          onVlcClick={autoWatchOnPlay ? () => onChange(setWholeWatched(entry, true)) : undefined}
        />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (confirmDelete) onRemove(entry.infoHash);
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

      <AnimatePresence initial={false}>
        {series && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-black/5 dark:border-white/10"
          >
            <EntryEpisodes
              entry={entry}
              onChange={onChange}
              debrid={debrid}
              simple={simple}
              autoWatchOnPlay={autoWatchOnPlay}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
