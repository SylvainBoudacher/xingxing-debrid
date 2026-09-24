import { AppMenu, type Page } from "@/components/AppMenu";
import { BulkConfirmDialog } from "@/components/BulkConfirmDialog";
import { DebridFilesModal } from "@/components/DebridFilesModal";
import { DiscoverReleasesModal } from "@/components/DiscoverReleasesModal";
import { LibraryBlocks } from "@/components/LibraryBlocks";
import { LibraryTitlePage } from "@/components/libraryTitle/LibraryTitlePage";
import { LibraryDisplayMenu } from "@/components/LibraryDisplayMenu";
import { LibraryDraggableCard } from "@/components/LibraryDraggableCard";
import { LibraryEmptyState } from "@/components/LibraryEmptyState";
import { LibraryEntryCard } from "@/components/LibraryEntryCard";
import { LibraryCategoryMenu } from "@/components/LibraryCategoryMenu";
import { LibraryCustomBar } from "@/components/LibraryCustomBar";
import { LibraryListNameModal } from "@/components/LibraryListNameModal";
import { LibraryMangaSection } from "@/components/LibraryMangaSection";
import { LibraryPosterCard } from "@/components/LibraryPosterCard";
import { LibraryReorderableCard } from "@/components/LibraryReorderableCard";
import { LibraryResumeBanner } from "@/components/LibraryResumeBanner";
import { LibrarySummary } from "@/components/LibrarySummary";
import { LibraryTabs, type LibraryTab } from "@/components/LibraryTabs";
import { LibraryToolbar } from "@/components/LibraryToolbar";
import { DEFAULT_MANGA_PREFS, getCachedMangaPrefs, type MangaLayout } from "@/lib/mangaPrefs";
import { hasMangaReadRequest, subscribeMangaRead } from "@/lib/mangaReadRequest";
import { LibrarySelectionBar } from "@/components/LibrarySelectionBar";
import { SeriesGroupCard } from "@/components/SeriesGroupCard";
import { SeriesGroupPosterCard } from "@/components/SeriesGroupPosterCard";
import { TmdbMatchModal } from "@/components/TmdbMatchModal";
import { flattenFiles, isVideoFile, type DebridFile } from "@/lib/debrid";
import {
  applyEnrichment,
  canEnrichTmdb,
  flushLibrary,
  getCachedLibrary,
  groupLibraryEntries,
  isWholeWatched,
  libraryCounts,
  loadLibrary,
  progressRatio,
  saveLibraryDebounced,
  setWholeWatched,
  type DisplayItem,
  type LibraryEntry,
  type TmdbMeta,
} from "@/lib/library";
import {
  buildLibraryBlocks,
  filterByGenres,
  genreOptions,
  type GroupMode,
  type LibraryBlock,
} from "@/lib/librarySections";
import {
  assignHashes,
  categoryOf,
  createCategory,
  deleteCategory,
  EMPTY_CATEGORIES,
  getCachedCategories,
  itemHashes,
  loadCategories,
  moveCategory,
  pruneCategories,
  renameCategory,
  saveCategories,
  UNCLASSIFIED,
  type CategoryConfig,
  type LibraryCategory,
} from "@/lib/libraryCategories";
import {
  DEFAULT_LIBRARY_PREFS,
  getCachedLibraryPrefs,
  loadLibraryPrefs,
  saveLibraryPref,
  type LibraryFilter,
  type LibraryLayout,
  type LibraryPosterSize,
  type LibrarySort,
} from "@/lib/libraryPrefs";
import { POSTER_GRID } from "@/lib/libraryPosterSize";
import { cardKey } from "@/lib/libraryTitle";
import { toastNetworkError } from "@/lib/networkError";
import { queryClient } from "@/lib/queryClient";
import {
  allDebridKeys,
  deleteMagnet,
  isMagnetReady,
  type MagnetEntry,
} from "@/lib/services/allDebrid";
import { useDebridActions } from "@/lib/useDebridActions";
import { ownedTmdbKeys } from "@/lib/recommendations";
import { useLikes } from "@/lib/useLikes";
import { useSendToDebrid } from "@/lib/useSendToDebrid";
import type { TmdbItem } from "@/lib/tmdbItem";
import { useStickyBar } from "@/lib/useStickyBar";
import { useTitleTransition } from "@/lib/useTitleTransition";
import { useLibraryGenres } from "@/lib/useLibraryGenres";
import { useLibraryMagnetStatus } from "@/lib/useLibraryMagnetStatus";
import { resolvePageViewMode, type ViewMode } from "@/lib/viewMode";
import { invoke } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";
import { PageHeader } from "@/components/PageHeader";
import { AnimatePresence, motion, Reorder } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

interface LibraryPageProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  /** Lance une recherche brute sur un tracker (C411 / Nyaa) via la page principale */
  onSearchTracker: (query: string, source: "c411" | "nyaa") => void;
  hasPendingUpdate: boolean;
  onShowPendingUpdate: () => void;
  initialAllDebridKey?: string | null;
  initialTmdbKey?: string | null;
  initialC411Key?: string | null;
  /** Onglet ouvert à l'arrivée (ex. "manga" depuis le menu "Mes mangas") */
  initialTab?: LibraryTab;
  /** Oeuvre manga à ouvrir directement (action "Voir" d'une fiche) */
  initialMangaId?: string | null;
  initialViewMode?: ViewMode;
  /** Fiche à ouvrir directement (venant de l'action "Voir" d'un toast) */
  initialExpandedHash?: string | null;
  initialExpandedGroupId?: number | null;
}

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

