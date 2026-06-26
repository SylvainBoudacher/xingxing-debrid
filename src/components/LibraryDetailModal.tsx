import {
  Checkbox,
  DebridActions,
  EntryEpisodes,
  PROVIDER_CLASS,
  PROVIDER_LABEL,
  ResumeButton,
  type DebridControls,
} from "@/components/libraryParts";
import { formatSize } from "@/lib/debrid";
import {
  groupBySeason,
  hasMultipleSeasons,
  isSeries,
  isWholeWatched,
  nextUnwatched,
  progressRatio,
  setWholeWatched,
  toggleFile,
  totalCount,
  videoFiles,
  watchedCount,
  type LibraryEntry,
} from "@/lib/library";
import { parseRelease } from "@/lib/parseRelease";
import { Clapperboard, Pencil, Star, Trash2, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface LibraryDetailModalProps {
  entry: LibraryEntry;
  onChange: (entry: LibraryEntry) => void;
  onRemove: (infoHash: string) => void;
  onClose: () => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay: boolean;
  // Présent uniquement si l'entrée peut être complétée et qu'une clé TMDB existe.
  onEnrichTmdb?: () => void;
  // Vrai quand la recherche TMDB est ouverte par-dessus : neutralise Escape ici.
  enrichOpen?: boolean;
}

export function LibraryDetailModal({
  entry,
  onChange,
  onRemove,
  onClose,
  debrid,
  simple,
  autoWatchOnPlay,
  onEnrichTmdb,
  enrichOpen,
}: LibraryDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const tmdb = entry.tmdb;
  const series = isSeries(entry);
  const whole = isWholeWatched(entry);
  const vids = videoFiles(entry);
  const multiSeason = series && hasMultipleSeasons(entry);
  const seasonCount = multiSeason ? groupBySeason(vids).length : 0;
  const allLinks = vids.map((f) => f.link);
  const parsed = simple ? parseRelease(entry.title) : null;
  const title = tmdb?.title ?? (parsed ? parsed.title : entry.title);
  const next = series && !whole ? nextUnwatched(entry) : null;
  const ratio = progressRatio(entry);
  const resumeKey = `resume-${entry.infoHash}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !enrichOpen && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, enrichOpen]);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

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
        {/* En-tête : affiche + infos */}
        <div className="flex items-start gap-4 px-5 pb-4 pt-5">
          <div className="h-32 w-[88px] flex-none overflow-hidden rounded-lg bg-zinc-200 ring-1 ring-black/10 dark:bg-zinc-800 dark:ring-white/10">
            {tmdb?.posterPath ? (
              <img
                src={`https://image.tmdb.org/t/p/w154${tmdb.posterPath}`}
                alt={title}
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
              <span
                className={`rounded px-1.5 py-0.5 font-medium ring-1 ${PROVIDER_CLASS[entry.provider]}`}
              >
                {PROVIDER_LABEL[entry.provider]}
              </span>
              {tmdb?.year && <span>{tmdb.year}</span>}
              {tmdb && tmdb.voteAverage > 0 && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Star className="h-3 w-3 fill-amber-400" />
                  {tmdb.voteAverage.toFixed(1)}
                </span>
              )}
              {entry.size > 0 && <span>{formatSize(entry.size)}</span>}
              {multiSeason && <span>{seasonCount} saisons</span>}
              {series && (
                <span>
                  {watchedCount(entry)}/{totalCount(entry)} vus
                </span>
              )}
            </div>
            {tmdb?.overview && (
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {tmdb.overview}
              </p>
            )}
            {onEnrichTmdb && !tmdb && (
              <button
                onClick={onEnrichTmdb}
                className="mt-2 flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-500/20 dark:text-indigo-300"
              >
                <Clapperboard className="h-3.5 w-3.5" />
                Compléter via TMDB
              </button>
            )}
            {series && (
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              </div>
            )}
          </div>

          <div className="flex flex-none items-center gap-1.5">
            {onEnrichTmdb && tmdb && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onEnrichTmdb}
                title="Changer les informations TMDB"
                className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 text-zinc-500 transition-colors hover:bg-indigo-500/15 hover:text-indigo-500 dark:bg-zinc-800 dark:text-zinc-400"
              >
                <Pencil className="h-3.5 w-3.5" />
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (confirmDelete) {
                  onRemove(entry.infoHash);
                  onClose();
                } else setConfirmDelete(true);
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

        {/* Barre d'actions globales : seulement pour les séries (plusieurs fichiers).
            Pour un film, la ligne du fichier unique suffit. */}
        {vids.length > 1 && (
          <div className="flex items-center gap-3 border-y border-black/5 bg-black/[0.02] px-5 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
            <Checkbox checked={whole} onClick={() => onChange(setWholeWatched(entry, !whole))} />
            <span className="flex-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              {whole ? "Marqué comme vu" : "Marquer comme vu"}
            </span>
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
              onVlcClick={
                autoWatchOnPlay ? () => onChange(setWholeWatched(entry, true)) : undefined
              }
            />
          </div>
        )}

        {/* Liste épisodes / fichiers */}
        <div
          className={`min-h-0 flex-1 overflow-y-auto ${vids.length > 1 ? "" : "border-t border-black/5 dark:border-white/10"}`}
        >
          <EntryEpisodes
            entry={entry}
            onChange={onChange}
            debrid={debrid}
            simple={simple}
            autoWatchOnPlay={autoWatchOnPlay}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
