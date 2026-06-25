import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown, Copy, Download, Loader2, Play, Trash2 } from "lucide-react";
import vlcLogo from "@/assets/vlc.png";
import { formatSize } from "@/lib/debrid";
import { parseRelease } from "@/lib/parseRelease";
import {
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
  type LibraryProvider,
} from "@/lib/library";

export interface DebridControls {
  bulkDownloading: string | null;
  bulkCopying: string | null;
  bulkVlc: string | null;
  downloadMany: (links: string[], groupKey: string) => void;
  copyMany: (links: string[], groupKey: string) => void;
  openVlcMany: (links: string[], groupKey: string) => void;
}

function DebridActions({
  links,
  groupKey,
  debrid,
}: {
  links: string[];
  groupKey: string;
  debrid: DebridControls;
}) {
  if (links.length === 0) return null;
  const downloading = debrid.bulkDownloading === groupKey;
  const copying = debrid.bulkCopying === groupKey;
  const vlcing = debrid.bulkVlc === groupKey;
  const btn =
    "flex h-7 w-7 flex-none items-center justify-center rounded-lg transition-colors disabled:opacity-40";

  return (
    <div className="flex flex-none items-center gap-1">
      <motion.button
        whileTap={{ scale: 0.9 }}
        title="Lire avec VLC"
        onClick={() => debrid.openVlcMany(links, groupKey)}
        disabled={vlcing}
        className={`${btn} hover:bg-black/5 dark:hover:bg-white/10`}
      >
        {vlcing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
        ) : (
          <img src={vlcLogo} className="h-4 w-4" alt="VLC" />
        )}
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        title="Copier le(s) lien(s)"
        onClick={() => debrid.copyMany(links, groupKey)}
        disabled={copying}
        className={`${btn} hover:bg-black/5 dark:hover:bg-white/10`}
      >
        {copying ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-300" />
        )}
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        title="Télécharger"
        onClick={() => debrid.downloadMany(links, groupKey)}
        disabled={downloading}
        className={`${btn} bg-indigo-600 hover:bg-indigo-500`}
      >
        {downloading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
        ) : (
          <Download className="h-3.5 w-3.5 text-white" />
        )}
      </motion.button>
    </div>
  );
}

const PROVIDER_LABEL: Record<LibraryProvider, string> = {
  c411: "C411",
  nyaa: "Nyaa",
  discover: "Découverte",
};

const PROVIDER_CLASS: Record<LibraryProvider, string> = {
  c411: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 ring-indigo-500/20",
  nyaa: "bg-sky-500/10 text-sky-600 dark:text-sky-300 ring-sky-500/20",
  discover: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300 ring-fuchsia-500/20",
};

function Checkbox({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      className={`flex h-5 w-5 flex-none items-center justify-center rounded-md ring-1 transition-colors ${
        checked
          ? "bg-emerald-500 ring-emerald-500 text-white"
          : "bg-transparent ring-black/20 dark:ring-white/20 text-transparent hover:ring-emerald-400"
      }`}
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </motion.button>
  );
}

interface LibraryEntryCardProps {
  entry: LibraryEntry;
  onChange: (entry: LibraryEntry) => void;
  onRemove: (infoHash: string) => void;
  debrid: DebridControls;
  simple: boolean;
}

export function LibraryEntryCard({
  entry,
  onChange,
  onRemove,
  debrid,
  simple,
}: LibraryEntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const series = isSeries(entry);
  const whole = isWholeWatched(entry);
  const vids = videoFiles(entry);
  const allLinks = vids.map((f) => f.link);
  const parsed = simple ? parseRelease(entry.title) : null;
  const displayTitle = parsed ? parsed.title : entry.title;
  const next = series && !whole ? nextUnwatched(entry) : null;
  const ratio = progressRatio(entry);
  const resumeKey = `resume-${entry.infoHash}`;
  const resuming = debrid.bulkVlc === resumeKey;

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  return (
    <div className="rounded-xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <Checkbox checked={whole} onClick={() => onChange(setWholeWatched(entry, !whole))} />

        <button
          onClick={() => series && setExpanded((v) => !v)}
          className={`flex min-w-0 flex-1 items-center gap-2 text-left ${series ? "cursor-pointer" : "cursor-default"}`}
        >
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-medium ${whole ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-900 dark:text-white"}`}
            >
              {displayTitle}
            </p>
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
          <motion.button
            whileTap={{ scale: 0.9 }}
            title="Reprendre l'épisode suivant"
            onClick={() => debrid.openVlcMany([next.link], resumeKey)}
            disabled={resuming}
            className="flex h-7 flex-none items-center gap-1 rounded-lg px-2 text-xs font-medium text-emerald-600 hover:bg-emerald-500/10 disabled:opacity-40 dark:text-emerald-400"
          >
            {resuming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Reprendre
          </motion.button>
        )}

        <DebridActions links={allLinks} groupKey={entry.infoHash} debrid={debrid} />

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
            <ul className="divide-y divide-black/5 dark:divide-white/5">
              {videoFiles(entry).map((f) => {
                const fileWatched = entry.watched[f.name] ?? false;
                return (
                  <li key={f.name} className="flex items-center gap-3 px-4 py-2 pl-6">
                    <Checkbox
                      checked={fileWatched}
                      onClick={() => onChange(toggleFile(entry, f.name))}
                    />
                    <span
                      className={`min-w-0 flex-1 truncate text-xs ${fileWatched ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"}`}
                    >
                      {simple
                        ? parseRelease(f.name.split("/").pop() ?? f.name).title
                        : f.name.split("/").pop()}
                    </span>
                    {f.size > 0 && (
                      <span className="flex-none text-[11px] text-zinc-400">
                        {formatSize(f.size)}
                      </span>
                    )}
                    <DebridActions links={[f.link]} groupKey={f.link} debrid={debrid} />
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
