import { MangaMatchModal } from "@/components/MangaMatchModal";
import { NetworkErrorState } from "@/components/NetworkErrorState";
import { Button } from "@/components/ui/button";
import { formatSize } from "@/lib/debrid";
import { aliasesFor } from "@/lib/mangaAliases";
import { mangaCoverUrl, MANGA_STATUS_LABELS, type MangaItem } from "@/lib/mangaItem";
import type { MangaEntry } from "@/lib/mangaLibrary";
import { mangaReleasesQueryKey, searchMangaReleases, type MangaRelease } from "@/lib/mangaReleases";
import { networkErrorMessage } from "@/lib/networkError";
import { spanLabel } from "@/lib/parseVolume";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Loader2, Plus, SearchX, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

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
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950"
      >
        <div className="flex items-start gap-4 border-b border-black/5 p-5 dark:border-white/5">
          {cover && (
            <img
              src={cover}
              alt={item.title}
              className="h-32 w-22 shrink-0 rounded-lg object-cover ring-1 ring-black/10 dark:ring-white/10"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{item.title}</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {[
                item.year,
                MANGA_STATUS_LABELS[item.status],
                item.lastVolume ? `${item.lastVolume} tomes` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {item.description && (
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {item.description}
              </p>
            )}
            {entry && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
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
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {releasesQuery.isPending ? (
            <div className="flex justify-center py-12 text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : releasesQuery.isError ? (
            <NetworkErrorState
              className="py-12"
              message={networkErrorMessage(releasesQuery.error)}
              onRetry={() => releasesQuery.refetch()}
            />
          ) : releases && releases.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {releases.map((release) => (
                <ReleaseRow
                  key={release.infoHash}
                  release={release}
                  owned={owned.has(release.infoHash)}
                  busy={addingHash === release.infoHash}
                  disabled={addingHash !== null}
                  onAdd={() => onAdd(release, item)}
                />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <SearchX className="h-8 w-8 text-zinc-400" />
              <p className="text-sm text-zinc-500">
                Aucune release C411 trouvée pour « {item.title} ».
              </p>
              <p className="max-w-sm text-xs text-zinc-400">
                Les scans français portent souvent le titre de l'édition française, que MangaDex ne
                connaît pas toujours.
              </p>
              <Button variant="outline" size="sm" onClick={() => setMatching(true)}>
                Chercher moi-même sur C411
              </Button>
            </div>
          )}
        </div>

        {releases && releases.length > 0 && (
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

function ReleaseRow({
  release,
  owned,
  busy,
  disabled,
  onAdd,
}: {
  release: MangaRelease;
  owned: boolean;
  busy: boolean;
  disabled: boolean;
  onAdd: () => void;
}) {
  const readable = release.format === "CBZ" || release.format === null;
  return (
    <li className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-zinc-700 dark:text-zinc-300">{release.torrentName}</p>
        <p className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="font-medium text-zinc-600 dark:text-zinc-400">
            {spanLabel(release.span)}
          </span>
          <span>{formatSize(release.size)}</span>
          <span>{release.seeders} seeders</span>
          {release.format && release.format !== "CBZ" && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-medium text-amber-600 dark:text-amber-400">
              {release.format} — non lisible
            </span>
          )}
          {!release.exact && (
            <span className="rounded bg-zinc-500/15 px-1.5 py-0.5 text-zinc-500">
              série dérivée ?
            </span>
          )}
        </p>
      </div>
      <Button
        size="sm"
        variant={owned ? "outline" : "default"}
        disabled={disabled || !readable}
        onClick={onAdd}
      >
        {busy ? <Loader2 className="animate-spin" /> : <Plus />}
        {owned ? "Déjà ajouté" : "Ajouter"}
      </Button>
    </li>
  );
}
