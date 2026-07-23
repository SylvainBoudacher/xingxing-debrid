import { AppMenu, type Page } from "@/components/AppMenu";
import { LibraryDetailModal } from "@/components/LibraryDetailModal";
import { LibraryBlocks } from "@/components/LibraryBlocks";
import { LibraryEntryCard, type DebridControls } from "@/components/LibraryEntryCard";
import { LibraryGenreFilter } from "@/components/LibraryGenreFilter";
import { LibraryCategoryMenu } from "@/components/LibraryCategoryMenu";
import { LibraryCustomBar } from "@/components/LibraryCustomBar";
import { LibraryListNameModal } from "@/components/LibraryListNameModal";
import { LibraryPosterCard } from "@/components/LibraryPosterCard";
import { LibrarySelectionBar } from "@/components/LibrarySelectionBar";
import { SeriesGroupCard } from "@/components/SeriesGroupCard";
import { SeriesGroupDetailModal } from "@/components/SeriesGroupDetailModal";
import { SeriesGroupPosterCard } from "@/components/SeriesGroupPosterCard";
import { TmdbMatchModal } from "@/components/TmdbMatchModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toastNetworkError } from "@/lib/networkError";
import { queryClient } from "@/lib/queryClient";
import {
  allDebridKeys,
  deleteMagnet,
  isMagnetReady,
  type MagnetEntry,
} from "@/lib/services/allDebrid";
import { useDebridActions } from "@/lib/useDebridActions";
import { useDragScroll } from "@/lib/useDragScroll";
import { useLibraryGenres } from "@/lib/useLibraryGenres";
import { useLibraryMagnetStatus } from "@/lib/useLibraryMagnetStatus";
import { resolvePageViewMode, type ViewMode } from "@/lib/viewMode";
import { invoke } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";
import {
  ArrowLeft,
  CheckSquare,
  Compass,
  GripVertical,
  Layers,
  LayoutGrid,
  Library as LibraryIcon,
  List,
  Search,
  Tags,
} from "lucide-react";
import { AnimatePresence, motion, Reorder, useDragControls, type PanInfo } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

interface LibraryPageProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  hasPendingUpdate: boolean;
  onShowPendingUpdate: () => void;
  initialAllDebridKey?: string | null;
  initialTmdbKey?: string | null;
  initialViewMode?: ViewMode;
}

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

type Filter = "all" | "todo" | "done";
type Layout = "list" | "grid";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "todo", label: "À voir" },
  { id: "done", label: "Vu" },
];

type Sort = "manual" | "recent" | "title" | "size" | "progress";

const SORTS: { id: Sort; label: string }[] = [
  { id: "manual", label: "Manuel" },
  { id: "recent", label: "Plus récents" },
  { id: "title", label: "Titre (A-Z)" },
  { id: "size", label: "Taille" },
  { id: "progress", label: "À finir" },
];

const GROUP_MODES: { id: GroupMode; label: string }[] = [
  { id: "none", label: "Aucun" },
  { id: "type", label: "Type" },
  { id: "genre", label: "Genre" },
  { id: "category", label: "Personnalisé" },
];

const SORTERS: Record<Exclude<Sort, "manual">, (a: LibraryEntry, b: LibraryEntry) => number> = {
  recent: (a, b) => b.addedAt - a.addedAt,
  title: (a, b) => a.title.localeCompare(b.title),
  size: (a, b) => b.size - a.size,
  progress: (a, b) => progressRatio(a) - progressRatio(b),
};

