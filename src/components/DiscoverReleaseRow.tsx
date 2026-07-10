import { formatSize } from "@/lib/debrid";
import { scopeLabel, type Occupant } from "@/lib/discoverReleases";
import { BookmarkPlus, Download, Loader2 } from "lucide-react";
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
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          {isTv && occ.scope && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                occ.scope.kind === "episode"
                  ? "bg-sky-500/12 text-sky-600 dark:text-sky-400"
                  : "bg-fuchsia-500/12 text-fuchsia-700 dark:text-fuchsia-400"
              }`}
            >
              {scopeLabel(occ.scope)}
            </span>
          )}
          {occ.resolution && (
            <span className="rounded-md bg-indigo-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
              {occ.resolution}
            </span>
          )}
          {occ.videoCodec && (
            <span className="rounded-md bg-black/6 dark:bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {occ.videoCodec}
            </span>
          )}
          {occ.specialVersion && (
            <span className="rounded-md bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              {occ.specialVersion}
            </span>
          )}
          {occ.languages.map((l) => (
            <span
              key={l}
              className="rounded-md bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-600 dark:text-green-400"
            >
              {l}
            </span>
          ))}
        </div>
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
        <div className="group relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSend(occ, true)}
            disabled={busy}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/8 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {libraryHash === occ.infoHash ? (
              <Loader2 className="h-4 w-4 text-indigo-600 dark:text-indigo-300 animate-spin" />
            ) : (
              <BookmarkPlus className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
            )}
          </motion.button>
          <span className="pointer-events-none absolute right-0 bottom-full mb-2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 ring-1 ring-black/10 dark:ring-white/10 shadow-lg opacity-0 transition-opacity duration-150 delay-500 group-hover:opacity-100">
            Ajouter à la bibliothèque
          </span>
        </div>
        <div className="group relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSend(occ, false)}
            disabled={busy}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/80 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {sendingHash === occ.infoHash ? (
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            ) : (
              <Download className="h-4 w-4 text-white" />
            )}
          </motion.button>
          <span className="pointer-events-none absolute right-0 bottom-full mb-2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 ring-1 ring-black/10 dark:ring-white/10 shadow-lg opacity-0 transition-opacity duration-150 delay-500 group-hover:opacity-100">
            Télécharger
          </span>
        </div>
      </div>
    </motion.div>
  );
}
