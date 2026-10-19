import { formatSize } from "@/lib/debrid";
import type { Occupant } from "@/lib/discoverReleases";
import { availability, languageLabel, type Availability, type QuickPick } from "@/lib/releasePicks";
import { Loader2, Plus } from "lucide-react";
import { motion } from "motion/react";

const AVAILABILITY: Record<Availability, { label: string; dot: string }> = {
  fast: { label: "rapide", dot: "bg-green-500" },
  ok: { label: "correcte", dot: "bg-amber-400" },
  slow: { label: "lente", dot: "bg-rose-500" },
};

interface DiscoverQuickPickCardProps {
  pick: QuickPick;
  index: number;
  sendingHash: string | null;
  libraryHash: string | null;
  onSend: (occ: Occupant, addToLibrary: boolean) => void;
}

// Carte de choix rapide : une résolution, sa meilleure version, un bouton.
export function DiscoverQuickPickCard({
  pick,
  index,
  sendingHash,
  libraryHash,
  onSend,
}: DiscoverQuickPickCardProps) {
  const { occ } = pick;
  const busy = sendingHash !== null || libraryHash !== null;
  const avail = AVAILABILITY[availability(occ.seeders)];
  const lang = languageLabel(occ.languages);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-3 rounded-xl bg-white/80 dark:bg-zinc-800/60 p-4 ring-1 ring-black/5 dark:ring-white/5"
    >
      <div>
        <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {pick.label}
        </p>
        <p className="mt-1 flex flex-wrap gap-x-2 text-xs text-zinc-600 dark:text-zinc-300">
          <span className="font-medium">{formatSize(occ.fileSize)}</span>
          {lang && <span className="text-zinc-500">{lang}</span>}
        </p>
        <p
          className="mt-1.5 flex items-center gap-1.5 text-[11px] text-zinc-500"
          title={`${occ.seeders} seeders`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${avail.dot}`} />
          Disponibilité {avail.label}
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onSend(occ, true)}
        disabled={busy}
        title={occ.torrentName}
        className="mt-auto flex h-9 items-center justify-center gap-1.5 rounded-full bg-indigo-600/90 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {libraryHash === occ.infoHash ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        )}
        Ajouter
      </motion.button>
    </motion.div>
  );
}
