import { AppMenu, type Page } from "@/components/AppMenu";
import { MangaPosterCard } from "@/components/MangaPosterCard";
import { MangaReleasesModal } from "@/components/MangaReleasesModal";
import { NetworkErrorState } from "@/components/NetworkErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MangaItem } from "@/lib/mangaItem";
import { getCachedMangaLibrary, loadMangaLibrary, type MangaEntry } from "@/lib/mangaLibrary";
import { networkErrorMessage } from "@/lib/networkError";
import { MANGA_FEEDS, type MangaFeed } from "@/lib/services/mangadex";
import { useAddMangaRelease } from "@/lib/useAddMangaRelease";
import { MANGA_FEED_LABELS, useMangaFeed } from "@/lib/useMangaFeed";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Library, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface MangaDiscoverPageProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  hasPendingUpdate: boolean;
  onShowPendingUpdate: () => void;
  getC411Key: () => string;
  getAllDebridKey: () => string;
  /** Ouvre la bibliotheque manga sur l'oeuvre donnee. */
  onOpenLibrary: (mangaId: string) => void;
}

export function MangaDiscoverPage({
  onBack,
  onNavigate,
  hasPendingUpdate,
  onShowPendingUpdate,
  getC411Key,
  getAllDebridKey,
  onOpenLibrary,
}: MangaDiscoverPageProps) {
  const feed = useMangaFeed();
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
      setEntries((prev) => {
        const without = prev.filter((e) => e.mangaId !== entry.mangaId);
        return [...without, entry];
      });
    }, []),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !selected) onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack, selected]);

  return (
    <main className="relative flex min-h-screen flex-col bg-[#f4f6fc] bg-[radial-gradient(ellipse_70%_45%_at_50%_20%,_#d7e0fb_0%,_#edf1fa_45%,_#fafbfe_75%)] dark:bg-black dark:bg-[radial-gradient(ellipse_70%_45%_at_50%_20%,_#0c1d56_0%,_#04091a_45%,_#000000_75%)]">
      <div className="sticky top-0 z-10 border-b border-black/5 bg-white/60 backdrop-blur-xl dark:border-white/5 dark:bg-black/30">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onBack}
            className="flex items-center gap-1.5 text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </motion.button>

          <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
            Mangas
          </h1>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onNavigate("mangalibrary")}>
              <Library />
              Bibliothèque
            </Button>
            <AppMenu
              currentPage="manga"
              onNavigate={onNavigate}
              onBack={onBack}
              hasPendingUpdate={hasPendingUpdate}
              onShowPendingUpdate={onShowPendingUpdate}
            />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 pb-4 sm:px-8">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={feed.query}
              onChange={(e) => feed.setQuery(e.target.value)}
              placeholder="Rechercher un manga..."
              className="pl-9"
            />
          </div>

          {!feed.query.trim() && (
            <div className="flex gap-1.5">
              {MANGA_FEEDS.map((f) => (
                <FeedTab
                  key={f}
                  feed={f}
                  active={feed.feed === f}
                  onSelect={() => feed.setFeed(f)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-6 sm:px-8">
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
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
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
      </div>

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
    </main>
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
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-indigo-600 text-white"
          : "text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
      }`}
    >
      {MANGA_FEED_LABELS[feed]}
    </button>
  );
}
