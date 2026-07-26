import { AppMenu, type Page } from "@/components/AppMenu";
import { MangaEntryDetailModal } from "@/components/MangaEntryDetailModal";
import { MangaPosterCard } from "@/components/MangaPosterCard";
import { MangaReleasesModal } from "@/components/MangaReleasesModal";
import { volumeKey } from "@/components/MangaVolumeList";
import { Button } from "@/components/ui/button";
import { downloadVolume, forgetLocalFile } from "@/lib/mangaDownload";
import type { MangaItem } from "@/lib/mangaItem";
import {
  getCachedMangaLibrary,
  itemFromEntry,
  loadMangaLibrary,
  mangaProgress,
  nextVolume,
  removeMangaEntry,
  resolvePendingTorrent,
  setReadingDirection,
  updateVolume,
  volumesFromFiles,
  type MangaEntry,
  type MangaVolume,
  type ReadingDirection,
} from "@/lib/mangaLibrary";
import { toastNetworkError } from "@/lib/networkError";
import { fetchMagnetFiles, useAddMangaRelease } from "@/lib/useAddMangaRelease";
import { ReaderPage } from "@/pages/ReaderPage";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, BookMarked, Compass } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface MangaLibraryPageProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  hasPendingUpdate: boolean;
  onShowPendingUpdate: () => void;
  getC411Key: () => string;
  getAllDebridKey: () => string;
  /** Oeuvre a ouvrir a l'arrivee (action "Voir" depuis la decouverte). */
  initialMangaId?: string | null;
}

interface ReadingSession {
  mangaId: string;
  volume: MangaVolume;
}

