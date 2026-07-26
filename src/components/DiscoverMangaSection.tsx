import { MangaPosterCard } from "@/components/MangaPosterCard";
import { MangaReleasesModal } from "@/components/MangaReleasesModal";
import { NetworkErrorState } from "@/components/NetworkErrorState";
import { Button } from "@/components/ui/button";
import type { MangaItem } from "@/lib/mangaItem";
import { getCachedMangaLibrary, loadMangaLibrary, type MangaEntry } from "@/lib/mangaLibrary";
import { networkErrorMessage } from "@/lib/networkError";
import { MANGA_FEEDS, type MangaFeed } from "@/lib/services/mangadex";
import { useAddMangaRelease } from "@/lib/useAddMangaRelease";
import { MANGA_FEED_LABELS, useMangaFeed } from "@/lib/useMangaFeed";
import { Loader2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface DiscoverMangaSectionProps {
  /** Requete saisie dans la barre de recherche de la page. */
  query: string;
  getC411Key: () => string;
  getAllDebridKey: () => string;
  /** Ouvre la bibliotheque manga sur l'oeuvre donnee. */
  onOpenLibrary: (mangaId: string) => void;
}

// Onglet "Mangas" de la page Découverte : recherche MangaDex, sources
// (Populaires, Nouveautés…) et grille de jaquettes.
export function DiscoverMangaSection({
  query,
  getC411Key,
  getAllDebridKey,
  onOpenLibrary,
}: DiscoverMangaSectionProps) {
  const feed = useMangaFeed(query);
  const [selected, setSelected] = useState<MangaItem | null>(null);
  const [entries, setEntries] = useState<MangaEntry[]>(() => getCachedMangaLibrary() ?? []);

  useEffect(() => {
    if (getCachedMangaLibrary() === null) void loadMangaLibrary().then(setEntries);
  }, []);

  const byId = useMemo(() => new Map(entries.map((e) => [e.mangaId, e])), [entries]);

  const { addingHash, addRelease } = useAddMangaRelease({
    getC411Key,
    getAllDebridKey,
    onAdded: useCallback((entry: MangaEntry) => {
      setEntries((prev) => [...prev.filter((e) => e.mangaId !== entry.mangaId), entry]);
    }, []),
    onOpenLibrary,
  });

  return (
    <>
      <div className="mb-6 flex flex-wrap justify-center gap-1.5">
        {!query.trim() &&
          MANGA_FEEDS.map((f) => (
            <FeedTab key={f} feed={f} active={feed.feed === f} onSelect={() => feed.setFeed(f)} />
          ))}
      </div>

      {feed.loading ? (
        <div className="flex justify-center py-24 text-zinc-400">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : feed.error ? (
        <NetworkErrorState
          className="py-24"
          message={networkErrorMessage(feed.error)}
          onRetry={feed.retry}
        />
      ) : feed.items.length === 0 ? (
        <p className="py-24 text-center text-sm text-zinc-500">Aucun manga trouvé.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            {feed.items.map((item, i) => {
              const entry = byId.get(item.id);
              return (
                <MangaPosterCard
                  key={item.id}
                  item={item}
                  index={i}
                  progress={
                    entry
                      ? {
                          total: entry.volumes.length,
                          read: entry.volumes.filter((v) => v.read).length,
                        }
                      : null
                  }
                  onOpen={setSelected}
                />
              );
            })}
          </div>

          {feed.hasMore && (
            <div className="flex justify-center py-8">
              <Button variant="outline" onClick={feed.loadMore} disabled={feed.loadingMore}>
                {feed.loadingMore && <Loader2 className="animate-spin" />}
                Charger plus
              </Button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {selected && (
          <MangaReleasesModal
            item={selected}
            entry={byId.get(selected.id) ?? null}
            getC411Key={getC411Key}
            addingHash={addingHash}
            onAdd={addRelease}
            onOpenLibrary={onOpenLibrary}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function FeedTab({
  feed,
  active,
  onSelect,
}: {
  feed: MangaFeed;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 transition-colors ${
        active
          ? "bg-indigo-600 text-white ring-indigo-500"
          : "bg-white/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 ring-black/10 dark:ring-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white"
      }`}
    >
      {MANGA_FEED_LABELS[feed]}
    </button>
  );
}
