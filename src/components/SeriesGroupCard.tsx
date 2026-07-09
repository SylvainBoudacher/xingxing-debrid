import { memo, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Trash2 } from "lucide-react";
import { formatSize } from "@/lib/debrid";
import {
  groupIsWholeWatched,
  groupNextUnwatched,
  groupProgressRatio,
  groupSeasons,
  groupSize,
  groupTotalCount,
  groupWatchedCount,
  setSeasonItemsWatched,
  setWholeWatched,
  toggleFile,
  totalCount,
  videoFiles,
  type GroupSeason,
  type LibraryEntry,
  type SeriesGroup,
} from "@/lib/library";
import {
  Checkbox,
  DebridActions,
  FileRow,
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
  const seasons = useMemo(() => groupSeasons(group), [group]);

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
                {seasons.length} saison{seasons.length > 1 ? "s" : ""}
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
              {seasons.map((season) => (
                <SeasonSection
                  key={season.season ?? "other"}
                  season={season}
                  groupKey={groupKey}
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

function SeasonSection({
  season,
  groupKey,
  onChange,
  onRemove,
  debrid,
  simple,
  autoWatchOnPlay,
}: {
  season: GroupSeason;
  groupKey: string;
  onChange: (e: LibraryEntry) => void;
  onRemove: (hash: string) => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const items = season.items;
  const seenCount = items.filter((it) => it.entry.watched[it.file.name]).length;
  const allSeen = seenCount === items.length;
  const label = season.season !== null ? `Saison ${season.season}` : "Saison ?";
  const links = items.map((it) => it.file.link);
  const sectionKey = `${groupKey}-s${season.season ?? "x"}`;
  const next = items.find((it) => !it.entry.watched[it.file.name]) ?? null;
  const total = items.length;

  // Entrées dont tous les fichiers vidéo sont dans cette saison : ce sont
  // celles qu'on peut supprimer sans toucher aux autres saisons.
  const removableHashes = [...new Set(items.map((it) => it.entry))]
    .filter((e) => items.filter((it) => it.entry === e).length === totalCount(e))
    .map((e) => e.infoHash);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  return (
    <div>
      <div className="flex items-center gap-3 bg-black/[0.02] px-4 py-2 dark:bg-white/[0.03] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.06]">
        <Checkbox
          checked={allSeen}
          onClick={() => setSeasonItemsWatched(items, !allSeen, onChange)}
        />
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
            next={next.file}
            groupKey={`resume-${sectionKey}`}
            debrid={debrid}
            started={seenCount > 0}
            hideSeason
            onResume={() => autoWatchOnPlay && onChange(toggleFile(next.entry, next.file.name))}
          />
        )}
        <DebridActions links={links} groupKey={sectionKey} debrid={debrid} />
        {removableHashes.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (confirmDelete) for (const h of removableHashes) onRemove(h);
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
        )}
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
            <ul className="divide-y divide-black/5 dark:divide-white/5">
              {items.map((it) => (
                <FileRow
                  key={`${it.entry.infoHash}-${it.file.name}`}
                  file={it.file}
                  entry={it.entry}
                  onChange={onChange}
                  debrid={debrid}
                  simple={simple}
                  autoWatchOnPlay={autoWatchOnPlay}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
