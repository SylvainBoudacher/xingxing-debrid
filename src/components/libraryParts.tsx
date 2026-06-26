import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown, Copy, Download, Loader2, Play } from "lucide-react";
import vlcLogo from "@/assets/vlc.png";
import { formatSize } from "@/lib/debrid";
import { parseRelease } from "@/lib/parseRelease";
import {
  episodeLabel,
  groupBySeason,
  hasMultipleSeasons,
  isSeries,
  setFilesWatched,
  toggleFile,
  videoFiles,
  type LibraryEntry,
  type LibraryProvider,
  type SeasonGroup,
} from "@/lib/library";
import type { DebridFile } from "@/lib/debrid";

export interface DebridControls {
  bulkDownloading: string | null;
  bulkCopying: string | null;
  bulkVlc: string | null;
  downloadMany: (links: string[], groupKey: string) => void;
  copyMany: (links: string[], groupKey: string) => void;
  openVlcMany: (links: string[], groupKey: string) => void;
}

export const PROVIDER_LABEL: Record<LibraryProvider, string> = {
  c411: "C411",
  nyaa: "Nyaa",
  discover: "Découverte",
};

export const PROVIDER_CLASS: Record<LibraryProvider, string> = {
  c411: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 ring-indigo-500/20",
  nyaa: "bg-sky-500/10 text-sky-600 dark:text-sky-300 ring-sky-500/20",
  discover: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300 ring-fuchsia-500/20",
};

export function DebridActions({
  links,
  groupKey,
  debrid,
  onVlcClick,
}: {
  links: string[];
  groupKey: string;
  debrid: DebridControls;
  onVlcClick?: () => void;
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
        onClick={() => {
          debrid.openVlcMany(links, groupKey);
          onVlcClick?.();
        }}
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

export function Checkbox({ checked, onClick }: { checked: boolean; onClick: () => void }) {
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

function EpisodeLabel({ label, hideSeason }: { label: string; hideSeason: boolean }) {
  const m = label.match(/^(S\d+)(E\d+)$/);
  if (m) {
    if (hideSeason) {
      return (
        <span className="font-mono tracking-tight text-amber-500 dark:text-amber-400">{m[2]}</span>
      );
    }
    return (
      <span className="font-mono tracking-tight">
        <span className="text-indigo-400 dark:text-indigo-300">{m[1]}</span>
        <span className="text-amber-500 dark:text-amber-400">{m[2]}</span>
      </span>
    );
  }
  if (hideSeason) return null;
  return (
    <span className="font-mono tracking-tight text-indigo-400 dark:text-indigo-300">{label}</span>
  );
}

// Bouton « Reprendre » (lit le prochain épisode non vu via VLC).
export function ResumeButton({
  next,
  groupKey,
  debrid,
  onResume,
  started = true,
  hideSeason = false,
}: {
  next: DebridFile;
  groupKey: string;
  debrid: DebridControls;
  onResume: () => void;
  started?: boolean;
  hideSeason?: boolean;
}) {
  const resuming = debrid.bulkVlc === groupKey;
  const label = episodeLabel(next.name);
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      title={started ? "Reprendre l'épisode suivant" : "Lancer le premier épisode"}
      onClick={() => {
        debrid.openVlcMany([next.link], groupKey);
        onResume();
      }}
      disabled={resuming}
      className="flex h-7 flex-none items-center gap-1 rounded-lg px-2 text-xs font-medium text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 dark:text-emerald-400 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25"
    >
      {resuming ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Play className="h-3.5 w-3.5" />
      )}
      {started ? "Reprendre" : "Lancer"}
      {label ? <EpisodeLabel label={label} hideSeason={hideSeason} /> : null}
    </motion.button>
  );
}

function FileRow({
  file,
  entry,
  onChange,
  debrid,
  simple,
  autoWatchOnPlay,
}: {
  file: DebridFile;
  entry: LibraryEntry;
  onChange: (entry: LibraryEntry) => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay: boolean;
}) {
  const fileWatched = entry.watched[file.name] ?? false;
  return (
    <li className="flex items-center gap-3 px-4 py-2 pl-6 transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.04]">
      <Checkbox checked={fileWatched} onClick={() => onChange(toggleFile(entry, file.name))} />
      <span
        className={`min-w-0 flex-1 truncate text-xs ${fileWatched ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"}`}
      >
        {simple
          ? parseRelease(file.name.split("/").pop() ?? file.name).title
          : file.name.split("/").pop()}
      </span>
      {file.size > 0 && (
        <span className="flex-none text-[11px] text-zinc-400">{formatSize(file.size)}</span>
      )}
      <DebridActions
        links={[file.link]}
        groupKey={file.link}
        debrid={debrid}
        onVlcClick={
          autoWatchOnPlay && !fileWatched ? () => onChange(toggleFile(entry, file.name)) : undefined
        }
      />
    </li>
  );
}

function SeasonSection({
  group,
  entry,
  onChange,
  debrid,
  simple,
  autoWatchOnPlay,
}: {
  group: SeasonGroup;
  entry: LibraryEntry;
  onChange: (entry: LibraryEntry) => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay: boolean;
}) {
  const [open, setOpen] = useState(false);
  const names = group.files.map((f) => f.name);
  const links = group.files.map((f) => f.link);
  const seenCount = names.filter((n) => entry.watched[n]).length;
  const allSeen = seenCount === names.length;
  const label = group.season === null ? "Autres" : `Saison ${group.season}`;
  const groupKey = `${entry.infoHash}-s${group.season ?? "x"}`;
  const next = group.files.find((f) => !entry.watched[f.name]) ?? null;
  const resumeKey = `resume-${groupKey}`;

  return (
    <div>
      <div className="flex items-center gap-3 bg-black/[0.02] px-4 py-2 dark:bg-white/[0.03] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.06]">
        <Checkbox
          checked={allSeen}
          onClick={() => onChange(setFilesWatched(entry, names, !allSeen))}
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
                {seenCount}/{names.length}
              </span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.round((seenCount / names.length) * 100)}%` }}
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
        <DebridActions links={links} groupKey={groupKey} debrid={debrid} />
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
              {group.files.map((f) => (
                <FileRow
                  key={f.name}
                  file={f}
                  entry={entry}
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

// Corps épisodes/saisons d'une entrée série, partagé entre la carte liste et la
// modale de détail. Suppose que l'entrée est une série (isSeries === true).
export function EntryEpisodes({
  entry,
  onChange,
  debrid,
  simple,
  autoWatchOnPlay,
}: {
  entry: LibraryEntry;
  onChange: (entry: LibraryEntry) => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay: boolean;
}) {
  const vids = videoFiles(entry);
  const multiSeason = isSeries(entry) && hasMultipleSeasons(entry);

  return multiSeason ? (
    <div className="divide-y divide-black/5 dark:divide-white/10">
      {groupBySeason(vids).map((g) => (
        <SeasonSection
          key={g.season ?? "other"}
          group={g}
          entry={entry}
          onChange={onChange}
          debrid={debrid}
          simple={simple}
          autoWatchOnPlay={autoWatchOnPlay}
        />
      ))}
    </div>
  ) : (
    <ul className="divide-y divide-black/5 dark:divide-white/5">
      {vids.map((f) => (
        <FileRow
          key={f.name}
          file={f}
          entry={entry}
          onChange={onChange}
          debrid={debrid}
          simple={simple}
          autoWatchOnPlay={autoWatchOnPlay}
        />
      ))}
    </ul>
  );
}
