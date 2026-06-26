import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Trash2 } from "lucide-react";
import { formatSize } from "@/lib/debrid";
import {
  dominantSeason,
  groupIsWholeWatched,
  groupNextUnwatched,
  groupProgressRatio,
  groupSize,
  groupTotalCount,
  groupWatchedCount,
  isWholeWatched,
  nextUnwatched,
  setWholeWatched,
  toggleFile,
  totalCount,
  videoFiles,
  watchedCount,
  type LibraryEntry,
  type SeriesGroup,
} from "@/lib/library";
import {
  Checkbox,
  DebridActions,
  EntryEpisodes,
  ResumeButton,
  type DebridControls,
} from "@/components/libraryParts";

interface SeriesGroupCardProps {
  group: SeriesGroup;
  onChange: (entry: LibraryEntry) => void;
  onRemove: (infoHash: string) => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay?: boolean;
}

export const SeriesGroupCard = memo(function SeriesGroupCard({
  group,
  onChange,
  onRemove,
  debrid,
  simple,
  autoWatchOnPlay = false,
}: SeriesGroupCardProps) {
  const [expanded, setExpanded] = useState(false);
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
    <div className="rounded-xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.04]">
        <Checkbox checked={whole} onClick={handleAllWatched} />

        <button
          onClick={() => setExpanded((v) => !v)}
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
                {group.entries.length} saisons
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
          <ChevronDown
            className={`h-4 w-4 flex-none text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        {nextData && (
          <ResumeButton
            next={nextData.file}
            groupKey={`resume-${groupKey}`}
            debrid={debrid}
            started={groupWatchedCount(group) > 0}
            onResume={() =>
              autoWatchOnPlay && onChange(toggleFile(nextData.entry, nextData.file.name))
            }
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

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-black/5 dark:border-white/10"
          >
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {group.entries.map((entry) => (
                <EntrySeasonSection
                  key={entry.infoHash}
                  entry={entry}
                  season={dominantSeason(entry)}
                  onChange={onChange}
                  onRemove={onRemove}
                  debrid={debrid}
                  simple={simple}
                  autoWatchOnPlay={autoWatchOnPlay}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

function EntrySeasonSection({
  entry,
  season,
  onChange,
  onRemove,
  debrid,
  simple,
  autoWatchOnPlay,
}: {
  entry: LibraryEntry;
  season: number | null;
  onChange: (e: LibraryEntry) => void;
  onRemove: (hash: string) => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const vids = videoFiles(entry);
  const seenCount = watchedCount(entry);
  const allSeen = isWholeWatched(entry);
  const label = season !== null ? `Saison ${season}` : "Saison ?";
  const links = vids.map((f) => f.link);
  const sectionKey = entry.infoHash;
  const next = !allSeen ? nextUnwatched(entry) : null;
  const resumeKey = `resume-${sectionKey}`;
  const total = totalCount(entry);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  return (
    <div>
      <div className="flex items-center gap-3 bg-black/[0.02] px-4 py-2 dark:bg-white/[0.03] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.06]">
        <Checkbox checked={allSeen} onClick={() => onChange(setWholeWatched(entry, !allSeen))} />
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`truncate text-xs font-semibold ${allSeen ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-200"}`}
              >
                {label}
              </span>
              <span className="flex-none text-[11px] text-zinc-400">
                {seenCount}/{total}
              </span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.round((seenCount / (total || 1)) * 100)}%` }}
              />
            </div>
          </div>
          <ChevronDown
            className={`h-3.5 w-3.5 flex-none text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {next && (
          <ResumeButton
            next={next}
            groupKey={resumeKey}
            debrid={debrid}
            started={seenCount > 0}
            hideSeason
            onResume={() => autoWatchOnPlay && onChange(toggleFile(entry, next.name))}
          />
        )}
        <DebridActions links={links} groupKey={sectionKey} debrid={debrid} />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (confirmDelete) onRemove(entry.infoHash);
            else setConfirmDelete(true);
          }}
          title={confirmDelete ? "Confirmer" : "Retirer cette saison"}
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
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
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
}
