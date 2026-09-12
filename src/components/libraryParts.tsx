import { motion } from "motion/react";
import { Check, ChevronDown, Copy, Download, Loader2, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import vlcLogo from "@/assets/vlc.png";
import { episodeLabel } from "@/lib/library";
import type { DebridFile } from "@/lib/debrid";

export interface DebridControls {
  bulkDownloading: string | null;
  bulkCopying: string | null;
  bulkVlc: string | null;
  downloadMany: (links: string[], groupKey: string) => void;
  copyMany: (links: string[], groupKey: string) => void;
  openVlcMany: (links: string[], groupKey: string) => void;
}

export function DebridActions({
  links,
  groupKey,
  debrid,
  onVlcClick,
  vlc = true,
  label,
}: {
  links: string[];
  groupKey: string;
  debrid: DebridControls;
  onVlcClick?: () => void;
  // Masque le bouton VLC quand la lecture passe par un autre contrôle.
  vlc?: boolean;
  // Bouton de téléchargement libellé (bandeau de la fiche) plutôt qu'une icône.
  label?: string;
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
      {vlc && (
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
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileTap={{ scale: 0.95 }}
            title="Télécharger ou copier"
            disabled={downloading}
            className={
              label
                ? "flex h-9 flex-none items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
                : "flex h-7 flex-none items-center gap-0.5 rounded-lg bg-indigo-600 pl-2 pr-1.5 transition-colors hover:bg-indigo-500 disabled:opacity-40"
            }
          >
            {downloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            ) : (
              <Download className="h-3.5 w-3.5 text-white" />
            )}
            {label}
            <ChevronDown className="h-3 w-3 text-white/70" />
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Le bouton VLC dédié est masqué ici : l'action reste accessible. */}
          {!vlc && (
            <DropdownMenuItem
              onClick={() => {
                debrid.openVlcMany(links, groupKey);
                onVlcClick?.();
              }}
              disabled={vlcing}
            >
              {vlcing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <img src={vlcLogo} className="h-4 w-4" alt="" />
              )}
              {multi ? "Tout lire avec VLC" : "Lire avec VLC"}
            </DropdownMenuItem>
          )}
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
            {multi ? "Partager les liens" : "Partager le lien"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function SelectionBox({ checked }: { checked: boolean }) {
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
      title={checked ? "Marquer comme non vu" : "Marquer comme vu"}
      className={`group flex h-5 w-5 flex-none items-center justify-center rounded-md ring-1 transition-colors ${
        checked
          ? "bg-emerald-500 ring-emerald-500 text-white"
          : "bg-transparent ring-black/20 hover:bg-emerald-500/15 hover:ring-emerald-400 dark:ring-white/20"
      }`}
    >
      <Check
        className={`h-3.5 w-3.5 transition-opacity ${
          checked
            ? "opacity-100"
            : "text-emerald-500 opacity-0 group-hover:opacity-60 dark:text-emerald-400"
        }`}
        strokeWidth={3}
      />
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
