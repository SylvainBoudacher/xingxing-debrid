import { LibraryCategoryMenu } from "@/components/LibraryCategoryMenu";
import { LibraryCustomBar } from "@/components/LibraryCustomBar";
import { LibraryListNameModal } from "@/components/LibraryListNameModal";
import { MangaBlocks } from "@/components/MangaBlocks";
import { MangaEntryDetailModal } from "@/components/MangaEntryDetailModal";
import { MangaImportModal } from "@/components/MangaImportModal";
import { MangaRetagModal } from "@/components/MangaRetagModal";
import { MangaListRow } from "@/components/MangaListRow";
import { MangaPosterCard } from "@/components/MangaPosterCard";
import { MangaReleasesModal } from "@/components/MangaReleasesModal";
import { MangaSelectionBar } from "@/components/MangaSelectionBar";
import { MangaToolbar } from "@/components/MangaToolbar";
import { volumeKey } from "@/components/MangaVolumeList";
import { Button } from "@/components/ui/button";
import { UNCLASSIFIED } from "@/lib/mangaCategories";
import {
  DEFAULT_MANGA_PREFS,
  getCachedMangaPrefs,
  loadMangaPrefs,
  saveMangaPref,
  type MangaFilter,
  type MangaGrouping,
  type MangaLayout,
  type MangaSort,
} from "@/lib/mangaPrefs";
import { buildMangaBlocks, mangaCounts, visibleMangas } from "@/lib/mangaSections";
import { useMangaCategories } from "@/lib/useMangaCategories";
import {
  beginBulkDownload,
  bulkTaskEnd,
  bulkTaskStart,
  endBulkDownload,
  getDownloadBatchSize,
  isBulkCancelled,
} from "@/lib/downloads";
import { downloadVolume, forgetLocalFile } from "@/lib/mangaDownload";
import { planImports, type PlannedImport } from "@/lib/mangaImport";
import type { MangaItem } from "@/lib/mangaItem";
import {
  getCachedMangaLibrary,
  itemFromEntry,
  loadMangaLibrary,
  mangaProgress,
  nextVolume,
  removeMangaEntry,
  removeVolume,
  resolvePendingTorrent,
  setReadingDirection,
  updateVolume,
  volumesFromFiles,
  type MangaEntry,
  type MangaVolume,
} from "@/lib/mangaLibrary";
import { toastNetworkError } from "@/lib/networkError";
import { fetchMagnetFiles, useAddMangaRelease } from "@/lib/useAddMangaRelease";
import { ReaderPage } from "@/pages/ReaderPage";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { AnimatePresence } from "motion/react";
import { BookMarked, Compass, FolderPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface LibraryMangaSectionProps {
  getC411Key: () => string;
  getAllDebridKey: () => string;
  /** Oeuvre a ouvrir a l'arrivee (action "Voir" depuis la decouverte). */
  initialMangaId?: string | null;
  /** La fiche pre-ouverte a ete consommee : ne pas la rouvrir au remontage */
  onInitialConsumed?: () => void;
  /** Ouvre la decouverte sur l'onglet Mangas. */
  onDiscover: () => void;
  /** Lecteur ou modale ouverts : la page hote suspend son raccourci Escape. */
  onBusyChange?: (busy: boolean) => void;
  /** La page hote elargit son conteneur en vue jaquettes. */
  onLayoutChange?: (layout: MangaLayout) => void;
}

interface ReadingSession {
  mangaId: string;
  volume: MangaVolume;
}

// Onglet "Mangas" de la bibliothèque : grille des oeuvres suivies, fiche
// détaillée (tomes, téléchargement, progression) et lecteur plein écran.
export function LibraryMangaSection({
  getC411Key,
  getAllDebridKey,
  initialMangaId,
  onInitialConsumed,
  onDiscover,
  onBusyChange,
  onLayoutChange,
}: LibraryMangaSectionProps) {
  const [entries, setEntries] = useState<MangaEntry[]>(() => getCachedMangaLibrary() ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fiche pre-ouverte (action "Voir" d'un toast) : attendre la fin de la
  // transition de page avant de l'animer, sinon tout apparait d'un coup.
  useEffect(() => {
    if (!initialMangaId) return;
    const timer = setTimeout(() => {
      setSelectedId(initialMangaId);
      onInitialConsumed?.();
    }, 350);
    return () => clearTimeout(timer);
    // onInitialConsumed est stable cote appelant : dep sur l'id seul.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMangaId]);
  const [downloading, setDownloading] = useState<Set<string>>(() => new Set());
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [refreshingPending, setRefreshingPending] = useState(false);
  const [findMoreFor, setFindMoreFor] = useState<MangaItem | null>(null);
  const [importing, setImporting] = useState<PlannedImport[] | null>(null);
  const [retagging, setRetagging] = useState<string | null>(null);
  const [session, setSession] = useState<ReadingSession | null>(null);

  const prefs = getCachedMangaPrefs() ?? DEFAULT_MANGA_PREFS;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MangaFilter>(prefs.filter);
  const [sort, setSort] = useState<MangaSort>(prefs.sort);
  const [layout, setLayout] = useState<MangaLayout>(prefs.layout);
  const [grouping, setGrouping] = useState<MangaGrouping>(prefs.grouping);
  const [selectMode, setSelectMode] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  // Saisie du nom d'une categorie : creation (avec ou sans selection a ranger)
  // ou renommage.
  const [naming, setNaming] = useState<
    { mode: "create"; withSelection: boolean } | { mode: "rename"; id: string; name: string } | null
  >(null);

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

  useEffect(() => {
    loadMangaPrefs().then((p) => {
      setFilter(p.filter);
      setSort(p.sort);
      setLayout(p.layout);
      setGrouping(p.grouping);
    });
  }, []);

  useEffect(() => {
    onLayoutChange?.(layout);
  }, [layout, onLayoutChange]);

  const mangaIds = useMemo(() => new Set(entries.map((e) => e.mangaId)), [entries]);
  const categories = useMangaCategories(mangaIds);

  const counts = useMemo(() => mangaCounts(entries), [entries]);
  const visible = useMemo(
    () => visibleMangas(entries, filter, query, sort),
    [entries, filter, query, sort],
  );
  const blocks = useMemo(
    () => buildMangaBlocks(visible, grouping, categories.config),
    [visible, grouping, categories.config],
  );

  const selected = useMemo(
    () => entries.find((e) => e.mangaId === selectedId) ?? null,
    [entries, selectedId],
  );

  useEffect(() => {
    onBusyChange?.(
      session !== null ||
        selected !== null ||
        findMoreFor !== null ||
        naming !== null ||
        importing !== null ||
        retagging !== null,
    );
  }, [session, selected, findMoreFor, naming, importing, retagging, onBusyChange]);

  // Import manuel : choix des .cbz sur le disque, puis identification de
  // l'oeuvre dans la modale.
  const pickFiles = useCallback(async () => {
    const picked = await openDialog({
      multiple: true,
      filters: [{ name: "Archives CBZ", extensions: ["cbz"] }],
    });
    const paths = Array.isArray(picked) ? picked : picked ? [picked] : [];
    if (paths.length === 0) return;
    setImporting(planImports(paths));
  }, []);

  const dropVolume = useCallback(
    async (mangaId: string, volume: MangaVolume) => {
      await removeVolume(mangaId, volume.fileName, volume.infoHash);
      await refresh();
    },
    [refresh],
  );

  function changeFilter(next: MangaFilter) {
    setFilter(next);
    saveMangaPref("filter", next);
  }

  function changeSort(next: MangaSort) {
    setSort(next);
    saveMangaPref("sort", next);
  }

  function changeLayout(next: MangaLayout) {
    setLayout(next);
    saveMangaPref("layout", next);
  }

  // Quitter le mode Personnalise ferme le rangement en cours : ses categories
  // ne sont plus affichees.
  function changeGrouping(next: MangaGrouping) {
    setGrouping(next);
    saveMangaPref("grouping", next);
    if (next !== "category") exitSelect();
  }

  function exitSelect() {
    setSelectMode(false);
    setPicked(new Set());
  }

  function togglePicked(mangaId: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (!next.delete(mangaId)) next.add(mangaId);
      return next;
    });
  }

  function classify(categoryId: string) {
    categories.classify([...picked], categoryId);
    exitSelect();
  }

  const { addingHash, addRelease } = useAddMangaRelease({
    getC411Key,
    getAllDebridKey,
    onAdded: useCallback(() => void refresh(), [refresh]),
    onOpenLibrary: setSelectedId,
  });

  // Le "Réessayer" du toast rappelle la version courante de download, qu'une
  // closure ne peut pas capturer sans se referencer.
  const latestDownload = useRef<((mangaId: string, volume: MangaVolume) => void) | null>(null);

  const markDownloading = useCallback((key: string, busy: boolean) => {
    setDownloading((prev) => {
      const next = new Set(prev);
      if (busy) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const download = useCallback(
    async (mangaId: string, volume: MangaVolume) => {
      // Un tome importe n'a pas de lien AllDebrid : rien a telecharger.
      if (volume.source === "local") {
        toast.error(
          "Ce tome vient d'un import local : son fichier est introuvable, réimportez-le.",
        );
        return null;
      }
      const key = getAllDebridKey();
      if (!key) {
        toast.error("Cle AllDebrid manquante. Configurez-la dans les parametres.");
        return null;
      }
      markDownloading(volumeKey(volume), true);
      try {
        const title = entries.find((e) => e.mangaId === mangaId)?.meta.title ?? "Manga";
        const path = await downloadVolume(mangaId, volume, key, title);
        await refresh();
        return path;
      } catch (err) {
        toastNetworkError(err, () => latestDownload.current?.(mangaId, volume));
        return null;
      } finally {
        markDownloading(volumeKey(volume), false);
      }
    },
    [getAllDebridKey, refresh, entries, markDownloading],
  );

  // Telecharge tous les tomes manquants par lots de N en parallele (reglage
  // `download_batch_size`), comme le telechargement groupe des episodes.
  const downloadAll = useCallback(
    async (entry: MangaEntry) => {
      const key = getAllDebridKey();
      if (!key) {
        toast.error("Cle AllDebrid manquante. Configurez-la dans les parametres.");
        return;
      }
      const queue = entry.volumes.filter(
        (v) => !v.localPath && v.source !== "local" && !downloading.has(volumeKey(v)),
      );
      if (queue.length === 0) return;

      setBulkDownloading(true);
      const batchSize = await getDownloadBatchSize();
      beginBulkDownload(queue.length);
      let next = 0;
      let firstError: unknown = null;
      const worker = async () => {
        while (next < queue.length) {
          if (isBulkCancelled()) break;
          const volume = queue[next++];
          bulkTaskStart();
          markDownloading(volumeKey(volume), true);
          try {
            await downloadVolume(entry.mangaId, volume, key, entry.meta.title);
            await refresh();
          } catch (err) {
            if (firstError === null) firstError = err;
          } finally {
            markDownloading(volumeKey(volume), false);
            bulkTaskEnd();
          }
        }
      };
      try {
        await Promise.all(Array.from({ length: Math.min(batchSize, queue.length) }, worker));
        if (firstError !== null) throw firstError;
      } catch (err) {
        toastNetworkError(err, () => void downloadAll(entry));
      } finally {
        endBulkDownload();
        setBulkDownloading(false);
        await refresh();
      }
    },
    [getAllDebridKey, refresh, downloading, markDownloading],
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

  const retagged = entries.find((e) => e.mangaId === retagging) ?? null;

  const importModal = importing && (
    <MangaImportModal
      planned={importing}
      knownIds={mangaIds}
      onImported={(mangaId) => {
        setImporting(null);
        void refresh().then(() => setSelectedId(mangaId));
      }}
      onClose={() => setImporting(null)}
    />
  );

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
          toast.error(
            volume.source === "local"
              ? "Le fichier importé a disparu du disque. Il ne vient pas d'AllDebrid : il faut le réimporter."
              : "Le fichier a disparu du disque, le tome est à retélécharger.",
          );
          setSession(null);
        }}
        onClose={() => {
          setSession(null);
          void refresh();
        }}
      />
    );
  }

  if (entries.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <BookMarked className="h-8 w-8 text-zinc-400" />
          <p className="text-sm text-zinc-500">Aucun manga dans la bibliothèque.</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onDiscover}>
              <Compass />
              Parcourir le catalogue
            </Button>
            <Button variant="outline" size="sm" onClick={() => void pickFiles()}>
              <FolderPlus />
              Importer des .cbz
            </Button>
          </div>
        </div>
        <AnimatePresence>{importModal}</AnimatePresence>
      </>
    );
  }

  const renderItems = (items: MangaEntry[]) =>
    layout === "grid" ? (
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        {items.map((entry, i) => {
          const progress = mangaProgress(entry);
          return (
            <MangaPosterCard
              key={entry.mangaId}
              item={itemFromEntry(entry)}
              index={i}
              progress={{ total: progress.total, read: progress.read }}
              selectMode={selectMode}
              selected={picked.has(entry.mangaId)}
              onOpen={() =>
                selectMode ? togglePicked(entry.mangaId) : setSelectedId(entry.mangaId)
              }
              onRemove={() => void removeMangaEntry(entry.mangaId).then(refresh)}
            />
          );
        })}
      </div>
    ) : (
      <div className="space-y-2">
        {items.map((entry) => (
          <MangaListRow
            key={entry.mangaId}
            entry={entry}
            selectMode={selectMode}
            selected={picked.has(entry.mangaId)}
            onToggleSelect={() => togglePicked(entry.mangaId)}
            onOpen={() => setSelectedId(entry.mangaId)}
            onRemove={() => void removeMangaEntry(entry.mangaId).then(refresh)}
          />
        ))}
      </div>
    );

  return (
    <>
      <MangaToolbar
        query={query}
        onQuery={setQuery}
        filter={filter}
        counts={counts}
        onFilter={changeFilter}
        grouping={grouping}
        onGrouping={changeGrouping}
        layout={layout}
        onLayout={changeLayout}
        sort={sort}
        onSort={changeSort}
        onImport={() => void pickFiles()}
      />

      <AnimatePresence>
        {grouping === "category" && (
          <LibraryCustomBar
            categoryCount={categories.config.categories.length}
            selectMode={selectMode}
            onCreate={() => setNaming({ mode: "create", withSelection: false })}
            onToggleSelect={() => (selectMode ? exitSelect() : setSelectMode(true))}
          />
        )}
      </AnimatePresence>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">Aucun manga ne correspond.</p>
      ) : (
        <MangaBlocks
          blocks={blocks}
          blockMenu={(block) => {
            if (block.key === UNCLASSIFIED) return null;
            const index = categories.config.categories.findIndex((c) => c.id === block.key);
            return (
              <LibraryCategoryMenu
                onRename={() =>
                  setNaming({ mode: "rename", id: block.key, name: block.label ?? "" })
                }
                onDelete={() => categories.remove(block.key)}
                onMoveUp={() => categories.move(block.key, -1)}
                onMoveDown={() => categories.move(block.key, 1)}
                canMoveUp={index > 0}
                canMoveDown={index < categories.config.categories.length - 1}
              />
            );
          }}
        >
          {renderItems}
        </MangaBlocks>
      )}

      <AnimatePresence>
        {selectMode && (
          <MangaSelectionBar
            count={picked.size}
            categories={categories.config.categories}
            onClassify={classify}
            onCreateCategoryWithSelection={() => setNaming({ mode: "create", withSelection: true })}
            onCancel={exitSelect}
          />
        )}

        {naming && (
          <LibraryListNameModal
            title={naming.mode === "create" ? "Nouvelle catégorie" : "Renommer la catégorie"}
            initialName={naming.mode === "rename" ? naming.name : ""}
            confirmLabel={naming.mode === "create" ? "Créer" : "Renommer"}
            onConfirm={(name) => {
              if (naming.mode === "rename") categories.rename(naming.id, name);
              else {
                categories.create(name, naming.withSelection ? [...picked] : []);
                if (naming.withSelection) exitSelect();
              }
              setNaming(null);
            }}
            onClose={() => setNaming(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <MangaEntryDetailModal
            entry={selected}
            downloading={downloading}
            refreshingPending={refreshingPending}
            bulkDownloading={bulkDownloading}
            onRead={(volume) => void read(selected.mangaId, volume)}
            onDownload={(volume) => void download(selected.mangaId, volume)}
            onRemoveVolume={(volume) => void dropVolume(selected.mangaId, volume)}
            onDownloadAll={() => void downloadAll(selected)}
            onToggleRead={(volume) => void toggleRead(selected.mangaId, volume)}
            onRefreshPending={() => void refreshPending(selected)}
            onFindMore={() => setFindMoreFor(itemFromEntry(selected))}
            onRetag={() => setRetagging(selected.mangaId)}
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

        {retagged && (
          <MangaRetagModal
            entry={retagged}
            knownIds={mangaIds}
            onRetagged={(mangaId) => {
              setRetagging(null);
              void refresh().then(() => setSelectedId(mangaId));
            }}
            onClose={() => setRetagging(null)}
          />
        )}

        {importModal}
      </AnimatePresence>
    </>
  );
}
