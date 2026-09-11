import { ReleaseTagBadges } from "@/components/ReleaseTagBadges";
import { formatSize } from "@/lib/debrid";
import { type Occupant } from "@/lib/discoverReleases";
import { Loader2, Plus } from "lucide-react";
import { motion } from "motion/react";

interface DiscoverReleaseRowProps {
  occ: Occupant;
  index: number;
  isTv: boolean;
  sendingHash: string | null;
  libraryHash: string | null;
  onSend: (occ: Occupant, addToLibrary: boolean) => void;
}

// Une release C411 dans la fiche : badges (portée, qualité, langues…),
// métadonnées et actions bibliothèque / téléchargement.
export function DiscoverReleaseRow({
  occ,
  index,
  isTv,
  sendingHash,
  libraryHash,
  onSend,
}: DiscoverReleaseRowProps) {
  const busy = sendingHash !== null || libraryHash !== null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: Math.min(index * 0.04, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="flex items-center gap-4 rounded-xl bg-white/80 dark:bg-zinc-800/60 px-4 py-3"
    >
      <div className="min-w-0 flex-1">
        <ReleaseTagBadges tags={occ} showScope={isTv} className="mb-1" />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
          <span className="text-zinc-600 dark:text-zinc-300 font-medium">
            {formatSize(occ.fileSize)}
          </span>
          <span className="text-green-500">{occ.seeders} Seeders</span>
          {occ.source && <span>{occ.source}</span>}
          {occ.audioCodec && (
            <span>
              {occ.audioCodec}
              {occ.audioChannels ? ` ${occ.audioChannels}` : ""}
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-600 truncate">
          {occ.torrentName}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSend(occ, true)}
          disabled={busy}
          title="Ajouter à la bibliothèque"
          className="flex h-8 items-center gap-1.5 rounded-full bg-indigo-600/90 pl-2.5 pr-3.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {libraryHash === occ.infoHash ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          )}
          Ajouter
        </motion.button>
      </div>
    </motion.div>
  );
}
