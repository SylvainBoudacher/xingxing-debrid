import { formatSize } from "@/lib/debrid";
import type { MangaRelease } from "@/lib/mangaReleases";
import { spanLabel } from "@/lib/parseVolume";
import { BookmarkPlus, Check, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface MangaReleaseRowProps {
  release: MangaRelease;
  index: number;
  owned: boolean;
  busy: boolean;
  disabled: boolean;
  onAdd: () => void;
}

// Une release C411 dans la fiche manga : badges (tomes, format, doute sur la
// série), métadonnées et ajout à la bibliothèque.
export function MangaReleaseRow({
  release,
  index,
  owned,
  busy,
  disabled,
  onAdd,
}: MangaReleaseRowProps) {
  const readable = release.format === "CBZ" || release.format === null;
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
          <span className="rounded-md bg-indigo-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
            {spanLabel(release.span)}
          </span>
          {owned && (
            <span className="flex items-center gap-1 rounded-md bg-emerald-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              <Check className="h-2.5 w-2.5" />
              Dans la bibliothèque
            </span>
          )}
          {release.format && !readable && (
            <span className="rounded-md bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              {release.format} — non lisible
            </span>
          )}
          {!release.exact && (
            <span className="rounded-md bg-black/6 dark:bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              série dérivée ?
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
          <span className="text-zinc-600 dark:text-zinc-300 font-medium">
            {formatSize(release.size)}
          </span>
          <span className="text-green-500">{release.seeders} Seeders</span>
        </div>
        <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-600 truncate">
          {release.torrentName}
        </p>
      </div>
      <div className="group relative shrink-0">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onAdd}
          disabled={disabled || !readable}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/80 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 text-white animate-spin" />
          ) : owned ? (
            <Check className="h-4 w-4 text-white" />
          ) : (
            <BookmarkPlus className="h-4 w-4 text-white" />
          )}
        </motion.button>
        <span className="pointer-events-none absolute right-0 bottom-full mb-2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 ring-1 ring-black/10 dark:ring-white/10 shadow-lg opacity-0 transition-opacity duration-150 delay-500 group-hover:opacity-100">
          {!readable ? "Format non lisible" : owned ? "Déjà ajouté" : "Ajouter à la bibliothèque"}
        </span>
      </div>
    </motion.div>
  );
}
