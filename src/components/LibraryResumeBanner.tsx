import { LibraryResumeCard } from "@/components/LibraryResumeCard";
import type { DebridControls } from "@/components/libraryParts";
import type { LibraryEntry } from "@/lib/library";
import { getCachedResume, resumeTargets, subscribeResume } from "@/lib/resumeWatch";
import { useSeriesFolders } from "@/lib/useSeriesFolderConfig";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useSyncExternalStore } from "react";

interface LibraryResumeBannerProps {
  entries: LibraryEntry[];
  onOpen: (hash: string | null, groupId: number | null) => void;
  onChange: (entry: LibraryEntry) => void;
  debrid: DebridControls;
  autoWatchOnPlay: boolean;
  simple: boolean;
  tmdbKey?: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

// Bandeau « Reprendre » : le prochain épisode non vu des dernières séries
// lancées. Chaque prochain épisode est recalculé à chaque rendu, donc une série
// sort d'elle-même du bandeau dès qu'elle est terminée ou quitte la
// bibliothèque.
export function LibraryResumeBanner({
  entries,
  onOpen,
  onChange,
  debrid,
  autoWatchOnPlay,
  simple,
  tmdbKey,
  collapsed,
  onToggleCollapsed,
}: LibraryResumeBannerProps) {
  const refs = useSyncExternalStore(subscribeResume, getCachedResume);
  const folders = useSeriesFolders();
  const targets = useMemo(() => resumeTargets(entries, refs, folders), [entries, refs, folders]);

  if (targets.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="mb-4"
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        title={collapsed ? "Déplier la reprise" : "Replier la reprise"}
        className="group mb-2 flex items-center gap-2"
      >
        <motion.span animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300" />
        </motion.span>
        <span className="text-sm font-semibold text-zinc-700 transition-colors group-hover:text-zinc-900 dark:text-zinc-200 dark:group-hover:text-white">
          Reprendre
        </span>
        <span className="rounded-full bg-black/8 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
          {targets.length}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {/* Toujours trois colonnes : une reprise seule occupe un tiers de
            la largeur, et la rangée garde la même allure quel que soit leur
            nombre. La fenêtre fait au moins 900px de large (tauri.conf.json). */}
            <div className="grid grid-cols-3 gap-3">
              {targets.map((target) => (
                <LibraryResumeCard
                  key={
                    target.subject.kind === "group"
                      ? `g${target.subject.group.tmdbId}`
                      : target.subject.entry.infoHash
                  }
                  target={target}
                  onOpen={onOpen}
                  onChange={onChange}
                  debrid={debrid}
                  autoWatchOnPlay={autoWatchOnPlay}
                  simple={simple}
                  tmdbKey={tmdbKey}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