export function MangaLibraryPage({
  onBack,
  onNavigate,
  hasPendingUpdate,
  onShowPendingUpdate,
  getC411Key,
  getAllDebridKey,
  initialMangaId,
}: MangaLibraryPageProps) {
  const [entries, setEntries] = useState<MangaEntry[]>(() => getCachedMangaLibrary() ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(initialMangaId ?? null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [refreshingPending, setRefreshingPending] = useState(false);
  const [findMoreFor, setFindMoreFor] = useState<MangaItem | null>(null);
  const [session, setSession] = useState<ReadingSession | null>(null);

  const refresh = useCallback(async () => {
    setEntries(await loadMangaLibrary());
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadMangaLibrary().then((list) => {
      if (!cancelled) setEntries(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => entries.find((e) => e.mangaId === selectedId) ?? null,
    [entries, selectedId],
  );

  const { addingHash, addRelease } = useAddMangaRelease({
    getC411Key,
    getAllDebridKey,
    onAdded: useCallback(() => void refresh(), [refresh]),
  });

  // Le "Réessayer" du toast rappelle la version courante de download, qu'une
  // closure ne peut pas capturer sans se referencer.
  const latestDownload = useRef<((mangaId: string, volume: MangaVolume) => void) | null>(null);

  const download = useCallback(
    async (mangaId: string, volume: MangaVolume) => {
      const key = getAllDebridKey();
      if (!key) {
        toast.error("Cle AllDebrid manquante. Configurez-la dans les parametres.");
        return null;
      }
      setDownloading(volumeKey(volume));
      try {
        const path = await downloadVolume(mangaId, volume, key);
        await refresh();
        return path;
      } catch (err) {
        toastNetworkError(err, () => latestDownload.current?.(mangaId, volume));
        return null;
      } finally {
        setDownloading(null);
      }
    },
    [getAllDebridKey, refresh],
  );

  useEffect(() => {
    latestDownload.current = download;
  }, [download]);

  // Lire un tome non telecharge le telecharge d'abord : l'utilisateur n'a pas a
  // enchainer deux actions.
  const read = useCallback(
    async (mangaId: string, volume: MangaVolume) => {
      if (volume.localPath) {
        setSession({ mangaId, volume });
        return;
      }
      const path = await download(mangaId, volume);
      if (path) setSession({ mangaId, volume: { ...volume, localPath: path } });
    },
    [download],
  );

  const refreshPending = useCallback(
    async (entry: MangaEntry) => {
      const key = getAllDebridKey();
      if (!key || !entry.pending) return;
      setRefreshingPending(true);
      try {
        for (const pending of entry.pending) {
          const files = await fetchMagnetFiles(pending.magnetId, key);
          await resolvePendingTorrent(
            entry.mangaId,
            pending.infoHash,
            volumesFromFiles(files, pending.infoHash, pending.magnetId),
          );
        }
        await refresh();
      } catch (err) {
        toastNetworkError(err);
      } finally {
        setRefreshingPending(false);
      }
    },
    [getAllDebridKey, refresh],
  );

  const onProgress = useCallback(
    (page: number, pageCount: number) => {
      if (!session) return;
      void updateVolume(session.mangaId, session.volume.fileName, session.volume.infoHash, {
        lastPage: page,
        pageCount,
      });
    },
    [session],
  );

  const onFinished = useCallback(async () => {
    if (!session) return;
    await updateVolume(session.mangaId, session.volume.fileName, session.volume.infoHash, {
      read: true,
    });
    setSession(null);
    await refresh();
  }, [session, refresh]);

  const toggleRead = useCallback(
    async (mangaId: string, volume: MangaVolume) => {
      await updateVolume(mangaId, volume.fileName, volume.infoHash, { read: !volume.read });
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !selected && !session) onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack, selected, session]);

  if (session) {
    const entry = entries.find((e) => e.mangaId === session.mangaId);
    const volume =
      entry?.volumes.find(
        (v) => v.fileName === session.volume.fileName && v.infoHash === session.volume.infoHash,
      ) ?? session.volume;
    return (
      <ReaderPage
        path={volume.localPath ?? ""}
        title={entry?.meta.title ?? ""}
        subtitle={volume.number !== null ? `Tome ${volume.number}` : volume.fileName}
        direction={entry?.readingDirection ?? "rtl"}
        initialPage={volume.lastPage ?? 0}
        onDirectionChange={(d) => {
          void setReadingDirection(session.mangaId, d).then(refresh);
        }}
        onProgress={onProgress}
        onFinished={() => void onFinished()}
        onMissing={() => {
          void forgetLocalFile(session.mangaId, volume).then(refresh);
          toast.error("Le fichier a disparu du disque, le tome est à retélécharger.");
          setSession(null);
        }}
        onClose={() => {
          setSession(null);
          void refresh();
        }}
      />
    );
  }

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
            Bibliothèque manga
          </h1>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onNavigate("manga")}>
              <Compass />
              Découvrir
            </Button>
            <AppMenu
              currentPage="mangalibrary"
              onNavigate={onNavigate}
              onBack={onBack}
              hasPendingUpdate={hasPendingUpdate}
              onShowPendingUpdate={onShowPendingUpdate}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-6 sm:px-8">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <BookMarked className="h-8 w-8 text-zinc-400" />
            <p className="text-sm text-zinc-500">Aucun manga dans la bibliothèque.</p>
            <Button variant="outline" size="sm" onClick={() => onNavigate("manga")}>
              <Compass />
              Parcourir le catalogue
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {entries.map((entry, i) => {
              const progress = mangaProgress(entry);
              return (
                <MangaPosterCard
                  key={entry.mangaId}
                  item={itemFromEntry(entry)}
                  index={i}
                  progress={{ total: progress.total, read: progress.read }}
                  onOpen={() => setSelectedId(entry.mangaId)}
                />
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <MangaEntryDetailModal
            entry={selected}
            downloading={downloading}
            refreshingPending={refreshingPending}
            onRead={(volume) => void read(selected.mangaId, volume)}
            onDownload={(volume) => void download(selected.mangaId, volume)}
            onToggleRead={(volume) => void toggleRead(selected.mangaId, volume)}
            onDirection={(d: ReadingDirection) =>
              void setReadingDirection(selected.mangaId, d).then(refresh)
            }
            onRefreshPending={() => void refreshPending(selected)}
            onFindMore={() => setFindMoreFor(itemFromEntry(selected))}
            onContinue={() => {
              const volume = nextVolume(selected);
              if (volume) void read(selected.mangaId, volume);
            }}
            onRemove={() => {
              void removeMangaEntry(selected.mangaId).then(() => {
                setSelectedId(null);
                return refresh();
              });
            }}
            onClose={() => setSelectedId(null)}
          />
        )}

        {findMoreFor && (
          <MangaReleasesModal
            item={findMoreFor}
            entry={entries.find((e) => e.mangaId === findMoreFor.id) ?? null}
            getC411Key={getC411Key}
            addingHash={addingHash}
            onAdd={addRelease}
            onOpenLibrary={() => setFindMoreFor(null)}
            onClose={() => setFindMoreFor(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
