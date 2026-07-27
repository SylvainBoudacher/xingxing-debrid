import { MangaMatchModal } from "@/components/MangaMatchModal";
import { MangaReleaseRow } from "@/components/MangaReleaseRow";
import { NetworkErrorState } from "@/components/NetworkErrorState";
import { Button } from "@/components/ui/button";
import { aliasesFor } from "@/lib/mangaAliases";
import { mangaCoverUrl, MANGA_STATUS_LABELS, type MangaItem } from "@/lib/mangaItem";
import type { MangaEntry } from "@/lib/mangaLibrary";
import { mangaReleasesQueryKey, searchMangaReleases, type MangaRelease } from "@/lib/mangaReleases";
import { networkErrorMessage } from "@/lib/networkError";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface MangaReleasesModalProps {
  item: MangaItem;
  entry: MangaEntry | null;
  getC411Key: () => string;
  addingHash: string | null;
  onAdd: (release: MangaRelease, item: MangaItem) => void;
  onOpenLibrary: (mangaId: string) => void;
  onClose: () => void;
}

// Fiche d'une oeuvre : metadonnees MangaDex et releases C411 trouvees pour
// elle. Quand rien ne matche, l'arbitrage manuel prend le relais.
export function MangaReleasesModal({
  item,
  entry,
  getC411Key,
  addingHash,
  onAdd,
  onOpenLibrary,
  onClose,
}: MangaReleasesModalProps) {
  const [matching, setMatching] = useState(false);

  // Vrai quand l'arbitrage manuel (MangaMatchModal) est ouvert par-dessus :
  // neutralise Escape ici, il ferme d'abord ce dernier.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !matching && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, matching]);

  const releasesQuery = useQuery({
    queryKey: mangaReleasesQueryKey(item.id),
    staleTime: 60_000,
    queryFn: () => searchMangaReleases(item, aliasesFor(item.id), getC411Key()),
  });

  const releases = releasesQuery.data?.releases ?? null;
  const cover = mangaCoverUrl(item, 512);
  const owned = new Set(entry?.volumes.map((v) => v.infoHash) ?? []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl ring-1 ring-black/10 dark:ring-white/10 overflow-hidden shadow-2xl"
      >
        <div className="flex items-start gap-4 px-5 pt-5 pb-4">
          {cover && (
            <img
              src={cover}
              alt=""
              className="h-24 w-16 shrink-0 rounded-lg object-cover ring-1 ring-black/10 dark:ring-white/10"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
              Versions disponibles
            </p>
            <p className="text-base font-semibold text-zinc-900 dark:text-white leading-snug">
              {item.title}
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
              {[
                item.year,
                MANGA_STATUS_LABELS[item.status],
                item.lastVolume ? `${item.lastVolume} tomes` : null,
              ]
                .filter(Boolean)
                .map((meta) => (
                  <span key={String(meta)}>{meta}</span>
                ))}
            </div>
            {entry && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2.5"
                onClick={() => onOpenLibrary(item.id)}
              >
                <BookOpen />
                {entry.volumes.length} tome{entry.volumes.length > 1 ? "s" : ""} en bibliothèque
              </Button>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {item.description && (
          <p className="mx-5 mb-4 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-4">
            {item.description}
          </p>
        )}

        <div className="h-[32rem] max-h-[65vh] overflow-y-auto px-3 pb-3 space-y-1.5">
          {releasesQuery.isPending &&
            Array.from({ length: 6 }, (_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: i * 0.07 }}
                className="flex items-center gap-4 rounded-xl bg-white/80 dark:bg-zinc-800/60 px-4 py-3"
              >
                <div className="min-w-0 flex-1 animate-pulse">
                  <div className="mb-2 flex items-center gap-1.5">
                    <div className="h-[18px] w-16 rounded-md bg-zinc-300/70 dark:bg-zinc-700/70" />
                    <div className="h-[18px] w-10 rounded-md bg-zinc-300/70 dark:bg-zinc-700/70" />
                  </div>
                  <div className="mb-2 flex items-center gap-3">
                    <div className="h-3 w-14 rounded bg-zinc-300/70 dark:bg-zinc-700/70" />
                    <div className="h-3 w-20 rounded bg-zinc-300/70 dark:bg-zinc-700/70" />
                  </div>
                  <div className="h-2.5 w-3/4 rounded bg-zinc-300/40 dark:bg-zinc-700/40" />
                </div>
                <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-300/70 dark:bg-zinc-700/70 animate-pulse" />
              </motion.div>
            ))}

          {releasesQuery.isError && (
            <div className="flex h-full items-center justify-center">
              <NetworkErrorState
                message={networkErrorMessage(releasesQuery.error)}
                onRetry={() => releasesQuery.refetch()}
              />
            </div>
          )}

          {releases !== null && releases.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-5 px-6">
              <p className="text-center text-sm text-zinc-500">
                Aucune release C411 trouvée pour « {item.title} ».
              </p>
              <div className="flex flex-col items-center gap-3">
                <p className="max-w-xs text-center text-xs text-zinc-400 dark:text-zinc-500">
                  Les scans français portent souvent le titre de l'édition française, que MangaDex
                  ne connaît pas toujours.
                </p>
                <Button variant="outline" size="sm" onClick={() => setMatching(true)}>
                  Chercher moi-même sur C411
                </Button>
              </div>
            </div>
          )}

          {releases?.map((release, i) => (
            <MangaReleaseRow
              key={release.infoHash}
              release={release}
              index={i}
              owned={owned.has(release.infoHash)}
              busy={addingHash === release.infoHash}
              disabled={addingHash !== null}
              onAdd={() => onAdd(release, item)}
            />
          ))}
        </div>

        {releases !== null && releases.length > 0 && (
          <div className="border-t border-black/5 px-4 py-2.5 text-center dark:border-white/5">
            <button
              onClick={() => setMatching(true)}
              className="text-xs text-zinc-500 underline-offset-2 transition-colors hover:text-indigo-500 hover:underline"
            >
              Il manque des tomes ? Chercher sur C411 avec un autre titre
            </button>
          </div>
        )}
      </motion.div>

      {matching && (
        <MangaMatchModal
          item={item}
          getC411Key={getC411Key}
          addingHash={addingHash}
          onAdd={onAdd}
          onAliasSaved={() => releasesQuery.refetch()}
          onClose={() => setMatching(false)}
        />
      )}
    </motion.div>
  );
}