// La fiche C411 attend un TmdbItem : les métadonnées enregistrées n'ont pas de
// titre original (la recherche retombe sur le titre affiché).
function tmdbItemOf(meta: TmdbMeta): TmdbItem {
  return { ...meta, originalTitle: "" };
}

// Recul de la bibliothèque sous la fiche, façon modale iOS.
const RECEDE_SCALE = 0.985;
const RECEDE_TRANSITION = { duration: 0.3, ease: [0.22, 1, 0.36, 1] } as const;

type Filter = LibraryFilter;
type Layout = LibraryLayout;
type Sort = LibrarySort;

const SORTERS: Record<Exclude<Sort, "manual">, (a: LibraryEntry, b: LibraryEntry) => number> = {
  recent: (a, b) => b.addedAt - a.addedAt,
  title: (a, b) => a.title.localeCompare(b.title),
  size: (a, b) => b.size - a.size,
  progress: (a, b) => progressRatio(a) - progressRatio(b),
};

export function LibraryPage({
  onBack,
  onNavigate,
  onSearchTracker,
  hasPendingUpdate,
  onShowPendingUpdate,
  initialAllDebridKey,
  initialTmdbKey,
  initialC411Key,
  initialViewMode,
  initialTab,
  initialMangaId,
  initialExpandedHash,
  initialExpandedGroupId,
}: LibraryPageProps) {
  // Réglages lus au lancement (splash) : le premier rendu est déjà le bon,
  // sans re-tri ni re-groupement visible. Le cache n'est vide que si la page
  // s'ouvre avant la fin de cette lecture — l'effet plus bas rattrape ce cas.
  const initialPrefs = useRef(getCachedLibraryPrefs());
  const prefs = initialPrefs.current ?? DEFAULT_LIBRARY_PREFS;

  const [tab, setTab] = useState<LibraryTab>(() =>
    hasMangaReadRequest() ? "manga" : (initialTab ?? "media"),
  );
  // Tome à lire demandé par une notification : l'onglet Mangas monte sa section,
  // qui ouvre le lecteur.
  useEffect(() => subscribeMangaRead(() => setTab("manga")), []);
  // Lecteur ou fiche manga ouverts : Escape leur revient, pas au retour accueil.
  const [mangaBusy, setMangaBusy] = useState(false);
  const [mangaLayout, setMangaLayout] = useState<MangaLayout>(
    () => (getCachedMangaPrefs() ?? DEFAULT_MANGA_PREFS).layout,
  );
  const [entries, setEntries] = useState<LibraryEntry[]>(() => getCachedLibrary() ?? []);
  const [filter, setFilter] = useState<Filter>(prefs.filter);
  const [sort, setSort] = useState<Sort>(prefs.sort);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode ?? "simple");
  const [layout, setLayout] = useState<Layout>(prefs.layout);
  const [posterSize, setPosterSize] = useState<LibraryPosterSize>(prefs.posterSize);
  const [grouping, setGrouping] = useState<GroupMode>(prefs.grouping);
  const [genreFilter, setGenreFilter] = useState<Set<string>>(() => new Set(prefs.genres));
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(
    () => new Set(prefs.collapsed),
  );
  const [resumeCollapsed, setResumeCollapsed] = useState(prefs.resumeCollapsed);
  const [categories, setCategories] = useState<CategoryConfig>(
    () => getCachedCategories() ?? EMPTY_CATEGORIES,
  );
  // Bloc catégorie survolé pendant le glisser d'une carte.
  const [hoveredDrop, setHoveredDrop] = useState<string | null>(null);
  // La barre de recherche et les filtres restent accessibles au défilement,
  // posés juste sous le header.
  const {
    headerRef,
    barRef,
    offset: barTop,
    stuck: barStuck,
  } = useStickyBar<HTMLDivElement, HTMLDivElement>(8);
  // Modale de nom : création simple, création depuis une sélection, renommage.
  const [naming, setNaming] = useState<
    { mode: "create"; hashes: string[] } | { mode: "rename"; category: LibraryCategory } | null
  >(null);
  // Fiche manga pre-ouverte : consommee une seule fois, sinon un aller-retour
  // entre les onglets (qui demonte la section) la rouvrirait tout seul.
  const [pendingMangaId, setPendingMangaId] = useState<string | null>(initialMangaId ?? null);
  const [matchingHash, setMatchingHash] = useState<string | null>(null);
  const [matchingGroupId, setMatchingGroupId] = useState<number | null>(null);
  const [autoWatchOnPlay, setAutoWatchOnPlay] = useState(true);
  // Fiche C411 ouverte par-dessus une série : recherche d'épisodes manquants.
  const [findMore, setFindMore] = useState<TmdbItem | null>(null);
  // Fiche plein écran ouverte (série ou titre seul).
  const {
    subject: titleSubject,
    expandedHash,
    expandedGroupId,
    setExpandedGroupId,
    ready: titleReady,
    open: openTitle,
    close: closeTitle,
    hoverProps,
  } = useTitleTransition(entries, initialTmdbKey ?? undefined);
  const openEntry = useCallback((hash: string) => openTitle(hash, null), [openTitle]);
  const openGroup = useCallback((groupId: number) => openTitle(null, groupId), [openTitle]);
  const receded = titleSubject !== null;
  const debrid = useDebridActions(() => initialAllDebridKey ?? "");

  const { likedKeys, toggleLike } = useLikes();
  // Badge « Dans la bibliothèque » des suggestions de la fiche.
  const ownedKeys = useMemo(() => ownedTmdbKeys(entries), [entries]);
  const { sendingHash, libraryHash, debridModal, setDebridModal, sendToDebrid } = useSendToDebrid({
    getC411Key: () => initialC411Key ?? "",
    getAllDebridKey: () => initialAllDebridKey ?? "",
    onOpenLibrary: (item, infoHash) => {
      setFindMore(null);
      if (item.mediaType === "tv") openTitle(null, item.id);
      else openTitle(infoHash, null);
    },
    onLibraryChange: () => void loadLibrary().then(setEntries),
  });

  // Statut AllDebrid des magnets encore en cours de débridage (poll tant
  // qu'un magnet suivi est actif).
  const magnetStatuses = useLibraryMagnetStatus(entries, initialAllDebridKey);
  const magnetFor = (e: LibraryEntry): MagnetEntry | undefined =>
    !e.enriched && e.magnetId != null ? magnetStatuses.get(e.magnetId) : undefined;

  // Annulation d'un débridage : supprime le magnet côté AllDebrid puis retire
  // l'entrée de la bibliothèque (sans fichiers, elle n'a plus de raison d'être).
  const [cancellingHash, setCancellingHash] = useState<string | null>(null);

  // Récupère la liste des fichiers depuis AllDebrid pour les entrées non encore
  // enrichies (torrent envoyé pendant le débridage). Best-effort, échec silencieux.
  async function enrichMissing(loaded: LibraryEntry[]) {
    const key = initialAllDebridKey;
    if (!key) return;
    const pending = loaded.filter((e) => !e.enriched && e.magnetId != null);
    if (pending.length === 0) return;

    // Appels en parallèle (best-effort, échec silencieux par entrée).
    const results = await Promise.all(
      pending.map(async (e) => {
        try {
          const filesJson = await invoke<{
            data?: { magnets?: Array<{ files?: unknown[] }> };
          }>("get_magnet_files", { id: e.magnetId, alldebridKey: key });
          const rawFiles = filesJson.data?.magnets?.[0]?.files ?? [];
          if (rawFiles.length === 0) return null;
          return { infoHash: e.infoHash, files: flattenFiles(rawFiles) };
        } catch {
          // magnet retiré du compte partagé ou réseau : on garde la coche unique
          return null;
        }
      }),
    );

    const byHash = new Map<string, DebridFile[]>();
    for (const r of results) if (r) byHash.set(r.infoHash, r.files);
    if (byHash.size === 0) return;

    // Fusion avec l'état COURANT (l'utilisateur a pu cocher pendant le fetch) :
    // applyEnrichment préserve `watched`. On retire les entrées sans vidéo.
    setEntries((prev) => {
      const next = prev.flatMap((e) => {
        const files = byHash.get(e.infoHash);
        if (!files) return [e];
        return files.some((f) => isVideoFile(f.name)) ? [applyEnrichment(e, files)] : [];
      });
      saveLibraryDebounced(next);
      return next;
    });
  }

  useEffect(() => {
    loadLibrary().then((loaded) => {
      setEntries(loaded);
      enrichMissing(loaded);
    });
    if (initialViewMode === undefined) {
      resolvePageViewMode(store, "library").then(setViewMode);
    }
    store.get<boolean>("auto_watch_on_play").then((v) => {
      if (v !== null && v !== undefined) setAutoWatchOnPlay(v);
    });
    // Rattrapage : la page s'est ouverte avant la fin de la lecture du splash.
    if (initialPrefs.current === null) {
      void loadLibraryPrefs().then((p) => {
        setFilter(p.filter);
        setSort(p.sort);
        setLayout(p.layout);
        setGrouping(p.grouping);
        setGenreFilter(new Set(p.genres));
        setResumeCollapsed(p.resumeCollapsed);
        setPosterSize(p.posterSize);
      });
    }
    // Purge des références mortes au chargement seulement : pendant la session,
    // une suppression reste annulable, et son appartenance aux listes avec.
    void Promise.all([loadLibrary(), loadCategories()]).then(([loaded, stored]) => {
      const pruned = pruneCategories(stored, new Set(loaded.map((e) => e.infoHash)));
      setCategories(pruned);
      if (pruned !== stored) void saveCategories(pruned);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fiche pré-sélectionnée (action "Voir" d'un toast d'ajout) : on attend la fin
  // de la transition d'entrée de la page avant d'ouvrir la modale, sinon les
  // deux animations se chevauchent et l'ouverture paraît précipitée.
  useEffect(() => {
    if (!initialExpandedHash && initialExpandedGroupId == null) return;
    const timer = setTimeout(() => {
      openTitle(initialExpandedHash ?? null, initialExpandedGroupId ?? null);
    }, 420);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeGenreFilter(next: Set<string>) {
    setGenreFilter(next);
    saveLibraryPref("genres", [...next]);
  }

  function changeFilter(next: Filter) {
    setFilter(next);
    saveLibraryPref("filter", next);
  }

  function changeSort(next: Sort) {
    setSort(next);
    saveLibraryPref("sort", next);
  }

  // Le rangement par sélection n'existe qu'en vue grille : on y bascule plutôt
  // que de laisser un bouton sans effet en vue liste.
  function startClassifying() {
    if (selectMode) return exitSelect();
    if (layout === "list") changeLayout("grid");
    setSelectMode(true);
  }

  function toggleResumeCollapsed() {
    setResumeCollapsed((prev) => {
      saveLibraryPref("resumeCollapsed", !prev);
      return !prev;
    });
  }

  function toggleCollapsedBlock(key: string) {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      saveLibraryPref("collapsed", [...next]);
      return next;
    });
  }

  function changePosterSize(next: LibraryPosterSize) {
    setPosterSize(next);
    saveLibraryPref("posterSize", next);
  }

  function resetSearch() {
    setQuery("");
    changeFilter("all");
  }

  function changeGrouping(next: GroupMode) {
    setGrouping(next);
    saveLibraryPref("grouping", next);
  }

  function changeLayout(next: Layout) {
    setLayout(next);
    // Le tri manuel (glisser-déposer) n'existe qu'en vue liste : on bascule sur
    // « Plus récents » en passant en grille.
    if (next === "grid" && sort === "manual") changeSort("recent");
    // La sélection multiple n'existe qu'en vue grille.
    if (next === "list") exitSelect();
    saveLibraryPref("layout", next);
  }

  // Flushe l'écriture en attente quand on quitte la page.
  useEffect(() => flushLibrary, []);

  // Dès qu'un magnet suivi passe à « Prêt », récupère ses fichiers pour
  // enrichir l'entrée sans attendre la prochaine ouverture de la page.
  const enrichTried = useRef(new Set<number>());
  useEffect(() => {
    const ready = entries.filter((e) => {
      const m = magnetFor(e);
      return m && isMagnetReady(m) && !enrichTried.current.has(m.id);
    });
    if (ready.length === 0) return;
    for (const e of ready) enrichTried.current.add(e.magnetId!);
    void enrichMissing(ready);
    // magnetFor / enrichMissing sont recréés à chaque rendu : deps sur les données.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, magnetStatuses]);

  // Escape : retour à l'accueil, sauf si une modale est ouverte (elle gère
  // elle-même sa fermeture sur Escape).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (debridModal) {
        setDebridModal(null);
        return;
      }
      if (findMore) {
        setFindMore(null);
        return;
      }
      if (titleSubject || matchingHash || matchingGroupId !== null) return;
      if (mangaBusy) return;
      onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    titleSubject,
    matchingHash,
    matchingGroupId,
    mangaBusy,
    findMore,
    debridModal,
    setDebridModal,
    onBack,
  ]);

  // Updaters fonctionnels : identité stable (deps vides) pour ne pas casser le
  // React.memo des cartes, tout en lisant le dernier état via `prev`.
  const persist = useCallback((next: LibraryEntry[]) => {
    setEntries(next);
    saveLibraryDebounced(next);
  }, []);

  const handleChange = useCallback((updated: LibraryEntry) => {
    setEntries((prev) => {
      const next = prev.map((e) => (e.infoHash === updated.infoHash ? updated : e));
      saveLibraryDebounced(next);
      return next;
    });
  }, []);

  const handleRemove = useCallback((infoHash: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.infoHash !== infoHash);
      saveLibraryDebounced(next);
      return next;
    });
  }, []);

  const cancelDebrid = useCallback(
    async function cancelDebrid(entry: LibraryEntry) {
      if (!initialAllDebridKey || entry.magnetId == null) return;
      setCancellingHash(entry.infoHash);
      try {
        await deleteMagnet(initialAllDebridKey, entry.magnetId);
        handleRemove(entry.infoHash);
        queryClient.invalidateQueries({ queryKey: allDebridKeys.magnets() });
        toast.success("Débridage annulé");
      } catch (err) {
        toastNetworkError(err, () => cancelDebrid(entry));
      } finally {
        setCancellingHash(null);
      }
    },
    [initialAllDebridKey, handleRemove],
  );

  const removeHashes = useCallback((hashes: string[]) => {
    const set = new Set(hashes);
    setEntries((prev) => {
      const next = prev.filter((e) => !set.has(e.infoHash));
      saveLibraryDebounced(next);
      return next;
    });
  }, []);

  // Ré-insère des entrées supprimées (annulation). Ignore celles déjà présentes.
  const restoreEntries = useCallback((restored: LibraryEntry[]) => {
    setEntries((prev) => {
      const have = new Set(prev.map((e) => e.infoHash));
      const merged = [...prev, ...restored.filter((e) => !have.has(e.infoHash))];
      saveLibraryDebounced(merged);
      return merged;
    });
  }, []);

  // Dernier état rendu, pour retrouver les entrées supprimées sans passer par
  // un updater (qui s'exécute deux fois en StrictMode).
  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  // Suppression d'un titre depuis sa carte (toutes ses entrées pour une série),
  // annulable comme la suppression groupée.
  const removeTitle = useCallback(
    (hashes: string[]) => {
      const set = new Set(hashes);
      const removed = entriesRef.current.filter((e) => set.has(e.infoHash));
      if (removed.length === 0) return;
      removeHashes(hashes);
      toast.success("Titre supprimé", {
        action: { label: "Annuler", onClick: () => restoreEntries(removed) },
      });
    },
    [removeHashes, restoreEntries],
  );

  const removeEntry = useCallback((hash: string) => removeTitle([hash]), [removeTitle]);

  // ---------- Sélection multiple (vue grille) ----------
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const toggleSelected = useCallback((hashes: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSel = hashes.every((h) => next.has(h));
      for (const h of hashes) {
        if (allSel) next.delete(h);
        else next.add(h);
      }
      return next;
    });
  }, []);

  const exitSelect = useCallback(() => {
    setSelectMode(false);
    setSelected(new Set());
  }, []);

  function bulkSetWatched(value: boolean) {
    setEntries((prev) => {
      const next = prev.map((e) => (selected.has(e.infoHash) ? setWholeWatched(e, value) : e));
      saveLibraryDebounced(next);
      return next;
    });
  }

  function toggleWatched(entry: LibraryEntry) {
    setEntries((prev) => {
      const value = !isWholeWatched(entry);
      const next = prev.map((e) => (e.infoHash === entry.infoHash ? setWholeWatched(e, value) : e));
      saveLibraryDebounced(next);
      return next;
    });
  }

  function bulkRemove() {
    const removed = entries.filter((e) => selected.has(e.infoHash));
    if (removed.length === 0) return;
    // Compte les cartes (une série regroupée = une carte, cf. libraryCounts).
    const tvIds = new Set<number>();
    let cards = 0;
    for (const e of removed) {
      if (e.tmdb?.mediaType === "tv") tvIds.add(e.tmdb.id);
      else cards++;
    }
    cards += tvIds.size;
    removeHashes([...selected]);
    setSelected(new Set());
    toast.success(`${cards} titre${cards > 1 ? "s" : ""} supprimé${cards > 1 ? "s" : ""}`, {
      action: { label: "Annuler", onClick: () => restoreEntries(removed) },
    });
  }

  const counts = useMemo(() => libraryCounts(entries), [entries]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const filtered = entries.filter((e) => {
      if (filter !== "all") {
        const done = isWholeWatched(e);
        if (filter === "done" ? !done : done) return false;
      }
      return (
        q === "" ||
        e.title.toLowerCase().includes(q) ||
        (e.tmdb?.title.toLowerCase().includes(q) ?? false)
      );
    });
    return sort === "manual" ? filtered : [...filtered].sort(SORTERS[sort]);
  }, [entries, filter, sort, q]);

  // Le glisser-déposer ne réordonne que la liste complète (sans filtre ni recherche).
  const canReorder =
    grouping === "none" &&
    sort === "manual" &&
    filter === "all" &&
    q === "" &&
    genreFilter.size === 0;

  const grouped = useMemo<DisplayItem[]>(() => groupLibraryEntries(visible), [visible]);

  // Options du filtre : calculées avant filtrage, sinon décocher un genre
  // deviendrait impossible (sa puce disparaîtrait avec les titres).
  const genreOpts = useMemo(() => genreOptions(grouped), [grouped]);

  const displayItems = useMemo<DisplayItem[]>(
    () => (canReorder ? [] : filterByGenres(grouped, genreFilter)),
    [canReorder, grouped, genreFilter],
  );

  const blocks = useMemo(
    () => buildLibraryBlocks(displayItems, grouping, categories),
    [displayItems, grouping, categories],
  );

  function persistCategories(next: CategoryConfig) {
    setCategories(next);
    void saveCategories(next);
  }

  // Les hashes des titres sélectionnés (une série regroupée en fournit un par
  // saison, cf. itemHashes).
  function selectedHashes(): string[] {
    return displayItems
      .filter((i) => itemHashes(i).some((h) => selected.has(h)))
      .flatMap(itemHashes);
  }

  function handleNameConfirm(name: string) {
    if (naming === null) return;
    if (naming.mode === "rename") {
      persistCategories(renameCategory(categories, naming.category.id, name));
    } else {
      const created = createCategory(categories, name);
      const category = created.categories[created.categories.length - 1];
      persistCategories(
        naming.hashes.length > 0 ? assignHashes(created, naming.hashes, category.id) : created,
      );
      if (naming.hashes.length > 0) exitSelect();
      changeGrouping("category");
    }
    setNaming(null);
  }

  // La catégorie disparaît, ses titres redeviennent non classés.
  function handleDeleteCategory(category: LibraryCategory) {
    const before = categories;
    persistCategories(deleteCategory(categories, category.id));
    toast.success(`Catégorie « ${category.name} » supprimée`, {
      action: { label: "Annuler", onClick: () => persistCategories(before) },
    });
  }

  // Dépôt d'un titre (glisser-déposer) ou de la sélection sur une catégorie.
  function classify(hashes: string[], dropId: string) {
    if (hashes.length === 0) return;
    persistCategories(assignHashes(categories, hashes, dropId === UNCLASSIFIED ? null : dropId));
  }

  function handleClassifySelection(dropId: string) {
    classify(selectedHashes(), dropId);
    exitSelect();
  }

  function toggleGenre(name: string) {
    const next = new Set(genreFilter);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    changeGenreFilter(next);
  }

  // Les genres alimentent le filtre comme le regroupement : ceux qui manquent
  // sont récupérés une fois puis écrits dans la bibliothèque.
  const applyGenres = useCallback((genresById: Map<string, number[]>) => {
    setEntries((prev) => {
      const next = prev.map((e) => {
        const ids = e.tmdb && genresById.get(`${e.tmdb.mediaType}:${e.tmdb.id}`);
        return ids ? { ...e, tmdb: { ...e.tmdb!, genreIds: ids } } : e;
      });
      saveLibraryDebounced(next);
      return next;
    });
  }, []);

  useLibraryGenres(entries, initialTmdbKey, true, applyGenres);

  const matchingEntry = entries.find((e) => e.infoHash === matchingHash) ?? null;
  // Entrées d'un groupe série en cours de ré-association TMDB : le nouveau
  // choix s'applique à toutes les entrées du groupe.
  const matchingGroupEntries =
    matchingGroupId !== null
      ? entries.filter((e) => e.tmdb?.mediaType === "tv" && e.tmdb.id === matchingGroupId)
      : [];

  // Bouton « Compléter via TMDB » : seulement si une clé est configurée et que
  // l'entrée (C411 / Nyaa) n'a pas encore de métadonnées.
  const enrichHandler = (e: LibraryEntry) =>
    initialTmdbKey && canEnrichTmdb(e) ? () => setMatchingHash(e.infoHash) : undefined;

  // Nombre de cartes cochées (une série regroupée = une carte).
  const selectedCount = useMemo(() => {
    if (!selectMode) return 0;
    let n = 0;
    for (const item of displayItems) {
      if (item.type === "single") {
        if (selected.has(item.entry.infoHash)) n++;
      } else if (item.group.entries.every((e) => selected.has(e.infoHash))) {
        n++;
      }
    }
    return n;
  }, [selectMode, displayItems, selected]);

  const itemKey = (item: DisplayItem) =>
    item.type === "group" ? cardKey(null, item.group.tmdbId) : cardKey(item.entry.infoHash, null);

  // Menu d'un bloc catégorie (les non classés n'en ont pas : rien à renommer).
  const categoryBlockMenu = (block: LibraryBlock) => {
    const index = categories.categories.findIndex((c) => c.id === block.dropId);
    if (index === -1) return null;
    const category = categories.categories[index];
    return (
      <LibraryCategoryMenu
        onRename={() => setNaming({ mode: "rename", category })}
        onDelete={() => handleDeleteCategory(category)}
        onMoveUp={() => persistCategories(moveCategory(categories, category.id, -1))}
        onMoveDown={() => persistCategories(moveCategory(categories, category.id, 1))}
        canMoveUp={index > 0}
        canMoveDown={index < categories.categories.length - 1}
      />
    );
  };

  const draggableCard = (item: DisplayItem, card: ReactNode) => {
    if (grouping !== "category") return card;
    return (
      <LibraryDraggableCard
        key={itemKey(item)}
        onHover={setHoveredDrop}
        onDrop={(dropId) => {
          if (categoryOf(categories, item) !== (dropId === UNCLASSIFIED ? null : dropId))
            classify(itemHashes(item), dropId);
        }}
      >
        {card}
      </LibraryDraggableCard>
    );
  };

  const renderCard = (item: DisplayItem) =>
    draggableCard(
      item,
      item.type === "single" ? (
        <LibraryEntryCard
          key={item.entry.infoHash}
          entry={item.entry}
          onChange={handleChange}
          onRemove={removeEntry}
          onOpen={openEntry}
          debrid={debrid}
          simple={viewMode === "simple"}
          autoWatchOnPlay={autoWatchOnPlay}
          magnet={magnetFor(item.entry)}
          onCancelDebrid={cancelDebrid}
          cancellingDebrid={cancellingHash === item.entry.infoHash}
        />
      ) : (
        <SeriesGroupCard
          key={item.group.tmdbId}
          group={item.group}
          onChange={handleChange}
          onRemove={removeTitle}
          onOpen={openGroup}
          debrid={debrid}
          autoWatchOnPlay={autoWatchOnPlay}
        />
      ),
    );

  const renderPoster = (item: DisplayItem) =>
    draggableCard(
      item,
      item.type === "single" ? (
        <LibraryPosterCard
          key={item.entry.infoHash}
          layoutId={`poster-${item.entry.infoHash}`}
          entry={item.entry}
          simple={viewMode === "simple"}
          expanded={expandedHash === item.entry.infoHash}
          selectMode={selectMode}
          selected={selected.has(item.entry.infoHash)}
          onToggle={() =>
            selectMode ? toggleSelected([item.entry.infoHash]) : openEntry(item.entry.infoHash)
          }
          onEnrichTmdb={enrichHandler(item.entry)}
          onRemove={() => removeEntry(item.entry.infoHash)}
          onToggleWatched={() => toggleWatched(item.entry)}
          magnet={magnetFor(item.entry)}
          onCancelDebrid={cancelDebrid}
          cancellingDebrid={cancellingHash === item.entry.infoHash}
        />
      ) : (
        <SeriesGroupPosterCard
          key={item.group.tmdbId}
          layoutId={`poster-series-${item.group.tmdbId}`}
          group={item.group}
          expanded={expandedGroupId === item.group.tmdbId}
          selectMode={selectMode}
          selected={item.group.entries.every((e) => selected.has(e.infoHash))}
          onToggle={() =>
            selectMode
              ? toggleSelected(item.group.entries.map((e) => e.infoHash))
              : openGroup(item.group.tmdbId)
          }
          onRemove={() => removeTitle(item.group.entries.map((e) => e.infoHash))}
        />
      ),
    );

  return (
    <main className="relative flex min-h-screen flex-col bg-[#f4f6fc] bg-[radial-gradient(ellipse_70%_45%_at_50%_20%,_#d7e0fb_0%,_#edf1fa_45%,_#fafbfe_75%)] dark:bg-black dark:bg-[radial-gradient(ellipse_70%_45%_at_50%_20%,_#0c1d56_0%,_#04091a_45%,_#000000_75%)]">
      {/* Recul façon modale iOS sous la fiche, centré sur la partie visible de
      la page. Le survol d'une carte précharge sa fiche. */}
      <motion.div
        {...hoverProps}
        initial={false}
        animate={{ scale: receded ? RECEDE_SCALE : 1 }}
        transition={RECEDE_TRANSITION}
        style={{ transformOrigin: `50% ${window.scrollY + window.innerHeight / 2}px` }}
        className="flex flex-1 flex-col"
      >
        {/* Header */}
        {/* inert : la grille reste montée sous la fiche plein écran, hors d'atteinte
      du clavier. */}
        <PageHeader
          ref={headerRef}
          inert={titleSubject !== null}
          title="Ma bibliothèque"
          onBack={onBack}
          entrance
          zIndex="z-30"
          menu={
            <AppMenu
              currentPage="library"
              onNavigate={onNavigate}
              onBack={onBack}
              hasPendingUpdate={hasPendingUpdate}
              onShowPendingUpdate={onShowPendingUpdate}
            />
          }
        />

        <div
          inert={titleSubject !== null}
          className={`mx-auto w-full flex-1 px-6 pt-6 pb-10 sm:px-8 ${
            (tab === "manga" ? mangaLayout : layout) === "grid" ? "max-w-5xl" : "max-w-3xl"
          }`}
        >
          <LibraryTabs tab={tab} onSwitch={setTab} />

          {tab === "manga" && (
            <LibraryMangaSection
              getC411Key={() => initialC411Key ?? ""}
              getAllDebridKey={() => initialAllDebridKey ?? ""}
              initialMangaId={pendingMangaId}
              onInitialConsumed={() => setPendingMangaId(null)}
              onDiscover={() => onNavigate("manga")}
              onBusyChange={setMangaBusy}
              onLayoutChange={setMangaLayout}
            />
          )}

          {tab === "media" && (
            <>
              <LibrarySummary entries={entries} />

              <LibraryToolbar
                barRef={barRef}
                top={barTop}
                stuck={barStuck}
                query={query}
                onQueryChange={setQuery}
                filter={filter}
                counts={counts}
                onFilterChange={changeFilter}
                layout={layout}
                onLayoutChange={changeLayout}
                selectMode={selectMode}
                onToggleSelect={() => (selectMode ? exitSelect() : setSelectMode(true))}
                displayMenu={
                  <LibraryDisplayMenu
                    sort={sort}
                    onSortChange={changeSort}
                    allowManualSort={layout === "list"}
                    grouping={grouping}
                    onGroupingChange={changeGrouping}
                    posterSize={layout === "grid" ? posterSize : undefined}
                    onPosterSizeChange={changePosterSize}
                    genreOptions={genreOpts}
                    genreFilter={genreFilter}
                    onToggleGenre={toggleGenre}
                    onClearGenres={() => changeGenreFilter(new Set())}
                  />
                }
              />

              {/* Reprise du prochain épisode : masquée dès qu'une recherche,
              un filtre ou un genre est actif, on cherche alors autre chose. */}
              <AnimatePresence>
                {!query && filter === "all" && genreFilter.size === 0 && (
                  <LibraryResumeBanner
                    entries={entries}
                    onOpen={openTitle}
                    onChange={handleChange}
                    debrid={debrid}
                    autoWatchOnPlay={autoWatchOnPlay}
                    simple={viewMode === "simple"}
                    tmdbKey={initialTmdbKey ?? undefined}
                    collapsed={resumeCollapsed}
                    onToggleCollapsed={toggleResumeCollapsed}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {grouping === "category" && (
                  <LibraryCustomBar
                    categoryCount={categories.categories.length}
                    selectMode={selectMode}
                    onCreate={() => setNaming({ mode: "create", hashes: [] })}
                    onToggleSelect={startClassifying}
                  />
                )}
              </AnimatePresence>

              {entries.length === 0 ? (
                <LibraryEmptyState kind="empty" onNavigate={onNavigate} />
              ) : visible.length === 0 ? (
                <LibraryEmptyState
                  kind="noMatch"
                  query={query}
                  filter={filter}
                  onReset={resetSearch}
                />
              ) : displayItems.length === 0 && genreFilter.size > 0 ? (
                <LibraryEmptyState
                  kind="noGenre"
                  onClearGenres={() => changeGenreFilter(new Set())}
                />
              ) : layout === "grid" ? (
                <LibraryBlocks
                  blocks={blocks}
                  blockMenu={categoryBlockMenu}
                  activeDropId={hoveredDrop}
                  collapsedKeys={collapsedBlocks}
                  onToggleCollapsed={toggleCollapsedBlock}
                >
                  {(items) => (
                    <div className={`grid gap-3 ${POSTER_GRID[posterSize]}`}>
                      {items.map(renderPoster)}
                    </div>
                  )}
                </LibraryBlocks>
              ) : canReorder ? (
                <Reorder.Group axis="y" values={visible} onReorder={persist} className="space-y-2">
                  {visible.map((e) => (
                    <LibraryReorderableCard
                      key={e.infoHash}
                      entry={e}
                      onChange={handleChange}
                      onRemove={removeEntry}
                      onOpen={openEntry}
                      debrid={debrid}
                      simple={viewMode === "simple"}
                      autoWatchOnPlay={autoWatchOnPlay}
                      magnet={magnetFor(e)}
                      onCancelDebrid={cancelDebrid}
                      cancellingDebrid={cancellingHash === e.infoHash}
                    />
                  ))}
                </Reorder.Group>
              ) : (
                <LibraryBlocks
                  blocks={blocks}
                  blockMenu={categoryBlockMenu}
                  activeDropId={hoveredDrop}
                  collapsedKeys={collapsedBlocks}
                  onToggleCollapsed={toggleCollapsedBlock}
                >
                  {(items) => <div className="space-y-2">{items.map(renderCard)}</div>}
                </LibraryBlocks>
              )}
            </>
          )}
        </div>
      </motion.div>

      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: receded ? 1 : 0 }}
        transition={RECEDE_TRANSITION}
        className="pointer-events-none fixed inset-0 z-[35] bg-black/35"
      />

      <AnimatePresence>
        {titleSubject && (
          <LibraryTitlePage
            key={
              titleSubject.kind === "group"
                ? `g${titleSubject.group.tmdbId}`
                : titleSubject.entry.infoHash
            }
            subject={titleSubject}
            ready={titleReady}
            onChange={handleChange}
            onRemove={handleRemove}
            onClose={closeTitle}
            debrid={debrid}
            simple={viewMode === "simple"}
            autoWatchOnPlay={autoWatchOnPlay}
            tmdbKey={initialTmdbKey ?? undefined}
            onEnrichTmdb={
              initialTmdbKey
                ? () =>
                    titleSubject.kind === "group"
                      ? setMatchingGroupId(titleSubject.group.tmdbId)
                      : setMatchingHash(titleSubject.entry.infoHash)
                : undefined
            }
            onFindMore={
              initialTmdbKey && titleSubject.kind === "group"
                ? () => setFindMore(tmdbItemOf(titleSubject.group.tmdb))
                : undefined
            }
            overlayOpen={
              matchingHash !== null ||
              matchingGroupId !== null ||
              findMore !== null ||
              debridModal !== null
            }
            ownedKeys={ownedKeys}
            likedKeys={likedKeys}
            onToggleLike={toggleLike}
            onOpenSuggestion={initialTmdbKey ? setFindMore : undefined}
            magnet={titleSubject.kind === "entry" ? magnetFor(titleSubject.entry) : undefined}
            onCancelDebrid={cancelDebrid}
            cancellingDebrid={
              titleSubject.kind === "entry" && cancellingHash === titleSubject.entry.infoHash
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {naming && (
          <LibraryListNameModal
            title={
              naming.mode === "rename"
                ? "Renommer la catégorie"
                : naming.hashes.length > 0
                  ? "Nouvelle catégorie avec la sélection"
                  : "Nouvelle catégorie"
            }
            initialName={naming.mode === "rename" ? naming.category.name : ""}
            confirmLabel={naming.mode === "rename" ? "Renommer" : "Créer"}
            onConfirm={handleNameConfirm}
            onClose={() => setNaming(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectMode && (
          <LibrarySelectionBar
            count={selectedCount}
            categories={categories.categories}
            onMarkWatched={() => bulkSetWatched(true)}
            onMarkUnwatched={() => bulkSetWatched(false)}
            onDelete={bulkRemove}
            onCancel={exitSelect}
            onClassify={handleClassifySelection}
            onCreateCategoryWithSelection={() =>
              setNaming({ mode: "create", hashes: selectedHashes() })
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {matchingEntry && initialTmdbKey && (
          <TmdbMatchModal
            entry={matchingEntry}
            tmdbKey={initialTmdbKey}
            onPick={(meta) => {
              handleChange({ ...matchingEntry, tmdb: meta });
              setMatchingHash(null);
            }}
            onClose={() => setMatchingHash(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {matchingGroupEntries.length > 0 && initialTmdbKey && (
          <TmdbMatchModal
            entry={matchingGroupEntries[0]}
            tmdbKey={initialTmdbKey}
            onPick={(meta) => {
              const hashes = new Set(matchingGroupEntries.map((e) => e.infoHash));
              setEntries((prev) => {
                const next = prev.map((e) => (hashes.has(e.infoHash) ? { ...e, tmdb: meta } : e));
                saveLibraryDebounced(next);
                return next;
              });
              setMatchingGroupId(null);
              // Le groupe est identifié par son id TMDB : après changement,
              // l'ancien groupe n'existe plus, on ferme la modale de détail.
              setExpandedGroupId(meta.mediaType === "tv" ? meta.id : null);
            }}
            onClose={() => setMatchingGroupId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {findMore && initialTmdbKey && (
          <DiscoverReleasesModal
            item={findMore}
            tmdbKey={initialTmdbKey}
            getC411Key={() => initialC411Key ?? ""}
            liked={likedKeys.has(`${findMore.mediaType}-${findMore.id}`)}
            sendingHash={sendingHash}
            libraryHash={libraryHash}
            onToggleLike={toggleLike}
            onClose={() => setFindMore(null)}
            onSend={(occ, addToLibrary) => sendToDebrid(occ, findMore, addToLibrary)}
            onSearchTracker={onSearchTracker}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {debridModal && (
          <DebridFilesModal
            modal={debridModal}
            getAllDebridKey={() => initialAllDebridKey ?? ""}
            onClose={() => setDebridModal(null)}
          />
        )}
      </AnimatePresence>

      <BulkConfirmDialog
        pending={debrid.pendingBulk}
        onConfirm={debrid.confirmBulk}
        onCancel={debrid.cancelBulk}
      />
    </main>
  );
}
