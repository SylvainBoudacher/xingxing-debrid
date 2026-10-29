import { AVAILABILITY } from "@/components/availabilityStyles";
import { CHIP_TRACK, chipClass } from "@/components/chipStyles";
import { formatSize } from "@/lib/debrid";
import type { Occupant } from "@/lib/discoverReleases";
import { availability, languageLabel, type EpisodePicks } from "@/lib/releasePicks";
import { Loader2, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface DiscoverEpisodePickRowProps {
  entry: EpisodePicks;
  index: number;
  sendingHash: string | null;
  libraryHash: string | null;
  onSend: (occ: Occupant, addToLibrary: boolean) => void;
}

// Ligne d'un épisode : choix de la résolution, sa meilleure version, un bouton.
export function DiscoverEpisodePickRow({
  entry,
  index,
  sendingHash,
  libraryHash,
  onSend,
}: DiscoverEpisodePickRowProps) {
  const [selected, setSelected] = useState(0);
  const current = Math.min(selected, entry.picks.length - 1);
  const { occ } = entry.picks[current];
  const busy = sendingHash !== null || libraryHash !== null;
  const avail = AVAILABILITY[availability(occ.seeders)];
  const lang = languageLabel(occ.languages);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 10) * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 rounded-xl bg-white/80 dark:bg-zinc-800/60 px-4 py-3 ring-1 ring-black/5 dark:ring-white/5"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
            Épisode {entry.episode}
          </p>
          {entry.picks.length > 1 && (
            <div className={CHIP_TRACK}>
              {entry.picks.map((pick, i) => (
                <button
                  key={pick.occ.infoHash}
                  onClick={() => setSelected(i)}
                  className={`${chipClass(i === current)} font-semibold`}
                >
                  {pick.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-zinc-600 dark:text-zinc-300">
          {entry.picks.length === 1 && (
            <span className="font-semibold">{entry.picks[0].label}</span>
          )}
          <span className="font-medium">{formatSize(occ.fileSize)}</span>
          {lang && <span className="text-zinc-500">{lang}</span>}
          <span
            className="flex items-center gap-1.5 text-[11px] text-zinc-500"
            title={`${occ.seeders} seeders`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${avail.dot}`} />
            Disponibilité {avail.label}
          </span>
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onSend(occ, true)}
        disabled={busy}
        title={occ.torrentName}
        className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full bg-indigo-600/90 px-4 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
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