export function LibraryPage({
  onBack,
  onNavigate,
  hasPendingUpdate,
  onShowPendingUpdate,
  initialAllDebridKey,
  initialTmdbKey,
  initialViewMode,
}: LibraryPageProps) {
  const [entries, setEntries] = useState<LibraryEntry[]>(() => getCachedLibrary() ?? []);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode ?? "simple");
  const [layout, setLayout] = useState<Layout>("grid");
  const [grouping, setGrouping] = useState<GroupMode>("type");
  const [genreFilter, setGenreFilter] = useState<Set<string>>(new Set());
  const [genreBarOpen, setGenreBarOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryConfig>(EMPTY_CATEGORIES);
  // Titre en cours de glissement : dataTransfer ne se lit pas pendant dragover,
  // et une ref suffit puisque le glisser-déposer reste dans la page.
  const draggedHashes = useRef<string[]>([]);
  const [hoveredDrop, setHoveredDrop] = useState<string | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  // Le relâchement d'un drag émet un click sur le bouton de la carte, qui
  // ouvrirait la modale de détail : on l'avale en phase capture.
  const suppressClick = useRef(false);
  const { ref: toolbarRef, dragProps: toolbarDrag } = useDragScroll<HTMLDivElement>();
  // Modale de nom : création simple, création depuis une sélection, renommage.
  const [naming, setNaming] = useState<
    { mode: "create"; hashes: string[] } | { mode: "rename"; category: LibraryCategory } | null
  >(null);
  const [expandedHash, setExpandedHash] = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);
  const [matchingHash, setMatchingHash] = useState<string | null>(null);
  const [matchingGroupId, setMatchingGroupId] = useState<number | null>(null);
  const [autoWatchOnPlay, setAutoWatchOnPlay] = useState(true);
  const debrid = useDebridActions(() => initialAllDebridKey ?? "");

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
            status: string;
            data?: { magnets?: Array<{ files?: unknown[] }> };
          }>("get_magnet_files", { id: e.magnetId, alldebridKey: key });
          const rawFiles = filesJson.data?.magnets?.[0]?.files ?? [];
          if (filesJson.status !== "success" || rawFiles.length === 0) return null;
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
    store.get<Layout>("library_layout").then((v) => {
      if (v) setLayout(v);
    });
    store.get<boolean>("library_genre_bar").then((v) => {
      if (v !== null && v !== undefined) setGenreBarOpen(v);
    });
    // Purge des références mortes au chargement seulement : pendant la session,
    // une suppression reste annulable, et son appartenance aux listes avec.
    void Promise.all([loadLibrary(), loadCategories()]).then(([loaded, stored]) => {
      const pruned = pruneCategories(stored, new Set(loaded.map((e) => e.infoHash)));
      setCategories(pruned);
      if (pruned !== stored) void saveCategories(pruned);
    });
    // "library_split" (booléen) est l'ancien réglage films/séries : conservé
    // comme valeur de repli tant que le nouveau mode n'a pas été choisi.
    store.get<GroupMode>("library_grouping").then((v) => {
      if (v) return setGrouping(v);
      void store.get<boolean>("library_split").then((old) => {
        if (old !== null && old !== undefined) setGrouping(old ? "type" : "none");
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Replier la barre efface la sélection : un filtre actif mais invisible
  // donnerait une bibliothèque incomplète sans raison apparente.
  function toggleGenreBar() {
    const next = !genreBarOpen;
    setGenreBarOpen(next);
    if (!next) setGenreFilter(new Set());
    void store.set("library_genre_bar", next).then(() => store.save());
  }

  // Le rangement par sélection n'existe qu'en vue grille : on y bascule plutôt
  // que de laisser un bouton sans effet en vue liste.
  function startClassifying() {
    if (selectMode) return exitSelect();
    if (layout === "list") changeLayout("grid");
    setSelectMode(true);
  }

  function changeGrouping(next: GroupMode) {
    setGrouping(next);
    void store.set("library_grouping", next).then(() => store.save());
  }

  function changeLayout(next: Layout) {
    setLayout(next);
    // Le tri manuel (glisser-déposer) n'existe qu'en vue liste : on bascule sur
    // « Plus récents » en passant en grille.
    if (next === "grid" && sort === "manual") setSort("recent");
    // La sélection multiple n'existe qu'en vue grille.
    if (next === "list") exitSelect();
    void store.set("library_layout", next).then(() => store.save());
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
      if (expandedHash || expandedGroupId || matchingHash || matchingGroupId !== null) return;
      onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expandedHash, expandedGroupId, matchingHash, matchingGroupId, onBack]);

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
      setGrouping("category");
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
    setGenreFilter((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
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

  // Entrée affichée dans le panneau latéral (vue grille). Null si l'entrée
  // sélectionnée n'est plus visible après un changement de filtre/recherche.
  const expandedEntry = visible.find((e) => e.infoHash === expandedHash) ?? null;
  const expandedGroup =
    expandedGroupId !== null
      ? (displayItems.find(
          (item) => item.type === "group" && item.group.tmdbId === expandedGroupId,
        ) ?? null)
      : null;
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
    item.type === "group" ? `g${item.group.tmdbId}` : item.entry.infoHash;

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

  // Bloc catégorie sous le curseur. `elementsFromPoint` traverse la pile :
  // la carte en cours de glissement, au-dessus, n'occulte pas la cible.
  //
  // L'événement pointeur donne des coordonnées écran directement ; `info.point`
  // est relatif à la page et sert de repli (tactile).
  function dropIdAt(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): string | null {
    const native = event as PointerEvent;
    const x = typeof native.clientX === "number" ? native.clientX : info.point.x - window.scrollX;
    const y = typeof native.clientY === "number" ? native.clientY : info.point.y - window.scrollY;
    for (const el of document.elementsFromPoint(x, y)) {
      // La carte glissée est sous le curseur : remonter son DOM mènerait à son
      // bloc d'origine, jamais à la cible. On saute tous ses éléments.
      if ((el as HTMLElement).closest("[data-dragging]")) continue;
      const dropId = (el as HTMLElement).closest<HTMLElement>("[data-drop-id]")?.dataset.dropId;
      if (dropId) return dropId;
    }
    return null;
  }

  // En mode Personnalisé, chaque carte se glisse dans un bloc catégorie.
  // Le glisser passe par motion (pointer events) et non par le drag HTML5 :
  // dans le WebView, l'image de la jaquette et le bouton de la carte captent
  // le geste natif, et le dépôt n'arrive jamais.
  const draggableCard = (item: DisplayItem, card: ReactNode) => {
    if (grouping !== "category") return card;
    return (
      <motion.div
        key={itemKey(item)}
        drag
        dragSnapToOrigin
        dragMomentum={false}
        dragElastic={0.2}
        whileDrag={{ scale: 0.92, zIndex: 30, cursor: "grabbing" }}
        data-dragging={draggingKey === itemKey(item) ? "" : undefined}
        onDragStart={() => {
          draggedHashes.current = itemHashes(item);
          setDraggingKey(itemKey(item));
          suppressClick.current = true;
        }}
        onDrag={(event, info) => setHoveredDrop(dropIdAt(event, info))}
        onDragEnd={(event, info) => {
          const dropId = dropIdAt(event, info);
          setHoveredDrop(null);
          setDraggingKey(null);
          if (dropId && categoryOf(categories, item) !== (dropId === UNCLASSIFIED ? null : dropId))
            classify(draggedHashes.current, dropId);
          draggedHashes.current = [];
          // Le click éventuel arrive juste après le pointerup, avant ce timeout :
          // on ne bloque donc jamais un vrai clic ultérieur.
          setTimeout(() => {
            suppressClick.current = false;
          }, 0);
        }}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            suppressClick.current = false;
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="relative cursor-grab touch-none select-none active:cursor-grabbing [&_img]:[-webkit-user-drag:none]"
      >
        {card}
      </motion.div>
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
          onRemove={handleRemove}
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
          onRemove={handleRemove}
          debrid={debrid}
          simple={viewMode === "simple"}
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
            selectMode
              ? toggleSelected([item.entry.infoHash])
              : setExpandedHash(item.entry.infoHash)
          }
          onEnrichTmdb={enrichHandler(item.entry)}
          onRemove={() => handleRemove(item.entry.infoHash)}
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
              : setExpandedGroupId(item.group.tmdbId)
          }
          onRemove={() => removeHashes(item.group.entries.map((e) => e.infoHash))}
        />
      ),
    );

  return (
    <main className="relative flex min-h-screen flex-col bg-[#f4f6fc] bg-[radial-gradient(ellipse_70%_45%_at_50%_20%,_#d7e0fb_0%,_#edf1fa_45%,_#fafbfe_75%)] dark:bg-black dark:bg-[radial-gradient(ellipse_70%_45%_at_50%_20%,_#0c1d56_0%,_#04091a_45%,_#000000_75%)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-10 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/30 backdrop-blur-xl"
      >
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 sm:px-8">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onBack}
            className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </motion.button>

          <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
            Ma bibliothèque
          </h1>

          <AppMenu
            currentPage="library"
            onNavigate={onNavigate}
            onBack={onBack}
            hasPendingUpdate={hasPendingUpdate}
            onShowPendingUpdate={onShowPendingUpdate}
          />
        </div>
      </motion.div>

      <div
        className={`mx-auto w-full flex-1 px-6 pt-6 pb-10 sm:px-8 ${layout === "grid" ? "max-w-5xl" : "max-w-3xl"}`}
      >
        {/* Recherche */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un titre..."
            className="w-full rounded-lg border border-black/10 bg-white/70 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-zinc-900/60 dark:text-white"
          />
        </div>

        {/* Filtres + tri. La barre défile horizontalement plutôt que d'écraser
            ses libellés quand elle déborde (min-w-max), le glisser reproduit le
            défilement là où la molette horizontale manque. */}
        <div
          ref={toolbarRef}
          {...toolbarDrag}
          className="mb-4 cursor-grab overflow-x-auto select-none active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-full min-w-max items-center justify-between gap-2">
            <div className="flex flex-none items-center gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filter === f.id
                      ? "bg-indigo-600 text-white"
                      : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
                  }`}
                >
                  {f.label} ({counts[f.id]})
                </button>
              ))}
            </div>

            <div className="flex flex-none items-center gap-2">
              {layout === "grid" && (
                <button
                  onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
                  title="Sélection multiple"
                  className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
                    selectMode
                      ? "bg-indigo-600 text-white"
                      : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
                  }`}
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  Sélection
                </button>
              )}

              {genreOpts.length > 0 && (
                <button
                  onClick={toggleGenreBar}
                  title={genreBarOpen ? "Masquer les filtres de genre" : "Filtrer par genre"}
                  className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
                    genreBarOpen || genreFilter.size > 0
                      ? "bg-indigo-600 text-white"
                      : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
                  }`}
                >
                  <Tags className="h-3.5 w-3.5" />
                  Types
                  {genreFilter.size > 0 && (
                    <span className="rounded-full bg-white/25 px-1.5 text-[10px] leading-4">
                      {genreFilter.size}
                    </span>
                  )}
                </button>
              )}

              <div className="flex items-center gap-1 rounded-full bg-black/5 p-0.5 dark:bg-white/10">
                <Layers className="ml-2 mr-0.5 h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                {GROUP_MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => changeGrouping(m.id)}
                    title={
                      m.id === "genre"
                        ? "Grouper par genre (films et séries séparés)"
                        : m.id === "type"
                          ? "Séparer films / séries"
                          : "Aucun regroupement"
                    }
                    className={`flex h-7 items-center rounded-full px-2.5 text-xs font-medium transition-colors ${
                      grouping === m.id
                        ? "bg-indigo-600 text-white"
                        : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center rounded-full bg-black/5 p-0.5 dark:bg-white/10">
                {(
                  [
                    ["list", List],
                    ["grid", LayoutGrid],
                  ] as const
                ).map(([id, Icon]) => (
                  <button
                    key={id}
                    onClick={() => changeLayout(id)}
                    title={id === "list" ? "Vue liste" : "Vue grille"}
                    className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                      layout === id
                        ? "bg-white text-indigo-600 shadow-sm dark:bg-zinc-700 dark:text-indigo-300"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>

              <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                <SelectTrigger className="h-8 w-auto gap-1 rounded-full px-3 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.filter((s) => s.id !== "manual" || layout === "list").map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

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

        {genreBarOpen && genreOpts.length > 0 && (
          <div className="mb-4">
            <LibraryGenreFilter
              options={genreOpts}
              selected={genreFilter}
              onToggle={toggleGenre}
              onClear={() => setGenreFilter(new Set())}
            />
          </div>
        )}

        {visible.length === 0 ? (
          <div className="mt-24 flex flex-col items-center gap-3 text-center text-zinc-400 dark:text-zinc-500">
            <LibraryIcon className="h-10 w-10" strokeWidth={1.5} />
            <p className="text-sm">
              {entries.length === 0
                ? "Aucun téléchargement pour l'instant."
                : "Rien ne correspond à cette recherche."}
            </p>
            {entries.length === 0 && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => onNavigate("main")}
                  className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
                >
                  <Search className="h-3.5 w-3.5" />
                  Rechercher
                </button>
                <button
                  onClick={() => onNavigate("discover")}
                  className="flex items-center gap-1.5 rounded-full bg-black/5 px-4 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
                >
                  <Compass className="h-3.5 w-3.5" />
                  Découvrir
                </button>
              </div>
            )}
          </div>
        ) : displayItems.length === 0 && genreFilter.size > 0 ? (
          <div className="mt-24 flex flex-col items-center gap-3 text-center text-zinc-400 dark:text-zinc-500">
            <LibraryIcon className="h-10 w-10" strokeWidth={1.5} />
            <p className="text-sm">Aucun titre dans ces genres.</p>
            <button
              onClick={() => setGenreFilter(new Set())}
              className="mt-1 flex items-center gap-1.5 rounded-full bg-black/5 px-4 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
            >
              Effacer les genres
            </button>
          </div>
        ) : layout === "grid" ? (
          <LibraryBlocks blocks={blocks} blockMenu={categoryBlockMenu} activeDropId={hoveredDrop}>
            {(items) => (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {items.map(renderPoster)}
              </div>
            )}
          </LibraryBlocks>
        ) : canReorder ? (
          <Reorder.Group axis="y" values={visible} onReorder={persist} className="space-y-2">
            {visible.map((e) => (
              <ReorderableCard
                key={e.infoHash}
                entry={e}
                onChange={handleChange}
                onRemove={handleRemove}
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
          <LibraryBlocks blocks={blocks} blockMenu={categoryBlockMenu} activeDropId={hoveredDrop}>
            {(items) => <div className="space-y-2">{items.map(renderCard)}</div>}
          </LibraryBlocks>
        )}
      </div>

      <AnimatePresence>
        {expandedEntry && (
          <LibraryDetailModal
            entry={expandedEntry}
            onChange={handleChange}
            onRemove={handleRemove}
            onClose={() => setExpandedHash(null)}
            debrid={debrid}
            simple={viewMode === "simple"}
            autoWatchOnPlay={autoWatchOnPlay}
            onEnrichTmdb={
              initialTmdbKey ? () => setMatchingHash(expandedEntry.infoHash) : undefined
            }
            tmdbKey={initialTmdbKey ?? undefined}
            enrichOpen={matchingHash !== null}
            magnet={magnetFor(expandedEntry)}
            onCancelDebrid={cancelDebrid}
            cancellingDebrid={cancellingHash === expandedEntry.infoHash}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expandedGroup?.type === "group" && (
          <SeriesGroupDetailModal
            group={expandedGroup.group}
            onChange={handleChange}
            onRemove={handleRemove}
            onClose={() => setExpandedGroupId(null)}
            debrid={debrid}
            simple={viewMode === "simple"}
            autoWatchOnPlay={autoWatchOnPlay}
            onEnrichTmdb={
              initialTmdbKey ? () => setMatchingGroupId(expandedGroup.group.tmdbId) : undefined
            }
            tmdbKey={initialTmdbKey ?? undefined}
            enrichOpen={matchingGroupId !== null}
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
    </main>
  );
}

interface ReorderableCardProps {
  entry: LibraryEntry;
  onChange: (entry: LibraryEntry) => void;
  onRemove: (infoHash: string) => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay?: boolean;
  magnet?: MagnetEntry;
  onCancelDebrid?: (entry: LibraryEntry) => void;
  cancellingDebrid?: boolean;
}

function ReorderableCard({ entry, ...props }: ReorderableCardProps) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={entry}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-1.5"
    >
      <button
        onPointerDown={(e) => controls.start(e)}
        className="flex h-7 w-5 flex-none cursor-grab touch-none items-center justify-center text-zinc-400 hover:text-zinc-600 active:cursor-grabbing dark:hover:text-zinc-200"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <LibraryEntryCard entry={entry} {...props} />
      </div>
    </Reorder.Item>
  );
}
