import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown, Copy, Download, Loader2, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const multi = links.length > 1;
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileTap={{ scale: 0.9 }}
            title="Télécharger ou copier"
            disabled={downloading}
            className="flex h-7 flex-none items-center gap-0.5 rounded-lg bg-indigo-600 pl-2 pr-1.5 transition-colors hover:bg-indigo-500 disabled:opacity-40"
          >
            {downloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            ) : (
              <Download className="h-3.5 w-3.5 text-white" />
            )}
            <ChevronDown className="h-3 w-3 text-white/70" />
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => debrid.downloadMany(links, groupKey)}
            disabled={downloading}
          >
            <Download className="h-4 w-4" />
            {multi ? "Tout télécharger" : "Télécharger"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => debrid.copyMany(links, groupKey)} disabled={copying}>
            {copying ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {multi ? "Copier les liens" : "Copier le lien"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Sélection multiple pour téléchargement, pilotée par la modale de détail.
// Quand fournie, les lignes affichent une case de sélection (indigo) au lieu de
// la case « vu » et masquent les actions par épisode.
export interface EpisodeSelection {
  has: (link: string) => boolean;
  toggle: (link: string) => void;
  setMany: (links: string[], selected: boolean) => void;
}

function SelectionBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 flex-none items-center justify-center rounded-md ring-1 transition-colors ${
        checked
          ? "bg-indigo-600 ring-indigo-500"
          : "bg-zinc-200 ring-black/10 dark:bg-zinc-800 dark:ring-white/10"
      }`}
    >
      {checked && <Check className="h-3 w-3 text-white" />}
    </span>
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
  selection,
}: {
  file: DebridFile;
  entry: LibraryEntry;
  onChange: (entry: LibraryEntry) => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay: boolean;
  selection?: EpisodeSelection;
}) {
  const fileWatched = entry.watched[file.name] ?? false;
  const name = simple
    ? parseRelease(file.name.split("/").pop() ?? file.name).title
    : file.name.split("/").pop();

  if (selection) {
    const sel = selection.has(file.link);
    return (
      <li
        onClick={() => selection.toggle(file.link)}
        className={`flex cursor-pointer items-center gap-3 px-4 py-2 pl-6 transition-colors ${
          sel ? "bg-indigo-500/10" : "hover:bg-black/[0.025] dark:hover:bg-white/[0.04]"
        }`}
      >
        <SelectionBox checked={sel} />
        <span className="min-w-0 flex-1 truncate text-xs text-zinc-700 dark:text-zinc-300">
          {name}
        </span>
        {file.size > 0 && (
          <span className="flex-none text-[11px] text-zinc-400">{formatSize(file.size)}</span>
        )}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 px-4 py-2 pl-6 transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.04]">
      <Checkbox checked={fileWatched} onClick={() => onChange(toggleFile(entry, file.name))} />
      <span
        className={`min-w-0 flex-1 truncate text-xs ${fileWatched ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"}`}
      >
        {name}
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
  selection,
}: {
  group: SeasonGroup;
  entry: LibraryEntry;
  onChange: (entry: LibraryEntry) => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay: boolean;
  selection?: EpisodeSelection;
}) {
  const [open, setOpen] = useState(false);
  const names = group.files.map((f) => f.name);
  const links = group.files.map((f) => f.link);
  const seenCount = names.filter((n) => entry.watched[n]).length;
  const allSeen = seenCount === names.length;
  const allSelected = !!selection && links.every((l) => selection.has(l));
  const label = group.season === null ? "Autres" : `Saison ${group.season}`;
  const groupKey = `${entry.infoHash}-s${group.season ?? "x"}`;
  const next = group.files.find((f) => !entry.watched[f.name]) ?? null;
  const resumeKey = `resume-${groupKey}`;

  return (
    <div>
      <div className="bg-black/[0.02] dark:bg-white/[0.03] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.06]">
        <div className="flex items-center gap-3 px-4 pt-2">
          {selection ? (
            <button onClick={() => selection.setMany(links, !allSelected)}>
              <SelectionBox checked={allSelected} />
            </button>
          ) : (
            <Checkbox
              checked={allSeen}
              onClick={() => onChange(setFilesWatched(entry, names, !allSeen))}
            />
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            title={open ? "Masquer les épisodes" : "Voir les épisodes"}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <span
              className={`truncate text-xs font-semibold ${allSeen ? "text-zinc-400 line-through dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-200"}`}
            >
              {label}
            </span>
            <span
              className={`flex h-5 flex-none items-center gap-1 rounded-md px-1.5 text-[11px] font-medium transition-colors ${
                open
                  ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
                  : "bg-black/5 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
              }`}
            >
              {seenCount}/{names.length}
              <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </span>
          </button>
          {!selection && next && (
            <ResumeButton
              next={next}
              groupKey={resumeKey}
              debrid={debrid}
              started={seenCount > 0}
              hideSeason
              onResume={() => autoWatchOnPlay && onChange(toggleFile(entry, next.name))}
            />
          )}
          {!selection && <DebridActions links={links} groupKey={groupKey} debrid={debrid} />}
        </div>
        <div className="px-4 pb-2 pt-1.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.round((seenCount / names.length) * 100)}%` }}
            />
          </div>
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
              {group.files.map((f) => (
                <FileRow
                  key={f.name}
                  file={f}
                  entry={entry}
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

// Corps épisodes/saisons d'une entrée série, partagé entre la carte liste et la
// modale de détail. Suppose que l'entrée est une série (isSeries === true).
export function EntryEpisodes({
  entry,
  onChange,
  debrid,
  simple,
  autoWatchOnPlay,
  selection,
}: {
  entry: LibraryEntry;
  onChange: (entry: LibraryEntry) => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay: boolean;
  selection?: EpisodeSelection;
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
          selection={selection}
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
          selection={selection}
        />
      ))}
    </ul>
  );
}
