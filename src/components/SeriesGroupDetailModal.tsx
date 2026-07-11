import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  ListChecks,
  Loader2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatSize } from "@/lib/debrid";
import {
  groupIsWholeWatched,
  groupNextUnwatched,
  groupProgressRatio,
  groupSeasons,
  groupSize,
  groupTotalCount,
  groupWatchedCount,
  removeFilesByLink,
  setSeasonItemsWatched,
  setWholeWatched,
  toggleFile,
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
  type EpisodeSelection,
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
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDeleteSelection, setConfirmDeleteSelection] = useState(false);

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

  const selectionKey = `${groupKey}-selection`;
  const downloadingSelection = debrid.bulkDownloading === selectionKey;
  const copyingSelection = debrid.bulkCopying === selectionKey;
  const busySelection = downloadingSelection || copyingSelection;
  const allSelected = allLinks.length > 0 && selected.size === allLinks.length;

  const selection: EpisodeSelection = {
    has: (link) => selected.has(link),
    toggle: (link) =>
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(link)) next.delete(link);
        else next.add(link);
        return next;
      }),
    setMany: (links, on) =>
      setSelected((prev) => {
        const next = new Set(prev);
        links.forEach((l) => (on ? next.add(l) : next.delete(l)));
        return next;
      }),
  };

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
    setConfirmDeleteSelection(false);
  }

  // Retire les épisodes sélectionnés de la bibliothèque, entrée par entrée.
  // Une entrée vidée de tous ses fichiers vidéo est supprimée ; si tout le
  // groupe disparaît, la modale se ferme d'elle-même (le groupe n'existe plus).
  function handleDeleteSelection() {
    for (const e of group.entries) {
      const updated = removeFilesByLink(e, selected);
      if (updated === null) onRemove(e.infoHash);
      else if (updated !== e) onChange(updated);
    }
    exitSelectMode();
  }

  useEffect(() => {
    if (!confirmDeleteSelection) return;
    const t = setTimeout(() => setConfirmDeleteSelection(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDeleteSelection]);

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
              <span>
                {seasons.length} saison{seasons.length > 1 ? "s" : ""}
              </span>
              <span>
                {watched}/{total} vus
              </span>
            </div>
            {group.tmdb.overview && (
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {group.tmdb.overview}
              </p>
            )}
            <div className="relative mt-2.5 h-3.5 w-full overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold leading-none tabular-nums text-zinc-700 dark:text-zinc-200">
                {watched}/{total}
              </span>
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

        {!selectMode && (
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
            {allLinks.length > 1 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectMode(true)}
                className="flex h-7 flex-none items-center gap-1.5 rounded-lg bg-black/5 px-2.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
              >
                <ListChecks className="h-3.5 w-3.5" />
                Choisir des épisodes
              </motion.button>
            )}
            <DebridActions
              links={allLinks}
              groupKey={groupKey}
              debrid={debrid}
              onVlcClick={autoWatchOnPlay ? handleAllWatched : undefined}
            />
          </div>
        )}

        {selectMode && (
          <div className="flex items-center gap-2 border-y border-black/5 bg-black/[0.02] px-5 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
            <button
              onClick={() => selection.setMany(allLinks, !allSelected)}
              disabled={busySelection}
              className="flex items-center gap-2 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 disabled:opacity-40 dark:text-zinc-300 dark:hover:text-white"
            >
              <span
                className={`flex h-4 w-4 flex-none items-center justify-center rounded ring-1 transition-colors ${
                  allSelected
                    ? "bg-indigo-600 ring-indigo-500"
                    : "bg-zinc-200 ring-black/10 dark:bg-zinc-800 dark:ring-white/10"
                }`}
              >
                {allSelected && <Check className="h-3 w-3 text-white" />}
              </span>
              Tout sélectionner
            </button>
            <span className="flex-1 text-right text-xs font-medium text-zinc-600 dark:text-zinc-300">
              {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
            </span>
            <button
              onClick={exitSelectMode}
              disabled={busySelection}
              className="flex h-7 flex-none items-center rounded-lg px-3 text-xs font-medium text-zinc-500 transition-colors hover:bg-black/5 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/10"
            >
              Annuler
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (confirmDeleteSelection) handleDeleteSelection();
                else setConfirmDeleteSelection(true);
              }}
              disabled={selected.size === 0 || busySelection}
              title={
                confirmDeleteSelection ? "Confirmer la suppression" : "Retirer de la bibliothèque"
              }
              className={`flex h-7 flex-none items-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                confirmDeleteSelection
                  ? "bg-red-600 text-white hover:bg-red-500"
                  : "bg-red-500/10 text-red-600 ring-1 ring-red-500/20 hover:bg-red-500/20 dark:text-red-400"
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {confirmDeleteSelection ? "Sûr ?" : `Supprimer (${selected.size})`}
            </motion.button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={selected.size === 0 || busySelection}
                  className="flex h-7 flex-none items-center gap-1.5 rounded-lg bg-indigo-600 pl-3 pr-2 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busySelection ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  ) : (
                    <Download className="h-3.5 w-3.5 text-white" />
                  )}
                  <span className="text-xs font-medium text-white">
                    Télécharger ({selected.size})
                  </span>
                  <ChevronDown className="h-3 w-3 text-white/70" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => debrid.downloadMany([...selected], selectionKey)}
                  disabled={busySelection}
                >
                  <Download className="h-4 w-4" />
                  Télécharger
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => debrid.copyMany([...selected], selectionKey)}
                  disabled={busySelection}
                >
                  {copyingSelection ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copier les liens
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-black/5 dark:divide-white/10">
          {seasons.map((season) => (
            <ModalSeasonSection
              key={season.season ?? "other"}
              season={season}
              groupKey={groupKey}
              onChange={onChange}
              debrid={debrid}
              simple={simple}
              autoWatchOnPlay={autoWatchOnPlay}
              selection={selectMode ? selection : undefined}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ModalSeasonSection({
  season,
  groupKey,
  onChange,
  debrid,
  simple,
  autoWatchOnPlay,
  selection,
}: {
  season: GroupSeason;
  groupKey: string;
  onChange: (e: LibraryEntry) => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay: boolean;
  selection?: EpisodeSelection;
}) {
  const [open, setOpen] = useState(false);
  const items = season.items;
  const seenCount = items.filter((it) => it.entry.watched[it.file.name]).length;
  const allSeen = seenCount === items.length;
  const label = season.season !== null ? `Saison ${season.season}` : "Saison ?";
  const links = items.map((it) => it.file.link);
  const sectionKey = `${groupKey}-s${season.season ?? "x"}`;
  const next = items.find((it) => !it.entry.watched[it.file.name]) ?? null;
  const total = items.length;
  const allSelected = !!selection && links.every((l) => selection.has(l));

  return (
    <div>
      <div
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-3 bg-black/[0.02] px-5 py-2.5 dark:bg-white/[0.03] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
      >
        <div onClick={(e) => e.stopPropagation()} className="flex flex-none items-center">
          {selection ? (
            <button
              onClick={() => selection.setMany(links, !allSelected)}
              className={`flex h-5 w-5 flex-none items-center justify-center rounded-md ring-1 transition-colors ${
                allSelected
                  ? "bg-indigo-600 ring-indigo-500"
                  : "bg-zinc-200 ring-black/10 dark:bg-zinc-800 dark:ring-white/10"
              }`}
            >
              {allSelected && <Check className="h-3 w-3 text-white" />}
            </button>
          ) : (
            <Checkbox
              checked={allSeen}
              onClick={() => setSeasonItemsWatched(items, !allSeen, onChange)}
            />
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span
            className={`truncate text-xs font-semibold ${allSeen ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-200"}`}
          >
            {label}
          </span>
          <span
            className={`flex h-5 flex-none items-center rounded-md px-1.5 text-[11px] font-medium ${
              seenCount > 0 && !allSeen
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-black/5 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
            }`}
          >
            {seenCount}/{total}
          </span>
          <ChevronDown
            className={`ml-auto h-3.5 w-3.5 flex-none text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
        <div onClick={(e) => e.stopPropagation()} className="flex flex-none items-center gap-3">
          {!selection && next && (
            <ResumeButton
              next={next.file}
              groupKey={`resume-${sectionKey}`}
              debrid={debrid}
              started={seenCount > 0}
              hideSeason
              onResume={() => autoWatchOnPlay && onChange(toggleFile(next.entry, next.file.name))}
            />
          )}
          {!selection && <DebridActions links={links} groupKey={sectionKey} debrid={debrid} />}
        </div>
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
                  selection={selection}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
