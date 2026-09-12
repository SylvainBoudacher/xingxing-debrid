import { LibraryResumeCard } from "@/components/LibraryResumeCard";
import type { DebridControls } from "@/components/libraryParts";
import type { LibraryEntry } from "@/lib/library";
import { getCachedResume, resumeTargets, subscribeResume } from "@/lib/resumeWatch";
import { useSeriesFolders } from "@/lib/useSeriesFolderConfig";
import { motion } from "motion/react";
import { useMemo, useSyncExternalStore } from "react";

interface LibraryResumeBannerProps {
  entries: LibraryEntry[];
  onOpen: (hash: string | null, groupId: number | null) => void;
  onChange: (entry: LibraryEntry) => void;
  debrid: DebridControls;
  autoWatchOnPlay: boolean;
  simple: boolean;
  tmdbKey?: string;
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
      <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">Reprendre</p>
      {/* Toujours trois colonnes : une reprise seule occupe un tiers de la
      largeur, et la rangée garde la même allure quel que soit leur nombre.
      La fenêtre fait au moins 900px de large (tauri.conf.json). */}
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
  );
}
