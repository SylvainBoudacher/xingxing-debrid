import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Star, Trash2, X } from "lucide-react";
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

interface SeriesGroupDetailModalProps {
  group: SeriesGroup;
  onChange: (entry: LibraryEntry) => void;
  onRemove: (infoHash: string) => void;
  onClose: () => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay: boolean;
}

export function SeriesGroupDetailModal({
  group,
  onChange,
  onRemove,
  onClose,
  debrid,
  simple,
  autoWatchOnPlay,
}: SeriesGroupDetailModalProps) {
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
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white/95 shadow-2xl ring-1 ring-black/10 backdrop-blur-xl dark:bg-zinc-900/95 dark:ring-white/10"
      >
        <div className="flex items-start gap-4 px-5 pb-4 pt-5">
          <div className="h-32 w-[88px] flex-none overflow-hidden rounded-lg bg-zinc-200 ring-1 ring-black/10 dark:bg-zinc-800 dark:ring-white/10">
            {group.tmdb.posterPath ? (
              <img
                src={`https://image.tmdb.org/t/p/w154${group.tmdb.posterPath}`}
                alt={title}
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                {title}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold leading-snug text-zinc-900 dark:text-white">
              {title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              {group.tmdb.year && <span>{group.tmdb.year}</span>}
              {group.tmdb.voteAverage > 0 && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Star className="h-3 w-3 fill-amber-400" />
                  {group.tmdb.voteAverage.toFixed(1)}
                </span>
              )}
              {size > 0 && <span>{formatSize(size)}</span>}
              <span>{group.entries.length} saisons</span>
              <span>
                {watched}/{total} vus
              </span>
            </div>
            {group.tmdb.overview && (
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {group.tmdb.overview}
              </p>
            )}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex flex-none items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (confirmDelete) handleDeleteAll();
                else setConfirmDelete(true);
              }}
              title={confirmDelete ? "Confirmer la suppression" : "Supprimer"}
              className={`flex h-6 items-center justify-center rounded-md transition-colors ${
                confirmDelete
                  ? "gap-1 bg-red-500 px-2 text-[11px] font-medium text-white hover:bg-red-600"
                  : "w-6 bg-zinc-200 text-zinc-500 hover:bg-red-500/15 hover:text-red-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {confirmDelete && "Sûr ?"}
            </motion.button>
            <button
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 transition-colors hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <X className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 border-y border-black/5 bg-black/[0.02] px-5 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
          <Checkbox checked={whole} onClick={handleAllWatched} />
          <span className="flex-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            {whole ? "Marqué comme vu" : "Marquer comme vu"}
          </span>
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
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-black/5 dark:divide-white/10">
          {group.entries.map((entry) => (
            <ModalSeasonSection
              key={entry.infoHash}
              entry={entry}
              season={dominantSeason(entry)}
              onChange={onChange}
              debrid={debrid}
              simple={simple}
              autoWatchOnPlay={autoWatchOnPlay}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ModalSeasonSection({
  entry,
  season,
  onChange,
  debrid,
  simple,
  autoWatchOnPlay,
}: {
  entry: LibraryEntry;
  season: number | null;
  onChange: (e: LibraryEntry) => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay: boolean;
}) {
  const [open, setOpen] = useState(true);
  const vids = videoFiles(entry);
  const seenCount = watchedCount(entry);
  const allSeen = isWholeWatched(entry);
  const label = season !== null ? `Saison ${season}` : "Saison ?";
  const links = vids.map((f) => f.link);
  const sectionKey = entry.infoHash;
  const next = !allSeen ? nextUnwatched(entry) : null;
  const resumeKey = `resume-${sectionKey}`;
  const total = totalCount(entry);

  return (
    <div>
      <div className="flex items-center gap-3 bg-black/[0.02] px-5 py-2.5 dark:bg-white/[0.03] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.06]">
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
