import vlcLogo from "@/assets/vlc.png";
import { AppMenu, type Page } from "@/components/AppMenu";
import { NetworkErrorState } from "@/components/NetworkErrorState";
import { NyaaSearchFilters } from "@/components/NyaaSearchFilters";
import { MangaSearchSuggestions } from "@/components/MangaSearchSuggestions";
import { SearchSuggestions } from "@/components/SearchSuggestions";
import { useMangaSuggestions } from "@/lib/useMangaSuggestions";
import { useTmdbSuggestions } from "@/lib/useTmdbSuggestions";
import type { MangaItem } from "@/lib/mangaItem";
import type { TmdbItem } from "@/lib/tmdbItem";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getApiKey } from "@/lib/apiKeys";
import type { C411Torrent } from "@/lib/c411";
import { flattenFiles, formatSize, isVideoFile, type DebridModal } from "@/lib/debrid";
import { getCachedLibrary, loadLibrary, recordDownload } from "@/lib/library";
import { ownedTmdbKeys } from "@/lib/recommendations";
import { networkErrorMessage, toastNetworkError } from "@/lib/networkError";
import { loadNyaaDefaults } from "@/lib/nyaaDefaults";
import { buildNyaaQuery } from "@/lib/nyaaFilters";
import { parseRelease } from "@/lib/parseRelease";
import { LATEST_VERSION } from "@/lib/patchnotes";
import { queryClient } from "@/lib/queryClient";
import { mapNyaaResults, mapTorrents, pageNumbers, type SearchResult } from "@/lib/search";
import { c411Keys, searchTorrents } from "@/lib/services/c411";
import { nyaaKeys, searchNyaa } from "@/lib/services/nyaa";
import { useDebridActions } from "@/lib/useDebridActions";
import { MangaLinkModal } from "@/components/MangaLinkModal";
import { cbzReleaseFromResult } from "@/lib/mangaSearchResult";
import type { MangaRelease } from "@/lib/mangaReleases";
import { getCachedMangaLibrary, loadMangaLibrary, ownedMangaIds } from "@/lib/mangaLibrary";
import { useAddMangaRelease } from "@/lib/useAddMangaRelease";
import { MODE_BAR_ACCENT, SEARCH_MODES, type SearchMode } from "@/lib/searchModes";
import { resolvePageViewMode, type ViewMode } from "@/lib/viewMode";
import { invoke } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";
import {
  ArrowDown,
  ArrowUp,
  Book,
  BookMarked,
  BookOpen,
  BookmarkPlus,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Compass,
  Copy,
  Download,
  FileText,
  Gamepad2,
  Headphones,
  HelpCircle,
  Library,
  Loader2,
  Music,
  Package,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tv,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

const titleWords = "Que voulez-vous télécharger ?".split(" ");

const titleContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const titleWordVariants = {
  hidden: { y: "110%", opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      delay: Math.min(i * 0.03, 0.3),
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

// Apparition en cascade des bulles de source et des filtres nyaa sous la barre.
const pillStaggerVariants = {
  hidden: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const pillItemVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 420, damping: 24 },
  },
};

function getCategoryIcon(id: number): { icon: LucideIcon; color: string } {
  if (id === 2060 || id === 5070)
    return { icon: Sparkles, color: "text-pink-600 dark:text-pink-400" };
  if (id === 2070) return { icon: FileText, color: "text-yellow-600 dark:text-yellow-400" };
  if (id >= 2000 && id < 3000)
    return { icon: Clapperboard, color: "text-blue-600 dark:text-blue-400" };
  if (id === 3030) return { icon: Headphones, color: "text-orange-600 dark:text-orange-400" };
  if (id >= 3000 && id < 4000)
    return { icon: Music, color: "text-purple-600 dark:text-purple-400" };
  if (id === 4050) return { icon: Gamepad2, color: "text-green-600 dark:text-green-400" };
  if (id >= 4000 && id < 5000) return { icon: Package, color: "text-zinc-500 dark:text-zinc-400" };
  if (id >= 5000 && id < 6000) return { icon: Tv, color: "text-cyan-600 dark:text-cyan-400" };
  if (id === 7030) return { icon: BookMarked, color: "text-rose-600 dark:text-rose-400" };
  if (id >= 7000) return { icon: Book, color: "text-amber-600 dark:text-amber-400" };
  return { icon: HelpCircle, color: "text-zinc-500" };
}

const CATEGORY_FILTERS: Array<{
  key: number;
  label: string;
  icon: LucideIcon;
  color: string;
}> = [
  { key: 2000, label: "Films", icon: Clapperboard, color: "text-blue-600 dark:text-blue-400" },
  { key: 5000, label: "Séries", icon: Tv, color: "text-cyan-600 dark:text-cyan-400" },
  { key: 3000, label: "Musique", icon: Music, color: "text-purple-600 dark:text-purple-400" },
  {
    key: 4000,
    label: "Logiciels & Jeux",
    icon: Gamepad2,
    color: "text-green-600 dark:text-green-400",
  },
  { key: 7000, label: "Livres", icon: Book, color: "text-amber-600 dark:text-amber-400" },
  { key: 0, label: "Autres", icon: HelpCircle, color: "text-zinc-500" },
];

function getCategoryGroup(id: number): number {
  const g = Math.floor(id / 1000) * 1000;
  return CATEGORY_FILTERS.some((c) => c.key === g) ? g : 0;
}

function isVideoCategory(id: number): boolean {
  const g = Math.floor(id / 1000) * 1000;
  return g === 2000 || g === 5000;
}

const QUALITY_ORDER = ["4K", "2160p", "1080p", "720p", "480p"];

const SORT_LABELS = {
  pertinence: "Pertinence",
  seeders: "Seeders",
  size: "Taille",
  date: "Date",
} as const;
type SortKey = keyof typeof SORT_LABELS;

const PER_PAGE = 10;

const API_SORT: Record<SortKey, string> = {
  pertinence: "relevance",
  seeders: "seeders",
  size: "size",
  date: "createdAt",
};

interface C411Response {
  data: C411Torrent[];
  meta: { total: number; page: number; totalPages: number };
}

interface MainPageProps {
  onNavigate: (page: Page) => void;
  /** Lance la page Découverte avec une recherche TMDB pré-remplie */
  onLaunchDiscover: (query: string) => void;
  /** Ouvre directement la fiche d'un titre TMDB dans la page Découverte */
  onLaunchDiscoverItem: (item: TmdbItem) => void;
  /** Lance l'onglet Mangas de la Découverte avec une recherche MangaDex */
  onLaunchDiscoverManga: (query: string) => void;
  /** Ouvre directement la fiche d'un manga dans l'onglet Mangas de la Découverte */
  onLaunchDiscoverMangaItem: (item: MangaItem) => void;
  devMode: boolean;
  onToggleDevMode: () => void;
  onShowUpdatePreview: () => void;
  onShowMangaWelcome: () => void;
  hasPendingUpdate: boolean;
  onShowPendingUpdate: () => void;
  summerEnabled: boolean;
  /** Clés API pré-lues par useAppInit — zéro latence au montage */
  initialC411Key?: string | null;
  initialAllDebridKey?: string | null;
  initialTmdbKey?: string | null;
  /** Préférences UI pré-lues par useAppInit */
  initialPatchnotesSeen?: string | null;
  initialSearchViewMode?: ViewMode;
  initialIdleAutoHide?: boolean;
  /** Mode courant de la barre, conservé par App entre les navigations */
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  /** Recherche tracker à lancer au montage (depuis la fiche Découverte) */
  initialSearch?: { query: string; source: "c411" | "nyaa" } | null;
  /** Notifie que `initialSearch` a été consommé (évite un relancement au remontage) */
  onSearchConsumed?: () => void;
}

export function MainPage({
  onNavigate,
  onLaunchDiscover,
  onLaunchDiscoverItem,
  onLaunchDiscoverManga,
  onLaunchDiscoverMangaItem,
  devMode,
  onToggleDevMode,
  onShowUpdatePreview,
  onShowMangaWelcome,
  hasPendingUpdate,
  onShowPendingUpdate,
  summerEnabled,
  initialC411Key,
  initialAllDebridKey,
  initialTmdbKey,
  initialPatchnotesSeen,
  initialSearchViewMode,
  initialIdleAutoHide = true,
  initialSearch,
  onSearchConsumed,
  searchMode,
  onSearchModeChange,
}: MainPageProps) {
  const [query, setQuery] = useState(initialSearch?.query ?? "");
  const source = searchMode;
  const setSource = onSearchModeChange;
  const [activeSource, setActiveSource] = useState<"c411" | "nyaa">("c411");
  const [searchFocused, setSearchFocused] = useState(false);
  const [nyaaTeam, setNyaaTeam] = useState("");
  const [nyaaQuality, setNyaaQuality] = useState("");
  const [nyaaCodec, setNyaaCodec] = useState("");
  const [nyaaLanguage, setNyaaLanguage] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [activeCats, setActiveCats] = useState<number[]>([]);
  const [activeQualities, setActiveQualities] = useState<string[]>([]);
  const [activeCodecs, setActiveCodecs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("pertinence");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState(0);
  const [phase, setPhase] = useState<
    "idle" | "title-exiting" | "active" | "results-exiting" | "bar-returning"
  >("idle");
  const [sendingIndex, setSendingIndex] = useState<number | null>(null);
  const [libraryIndex, setLibraryIndex] = useState<number | null>(null);
  const [debridModal, setDebridModal] = useState<DebridModal | null>(null);
  const [mangaLink, setMangaLink] = useState<MangaRelease | null>(null);
  const [showPatchNotif, setShowPatchNotif] = useState(
    initialPatchnotesSeen !== undefined ? initialPatchnotesSeen !== LATEST_VERSION : false,
  );
  const [simpleSearchView, setSimpleSearchView] = useState(
    (initialSearchViewMode ?? "simple") === "simple",
  );
  const [tmdbKey, setTmdbKey] = useState<string | null | undefined>(initialTmdbKey);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const apiKeyRef = useRef<string>(initialC411Key ?? "");
  const allDebridKeyRef = useRef<string>(initialAllDebridKey ?? "");
  // Snapshot initial props so the mount-only effect doesn't need them as deps
  const initialPropsRef = useRef({
    c411Key: initialC411Key,
    allDebridKey: initialAllDebridKey,
    patchnotesSeen: initialPatchnotesSeen,
    searchViewMode: initialSearchViewMode,
  });

  const {
    downloadingLink,
    copiedLink,
    vlcLink,
    copyLink: handleCopyLink,
    openVlc: handleOpenVlc,
    downloadFile: handleDownloadFile,
  } = useDebridActions(() => allDebridKeyRef.current);

  const { addingHash, addRelease } = useAddMangaRelease({
    getC411Key: () => apiKeyRef.current,
    getAllDebridKey: () => allDebridKeyRef.current,
    onAdded: () => {
      setMangaLink(null);
      setOwnedMangas(ownedMangaIds(getCachedMangaLibrary() ?? []));
    },
  });
  const [uiVisible, setUiVisible] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchedQueryRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Ids TMDB deja presents dans la bibliotheque : badge dans l'auto-complete.
  const [ownedKeys, setOwnedKeys] = useState<Set<string>>(() =>
    ownedTmdbKeys(getCachedLibrary() ?? []),
  );
  useEffect(() => {
    void loadLibrary().then((lib) => setOwnedKeys(ownedTmdbKeys(lib)));
  }, []);

  // Idem cote manga : ids MangaDex deja dans la bibliotheque manga.
  const [ownedMangas, setOwnedMangas] = useState<Set<string>>(() =>
    ownedMangaIds(getCachedMangaLibrary() ?? []),
  );
  useEffect(() => {
    void loadMangaLibrary().then((lib) => setOwnedMangas(ownedMangaIds(lib)));
  }, []);

  // Auto-complete TMDB : uniquement en mode Films & Séries, barre focalisée.
  const { suggestions, loading: suggestionsLoading } = useTmdbSuggestions(
    query,
    source === "discover" && searchFocused,
    tmdbKey,
  );
  // On n'ouvre le panneau qu'une fois les suggestions chargées : le bloc se
  // déplie d'un coup avec son contenu complet, sans passer par un spinner qui
  // ferait sauter la hauteur. Le retour de chargement se fait via l'icône.
  const showSuggestions =
    source === "discover" && searchFocused && query.trim().length >= 4 && suggestions.length > 0;

  // Auto-complete MangaDex : même barre, mode Mangas.
  const { suggestions: mangaSuggestions, loading: mangaSuggestionsLoading } = useMangaSuggestions(
    query,
    source === "manga" && searchFocused,
  );
  const showMangaSuggestions =
    source === "manga" && searchFocused && query.trim().length >= 3 && mangaSuggestions.length > 0;

  function resetIdleTimer() {
    if (!initialIdleAutoHide) return;
    setUiVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setUiVisible(false), 30_000);
  }

  useEffect(() => {
    if (!initialIdleAutoHide) return;
    idleTimerRef.current = setTimeout(() => setUiVisible(false), 30_000);
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [initialIdleAutoHide]);

  // Clé TMDB (auto-complete) : re-fetch seulement si non injectée par useAppInit.
  useEffect(() => {
    if (initialTmdbKey === undefined) {
      getApiKey("tmdb_api_key").then((v) => setTmdbKey(v || null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const { c411Key, allDebridKey, patchnotesSeen, searchViewMode } = initialPropsRef.current;

    // On ne re-fetch les clés que si elles n'ont pas été injectées
    // (ex: navigation retour vers MainPage depuis une autre page).
    const needsKeys = !c411Key && !allDebridKey;
    const needsPrefs = searchViewMode === undefined || patchnotesSeen === undefined;

    if (!needsKeys && !needsPrefs) return;

    const jobs: Promise<unknown>[] = [];
    if (needsKeys) {
      jobs.push(
        Promise.all([getApiKey("c411_api_key"), getApiKey("alldebrid_api_key")]).then(
          ([fetchedC411Key, fetchedAllDebridKey]) => {
            if (fetchedC411Key) apiKeyRef.current = fetchedC411Key;
            if (fetchedAllDebridKey) allDebridKeyRef.current = fetchedAllDebridKey;
          },
        ),
      );
    }
    if (needsPrefs) {
      jobs.push(
        Promise.all([
          store.get<string>("patchnotes_seen"),
          resolvePageViewMode(store, "search"),
        ]).then(([fetchedPatchnotesSeen, fetchedSearchViewMode]) => {
          if (patchnotesSeen === undefined && fetchedPatchnotesSeen !== LATEST_VERSION) {
            setShowPatchNotif(true);
          }
          if (searchViewMode === undefined) {
            setSimpleSearchView(fetchedSearchViewMode === "simple");
          }
        }),
      );
    }
    Promise.allSettled(jobs);
  }, []);

  async function dismissPatchNotif() {
    setShowPatchNotif(false);
    await store.set("patchnotes_seen", LATEST_VERSION);
    await store.save();
  }

  useEffect(() => {
    if (!debridModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDebridModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [debridModal]);

  async function handleSendToDebrid(result: SearchResult, index: number, addToLibrary = false) {
    if (sendingIndex !== null || libraryIndex !== null) return;
    if (!allDebridKeyRef.current) {
      toast.error("Cle AllDebrid manquante. Configurez-la dans les parametres.");
      return;
    }

    if (!result.magnet && !result.guid) {
      toast.error("GUID du torrent introuvable.");
      return;
    }

    const setBusy = addToLibrary ? setLibraryIndex : setSendingIndex;
    setBusy(index);
    try {
      const json = await invoke<{
        status: string;
        data?: {
          files?: Array<{ id: number; name: string; ready: boolean }>;
          magnets?: Array<{ id: number; name: string; ready: boolean }>;
        };
        error?: { message: string };
      }>(
        result.magnet ? "upload_magnet_to_debrid" : "upload_torrent_to_debrid",
        result.magnet
          ? { magnet: result.magnet, alldebridKey: allDebridKeyRef.current }
          : {
              // Torznab standard download: ?t=get&id={guid}&apikey={key}
              torrentUrl: `https://c411.org/api?t=get&id=${encodeURIComponent(result.guid)}&apikey=${apiKeyRef.current}`,
              alldebridKey: allDebridKeyRef.current,
            },
      );

      if (json.status !== "success")
        throw new Error(json.error?.message ?? "Erreur AllDebrid inconnue");

      const uploaded = json.data?.files?.[0] ?? json.data?.magnets?.[0];
      if (!uploaded) throw new Error("Reponse AllDebrid inattendue");

      if (uploaded.ready) {
        const filesJson = await invoke<{
          status: string;
          data?: { magnets?: Array<{ files?: unknown[] }> };
        }>("get_magnet_files", {
          id: uploaded.id,
          alldebridKey: allDebridKeyRef.current,
        });
        const rawFiles = filesJson.data?.magnets?.[0]?.files ?? [];
        const files = flattenFiles(rawFiles);
        const hasVideo = files.some((f) => isVideoFile(f.name));
        if (addToLibrary) {
          toast.success(`Ajoute a la bibliotheque : ${uploaded.name ?? result.title}`, {
            action: { label: "Voir", onClick: () => onNavigate("library") },
          });
        } else {
          setDebridModal({ torrentName: uploaded.name ?? result.title, files });
        }
        if (hasVideo) {
          await recordDownload({
            infoHash: result.guid,
            title: uploaded.name ?? result.title,
            provider: result.magnet ? "nyaa" : "c411",
            category: result.category,
            size: result.size,
            magnetId: uploaded.id,
            files,
            enriched: true,
          });
        }
      } else {
        toast.success(
          addToLibrary
            ? `Ajoute a la bibliotheque : ${uploaded.name ?? result.title} (en cours de debridage)`
            : `Envoye vers AllDebrid : ${uploaded.name ?? result.title} (en cours de debridage)`,
          addToLibrary
            ? { action: { label: "Voir", onClick: () => onNavigate("library") } }
            : undefined,
        );
        await recordDownload({
          infoHash: result.guid,
          title: uploaded.name ?? result.title,
          provider: result.magnet ? "nyaa" : "c411",
          category: result.category,
          size: result.size,
          magnetId: uploaded.id,
          files: [],
          enriched: false,
        });
      }
    } catch (err) {
      toastNetworkError(err, () => handleSendToDebrid(result, index, addToLibrary));
    } finally {
      setBusy(null);
      setOwnedKeys(ownedTmdbKeys(getCachedLibrary() ?? []));
    }
  }

  async function fetchPage(
    pageNum: number,
    sort: SortKey,
    dir: "desc" | "asc",
  ): Promise<C411Response> {
    const params = {
      name: searchedQueryRef.current,
      page: pageNum,
      perPage: PER_PAGE,
      sortBy: API_SORT[sort],
      sortOrder: dir,
    };
    return queryClient.fetchQuery({
      queryKey: c411Keys.search(params),
      queryFn: () => searchTorrents(params, apiKeyRef.current),
      staleTime: 60_000,
    });
  }

  async function fetchNyaaResults(rawQuery: string = query) {
    searchedQueryRef.current = buildNyaaQuery(
      rawQuery.trim(),
      nyaaTeam,
      nyaaQuality,
      nyaaCodec,
      nyaaLanguage,
    );
    const nyaa = await queryClient.fetchQuery({
      queryKey: nyaaKeys.search({ query: searchedQueryRef.current }),
      queryFn: () => searchNyaa({ query: searchedQueryRef.current }),
      staleTime: 60_000,
    });
    const mapped = mapNyaaResults(nyaa);
    setResults(mapped);
    setTotal(mapped.length);
    setTotalPages(1);
  }

  // Prerempli la barre de pre-request avec les valeurs par defaut (parametres).
  useEffect(() => {
    loadNyaaDefaults().then((d) => {
      setNyaaTeam(d.team);
      setNyaaQuality(d.quality);
      setNyaaCodec(d.codec);
      setNyaaLanguage(d.language);
    });
  }, []);

  // Relance la recherche nyaa quand un filtre de pré-request change (debounce).
  useEffect(() => {
    if (source !== "nyaa" || activeSource !== "nyaa" || phase !== "active") return;
    const t = setTimeout(() => {
      setLoading(true);
      setError(null);
      setSearchKey((k) => k + 1);
      fetchNyaaResults()
        .catch((err) => setError(networkErrorMessage(err)))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nyaaTeam, nyaaQuality, nyaaCodec, nyaaLanguage]);

  async function performSearch(src: "c411" | "nyaa", queryOverride?: string) {
    const q = (queryOverride ?? query).trim();
    if (!q) return;

    setPhase((prev) => (prev === "idle" ? "title-exiting" : "active"));
    setLoading(true);
    setError(null);

    try {
      setActiveSource(src);
      setSearchKey((k) => k + 1);
      setActiveCats([]);
      setActiveQualities([]);
      setActiveCodecs([]);
      setSortBy("pertinence");
      setSortDir("desc");
      setPage(1);

      if (src === "nyaa") {
        await fetchNyaaResults(q);
      } else {
        searchedQueryRef.current = q;
        const json = await fetchPage(1, "pertinence", "desc");
        setResults(mapTorrents(json.data));
        setTotal(json.meta.total);
        setTotalPages(json.meta.totalPages);
      }
    } catch (err) {
      setError(networkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Arrivee depuis la fiche Decouverte ("Aucune version") : on lance directement
  // la recherche brute sur le tracker choisi, requete deja pre-remplie au montage.
  useEffect(() => {
    if (!initialSearch) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    performSearch(initialSearch.source, initialSearch.query);
    onSearchConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (source === "discover") {
      onLaunchDiscover(q);
      return;
    }
    if (source === "manga") {
      onLaunchDiscoverManga(q);
      return;
    }
    if (source === "c411") {
      searchInputRef.current?.blur();
      setSearchFocused(false);
    }
    performSearch(source);
  }

  // Sélection d'une suggestion : on ouvre directement la fiche du titre dans
  // la page Découverte.
  function selectSuggestion(item: TmdbItem) {
    setHighlightedIndex(-1);
    searchInputRef.current?.blur();
    setSearchFocused(false);
    onLaunchDiscoverItem(item);
  }

  // Sélection d'une suggestion MangaDex : ouvre la fiche du manga dans
  // l'onglet Mangas de la page Découverte.
  function selectMangaSuggestion(item: MangaItem) {
    setHighlightedIndex(-1);
    searchInputRef.current?.blur();
    setSearchFocused(false);
    onLaunchDiscoverMangaItem(item);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const list = showSuggestions ? suggestions : showMangaSuggestions ? mangaSuggestions : null;
    if (!list || list.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((h) => (h + 1) % list.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((h) => (h <= 0 ? list.length - 1 : h - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      // Entrée sur une suggestion surlignée = clic. Sinon : submit libre normal.
      e.preventDefault();
      if (showSuggestions) selectSuggestion(suggestions[highlightedIndex]);
      else selectMangaSuggestion(mangaSuggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setHighlightedIndex(-1);
      searchInputRef.current?.blur();
      setSearchFocused(false);
    }
  }

  // Changement de mode via le dropdown. On ne soumet pas automatiquement ;
  // seule exception : basculer entre trackers bruts pendant qu'on affiche déjà
  // des résultats relance la recherche sur le nouveau site.
  function selectSource(src: SearchMode) {
    if (src === source) return;
    setSource(src);
    if ((src === "c411" || src === "nyaa") && phase === "active" && query.trim())
      performSearch(src);
  }

  async function goToPage(pageNum: number, sort: SortKey = sortBy, dir: "desc" | "asc" = sortDir) {
    if (loading) return;
    setLoading(true);
    try {
      const json = await fetchPage(pageNum, sort, dir);
      setResults(mapTorrents(json.data));
      setTotal(json.meta.total);
      setTotalPages(json.meta.totalPages);
      setPage(pageNum);
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toastNetworkError(err, () => goToPage(pageNum, sort, dir));
    } finally {
      setLoading(false);
    }
  }

  function changeSort(key: SortKey) {
    setSortBy(key);
    goToPage(1, key, sortDir);
  }

  function changeSortDir(dir: "desc" | "asc") {
    setSortDir(dir);
    goToPage(1, sortBy, dir);
  }

  const parsedResults = useMemo(
    () =>
      (results ?? []).map((r) => ({
        result: r,
        group: getCategoryGroup(r.category),
        parsed: parseRelease(r.title),
      })),
    [results],
  );

  const teamSuggestions = useMemo(() => {
    if (activeSource !== "nyaa") return [];
    return [
      ...new Set(parsedResults.map((p) => p.parsed.team).filter((t): t is string => !!t)),
    ].sort();
  }, [parsedResults, activeSource]);

  const { groupCounts, qualityCounts, codecCounts } = useMemo(() => {
    const gc = new Map<number, number>();
    const qc = new Map<string, number>();
    const cc = new Map<string, number>();
    for (const { group, parsed } of parsedResults) {
      gc.set(group, (gc.get(group) ?? 0) + 1);
      if (parsed.quality) qc.set(parsed.quality, (qc.get(parsed.quality) ?? 0) + 1);
      if (parsed.codec) cc.set(parsed.codec, (cc.get(parsed.codec) ?? 0) + 1);
    }
    return { groupCounts: gc, qualityCounts: qc, codecCounts: cc };
  }, [parsedResults]);

  const displayed = useMemo(() => {
    let list = parsedResults;
    if (activeCats.length > 0) list = list.filter(({ group }) => activeCats.includes(group));
    if (activeQualities.length > 0 || activeCodecs.length > 0)
      list = list.filter(({ parsed }) => {
        return (
          (activeQualities.length === 0 ||
            (parsed.quality !== null && activeQualities.includes(parsed.quality))) &&
          (activeCodecs.length === 0 ||
            (parsed.codec !== null && activeCodecs.includes(parsed.codec)))
        );
      });
    return list;
  }, [parsedResults, activeCats, activeQualities, activeCodecs]);

  const currentMode = SEARCH_MODES.find((m) => m.id === source) ?? SEARCH_MODES[0];
  return (
    <main
      onMouseMove={resetIdleTimer}
      className={`relative flex min-h-screen flex-col transition-opacity duration-1000 ${uiVisible ? "opacity-100" : "opacity-0"} ${
        summerEnabled
          ? ""
          : "bg-[#f4f6fc] bg-[radial-gradient(ellipse_70%_45%_at_50%_52%,_#d7e0fb_0%,_#edf1fa_45%,_#fafbfe_75%)] dark:bg-black dark:bg-[radial-gradient(ellipse_70%_45%_at_50%_52%,_#0c1d56_0%,_#04091a_45%,_#000000_75%)]"
      }`}
    >
      <AnimatePresence>
        {showPatchNotif && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.25,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.4,
            }}
            className="absolute top-4 left-4 z-10 flex items-start gap-3 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl ring-1 ring-black/10 dark:ring-white/10 pl-3 pr-1.5 py-2 shadow-xl"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 ring-1 ring-indigo-500/25">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            </span>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                Nouvelle version V{LATEST_VERSION}
              </p>
              <button
                onClick={() => {
                  dismissPatchNotif();
                  onNavigate("patchnotes");
                }}
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                Lire le patch note
              </button>
            </div>
            <button
              onClick={dismissPatchNotif}
              className="flex h-5 w-5 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 z-10">
        <AppMenu
          currentPage="main"
          onNavigate={onNavigate}
          hasPendingUpdate={hasPendingUpdate}
          onShowPendingUpdate={onShowPendingUpdate}
          devMode={devMode}
          onToggleDevMode={onToggleDevMode}
          onShowUpdatePreview={onShowUpdatePreview}
          onShowMangaWelcome={onShowMangaWelcome}
        />
      </div>

      <div ref={scrollRef} className="flex-1 flex flex-col items-center overflow-y-auto">
        <motion.div
          layout
          transition={{
            type: "spring",
            stiffness: 240,
            damping: 30,
            mass: 0.9,
          }}
          onLayoutAnimationComplete={() => {
            if (phase === "bar-returning") setPhase("idle");
          }}
          className={`relative flex flex-col items-center w-full ${phase === "active" || phase === "results-exiting" ? "mt-16 mb-6" : "my-auto"}`}
        >
          <AnimatePresence
            onExitComplete={() => {
              if (phase === "title-exiting") setPhase("active");
            }}
          >
            {phase === "idle" && (
              <motion.div
                key="discover-cta"
                initial={{ opacity: 0, y: 12 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }}
                exit={{
                  opacity: 0,
                  y: 20,
                  transition: { duration: 0.18, ease: "easeIn" },
                }}
                className="absolute bottom-full mb-28 flex w-full justify-center gap-3"
              >
                <div className="relative">
                  <span
                    aria-hidden
                    className="discover-halo absolute -inset-1 rounded-full blur-[6px]"
                  />
                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigate("discover")}
                    className="group relative z-10 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_100%] animate-[shimmer_4s_linear_infinite] px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 shadow-[0_0_30px_rgba(99,102,241,0.45)] hover:shadow-[0_0_50px_rgba(124,58,237,0.65)] cursor-pointer transition-shadow"
                  >
                    <Compass className="h-4 w-4" />
                    Découvrir
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </motion.button>
                </div>
                <div className="relative">
                  <span
                    aria-hidden
                    className="absolute -inset-1 rounded-full bg-gradient-to-r from-fuchsia-500/50 to-rose-500/50 blur-[8px]"
                  />
                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigate("manga")}
                    className="group relative z-10 flex items-center gap-2 rounded-full bg-zinc-900/90 dark:bg-zinc-900/90 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-fuchsia-400/30 shadow-[0_0_20px_rgba(217,70,239,0.25)] hover:ring-fuchsia-300/50 hover:shadow-[0_0_32px_rgba(217,70,239,0.4)] cursor-pointer transition-all"
                  >
                    <BookOpen className="h-4 w-4 text-fuchsia-400 transition-colors group-hover:text-fuchsia-300" />
                    Manga
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </motion.button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate("library")}
                  className="group relative z-10 flex items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/80 px-5 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200 ring-1 ring-black/10 dark:ring-white/10 shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors"
                >
                  <Library className="h-4 w-4" />
                  Ma bibliothèque
                  <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </motion.button>
              </motion.div>
            )}
            {phase === "idle" && (
              <motion.h1
                key="title"
                variants={titleContainerVariants}
                initial="hidden"
                animate="visible"
                exit={{
                  opacity: 0,
                  y: 20,
                  transition: { duration: 0.18, ease: "easeIn" },
                }}
                className="absolute bottom-full mb-10 flex flex-wrap justify-center gap-x-[0.3em] text-4xl font-light tracking-tight text-zinc-900 dark:text-white overflow-hidden w-full"
              >
                {titleWords.map((word, i) => (
                  <span key={i} className="overflow-hidden inline-block">
                    <motion.span variants={titleWordVariants} className="inline-block">
                      {word}
                    </motion.span>
                  </span>
                ))}
              </motion.h1>
            )}
          </AnimatePresence>

          <form
            onSubmit={handleSubmit}
            onFocus={() => setSearchFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setSearchFocused(false);
            }}
            className="relative w-full max-w-2xl px-6"
          >
            <div
              className={`relative overflow-hidden border bg-white/90 dark:bg-zinc-800/80 transition-[border-radius,border-color,box-shadow] duration-300 ease-out ${
                MODE_BAR_ACCENT[source]
              } ${showSuggestions || showMangaSuggestions ? "rounded-[28px]" : "rounded-[34px]"}`}
            >
              <div className="relative flex items-center gap-2 px-6 py-4">
                {loading || suggestionsLoading || mangaSuggestionsLoading ? (
                  <Loader2 className="h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400 animate-spin" />
                ) : (
                  <Search className="h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400" />
                )}
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setHighlightedIndex(-1);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={
                    source === "manga"
                      ? "Rechercher un manga..."
                      : "Rechercher un film, une serie..."
                  }
                  className="flex-1 min-w-0 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-500 outline-none text-lg"
                />
                <AnimatePresence>
                  {query.trim() && (
                    <motion.button
                      key="submit-btn"
                      initial={{ opacity: 0, scale: 0.7, width: 0 }}
                      animate={{ opacity: 1, scale: 1, width: 36 }}
                      exit={{ opacity: 0, scale: 0.7, width: 0 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      type="submit"
                      className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors"
                    >
                      <ArrowUp className="h-4 w-4 text-white" />
                    </motion.button>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {(query.trim() || results !== null) && (
                    <motion.button
                      key="clear-btn"
                      initial={{ opacity: 0, scale: 0.7, width: 0 }}
                      animate={{ opacity: 1, scale: 1, width: 36 }}
                      exit={{ opacity: 0, scale: 0.7, width: 0 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setError(null);
                        const hasResults = results !== null && results.length > 0;
                        setResults(null);
                        setPhase((prev) => {
                          if (prev !== "active") return "idle";
                          return hasResults ? "results-exiting" : "bar-returning";
                        });
                      }}
                      className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200/90 dark:bg-zinc-700/80 hover:bg-zinc-300 dark:hover:bg-zinc-600/80 transition-colors"
                    >
                      <X className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                    </motion.button>
                  )}
                </AnimatePresence>
                <div className="h-6 w-px shrink-0 bg-black/10 dark:bg-white/10" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Choisir le mode de recherche"
                      className="group relative shrink-0 flex items-center gap-1 h-9 pl-2 pr-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                    >
                      {currentMode.icon ? (
                        <currentMode.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <img
                          src={currentMode.logo}
                          alt=""
                          className="h-5 w-5 rounded-full object-cover bg-white"
                        />
                      )}
                      <ChevronDown className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Rechercher via
                    </DropdownMenuLabel>
                    {SEARCH_MODES.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onSelect={(e) => e.preventDefault()}
                        onClick={() => selectSource(m.id)}
                        className={
                          "cursor-pointer not-first:mt-1" +
                          (source === m.id
                            ? " bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                            : "")
                        }
                      >
                        <span className="flex items-center gap-3">
                          {m.icon ? (
                            <m.icon className="h-4 w-4 shrink-0" />
                          ) : (
                            <img
                              src={m.logo}
                              alt=""
                              className="h-4 w-4 shrink-0 rounded-full object-cover bg-white"
                            />
                          )}
                          <span className="flex flex-col">
                            <span className="text-sm leading-tight">{m.label}</span>
                            <span className="text-[11px] leading-tight opacity-70">{m.tip}</span>
                          </span>
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <AnimatePresence>
                {showSuggestions && (
                  <SearchSuggestions
                    suggestions={suggestions}
                    ownedKeys={ownedKeys}
                    highlightedIndex={highlightedIndex}
                    onSelect={selectSuggestion}
                    onHover={setHighlightedIndex}
                  />
                )}
                {showMangaSuggestions && (
                  <MangaSearchSuggestions
                    suggestions={mangaSuggestions}
                    ownedIds={ownedMangas}
                    highlightedIndex={highlightedIndex}
                    onSelect={selectMangaSuggestion}
                    onHover={setHighlightedIndex}
                  />
                )}
              </AnimatePresence>
            </div>
            <div className="absolute left-0 right-0 top-full mt-3 px-6 flex flex-col items-center gap-3">
              <AnimatePresence>
                {source === "nyaa" && (searchFocused || phase === "active") && (
                  <motion.div
                    key="nyaa-filters"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={pillStaggerVariants}
                    className="flex flex-wrap items-center justify-center gap-2"
                  >
                    <NyaaSearchFilters
                      team={nyaaTeam}
                      quality={nyaaQuality}
                      codec={nyaaCodec}
                      language={nyaaLanguage}
                      teamSuggestions={teamSuggestions}
                      itemVariants={pillItemVariants}
                      onTeam={setNyaaTeam}
                      onQuality={setNyaaQuality}
                      onCodec={setNyaaCodec}
                      onLanguage={setNyaaLanguage}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
          {/* Reserve l'espace des filtres nyaa pour que les resultats se
              decalent dessous au lieu d'etre recouverts. */}
          <motion.div
            aria-hidden
            initial={false}
            animate={{ height: phase === "active" && source === "nyaa" ? 104 : 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <NetworkErrorState message={error} onRetry={() => performSearch(activeSource)} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "active" && results !== null && results.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-zinc-500 text-sm"
            >
              Aucun resultat pour "{query}".
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence
          onExitComplete={() => {
            if (phase === "results-exiting") setPhase("bar-returning");
          }}
        >
          {phase === "active" && results && results.length > 0 && (
            <motion.div
              key={searchKey}
              className="w-full max-w-2xl px-6 space-y-2 pb-6"
              initial="hidden"
              animate="visible"
              exit={{
                opacity: 0,
                y: 14,
                transition: { duration: 0.2, ease: "easeIn" },
              }}
            >
              {source === "c411" && (
                <>
                  <div className="flex flex-wrap items-center gap-2 pb-1">
                    {CATEGORY_FILTERS.map(({ key, label, icon: Icon, color }) => {
                      const count = groupCounts.get(key);
                      if (!count) return null;
                      const active = activeCats.includes(key);
                      return (
                        <button
                          key={key}
                          onClick={() =>
                            setActiveCats((prev) =>
                              prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
                            )
                          }
                          className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium ring-1 transition-colors ${
                            active
                              ? "bg-indigo-600 text-white ring-indigo-500"
                              : "bg-white/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 ring-black/10 dark:ring-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white"
                          }`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : color}`} />
                          {label}
                          <span
                            className={
                              active ? "text-indigo-200" : "text-zinc-400 dark:text-zinc-600"
                            }
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                    {source === "c411" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            {SORT_LABELS[sortBy]}
                            {sortBy !== "pertinence" &&
                              (sortDir === "desc" ? (
                                <ArrowDown className="h-3 w-3" />
                              ) : (
                                <ArrowUp className="h-3 w-3" />
                              ))}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Trier par
                          </DropdownMenuLabel>
                          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                            <DropdownMenuCheckboxItem
                              key={key}
                              checked={sortBy === key}
                              onSelect={(e) => e.preventDefault()}
                              onCheckedChange={() => changeSort(key)}
                            >
                              {SORT_LABELS[key]}
                            </DropdownMenuCheckboxItem>
                          ))}
                          {sortBy !== "pertinence" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-xs text-muted-foreground">
                                Ordre
                              </DropdownMenuLabel>
                              <DropdownMenuCheckboxItem
                                checked={sortDir === "desc"}
                                onSelect={(e) => e.preventDefault()}
                                onCheckedChange={() => changeSortDir("desc")}
                              >
                                <ArrowDown className="mr-2 h-3.5 w-3.5" />
                                Décroissant
                              </DropdownMenuCheckboxItem>
                              <DropdownMenuCheckboxItem
                                checked={sortDir === "asc"}
                                onSelect={(e) => e.preventDefault()}
                                onCheckedChange={() => changeSortDir("asc")}
                              >
                                <ArrowUp className="mr-2 h-3.5 w-3.5" />
                                Croissant
                              </DropdownMenuCheckboxItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {(qualityCounts.size > 0 || codecCounts.size > 0) && (
                    <div className="flex flex-wrap items-center gap-2 pb-1">
                      {QUALITY_ORDER.filter((q) => qualityCounts.has(q)).map((q) => {
                        const active = activeQualities.includes(q);
                        return (
                          <button
                            key={q}
                            onClick={() =>
                              setActiveQualities((prev) =>
                                prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q],
                              )
                            }
                            className={`flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ring-1 transition-colors ${
                              active
                                ? "bg-indigo-600 text-white ring-indigo-500"
                                : "bg-white/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 ring-black/10 dark:ring-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white"
                            }`}
                          >
                            {q}
                            <span
                              className={
                                active ? "text-indigo-200" : "text-zinc-400 dark:text-zinc-600"
                              }
                            >
                              {qualityCounts.get(q)}
                            </span>
                          </button>
                        );
                      })}
                      {qualityCounts.size > 0 && codecCounts.size > 0 && (
                        <div className="h-4 w-px bg-black/10 dark:bg-white/10" />
                      )}
                      {[...codecCounts.entries()]
                        .sort((a, b) => b[1] - a[1])
                        .map(([codec, count]) => {
                          const active = activeCodecs.includes(codec);
                          return (
                            <button
                              key={codec}
                              onClick={() =>
                                setActiveCodecs((prev) =>
                                  prev.includes(codec)
                                    ? prev.filter((x) => x !== codec)
                                    : [...prev, codec],
                                )
                              }
                              className={`flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ring-1 transition-colors ${
                                active
                                  ? "bg-indigo-600 text-white ring-indigo-500"
                                  : "bg-white/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 ring-black/10 dark:ring-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white"
                              }`}
                            >
                              {codec}
                              <span
                                className={
                                  active ? "text-indigo-200" : "text-zinc-400 dark:text-zinc-600"
                                }
                              >
                                {count}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </>
              )}
              {displayed.length === 0 && results !== null && results.length > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-zinc-500 py-4"
                >
                  Aucun résultat avec ces filtres.
                </motion.p>
              )}
              <AnimatePresence mode="popLayout">
                {displayed.map(({ result: r, parsed: p }, i) => {
                  const { icon: Icon, color } = getCategoryIcon(r.category);
                  const parsed = simpleSearchView ? p : null;
                  const cbz = cbzReleaseFromResult(r);
                  return (
                    <motion.div
                      key={r.guid || `${r.title}-${r.size}`}
                      layout
                      custom={i}
                      variants={itemVariants}
                      exit={{
                        opacity: 0,
                        scale: 0.96,
                        transition: { duration: 0.15, ease: "easeIn" },
                      }}
                      className="flex items-center gap-4 rounded-lg bg-white/80 dark:bg-zinc-800/60 ring-1 ring-black/8 dark:ring-white/8 px-4 py-3 transition-colors duration-150 hover:bg-white dark:hover:bg-zinc-700/60 hover:ring-black/15 dark:hover:ring-white/15"
                    >
                      <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                      <div className="min-w-0 flex-1">
                        {parsed &&
                          (parsed.quality ||
                            parsed.codec ||
                            parsed.language ||
                            (activeSource === "nyaa" && parsed.team)) && (
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              {parsed.quality && (
                                <span className="rounded-md bg-indigo-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                                  {parsed.quality}
                                </span>
                              )}
                              {parsed.codec && (
                                <span className="rounded-md bg-black/6 dark:bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                  {parsed.codec}
                                </span>
                              )}
                              {parsed.language && (
                                <span className="rounded-md bg-blue-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                                  {parsed.language}
                                </span>
                              )}
                              {activeSource === "nyaa" && parsed.team && (
                                <span className="rounded-md bg-emerald-500/12 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-700 dark:text-emerald-300">
                                  {parsed.team}
                                </span>
                              )}
                            </div>
                          )}
                        <p className="text-sm text-zinc-900 dark:text-white font-medium leading-snug line-clamp-2">
                          {parsed ? parsed.title : r.title}
                        </p>
                        <div className="mt-1 flex items-center gap-4 text-xs text-zinc-500">
                          <span>{formatSize(r.size)}</span>
                          <span className="text-green-500">{r.seeders} Seeders</span>
                          <span className="text-red-500">{r.leechers} Leechers</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {cbz && (
                          <div className="group relative">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setMangaLink(cbz)}
                              disabled={addingHash !== null}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/8 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              {addingHash === cbz.infoHash ? (
                                <Loader2 className="h-4 w-4 text-rose-600 dark:text-rose-300 animate-spin" />
                              ) : (
                                <BookMarked className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                              )}
                            </motion.button>
                            <span className="pointer-events-none absolute right-0 bottom-full mb-2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 ring-1 ring-black/10 dark:ring-white/10 shadow-lg opacity-0 transition-opacity duration-150 delay-500 group-hover:opacity-100">
                              Ajouter à ma bibliothèque manga
                            </span>
                          </div>
                        )}
                        {isVideoCategory(r.category) && (
                          <div className="group relative">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleSendToDebrid(r, i, true)}
                              disabled={sendingIndex !== null || libraryIndex !== null}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/8 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              {libraryIndex === i ? (
                                <Loader2 className="h-4 w-4 text-indigo-600 dark:text-indigo-300 animate-spin" />
                              ) : (
                                <BookmarkPlus className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                              )}
                            </motion.button>
                            <span className="pointer-events-none absolute right-0 bottom-full mb-2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 ring-1 ring-black/10 dark:ring-white/10 shadow-lg opacity-0 transition-opacity duration-150 delay-500 group-hover:opacity-100">
                              Ajouter à la bibliothèque
                            </span>
                          </div>
                        )}
                        <div className="group relative">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleSendToDebrid(r, i)}
                            disabled={sendingIndex !== null || libraryIndex !== null}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/80 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            {sendingIndex === i ? (
                              <Loader2 className="h-4 w-4 text-white animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 text-white" />
                            )}
                          </motion.button>
                          <span className="pointer-events-none absolute right-0 bottom-full mb-2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 ring-1 ring-black/10 dark:ring-white/10 shadow-lg opacity-0 transition-opacity duration-150 delay-500 group-hover:opacity-100">
                            Télécharger
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {totalPages > 1 && (
                <motion.div layout className="flex items-center justify-center gap-1.5 pt-3">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1 || loading}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {pageNumbers(page, totalPages).map((p, i) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-1 text-sm text-zinc-400 dark:text-zinc-600"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        disabled={loading || p === page}
                        className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm ring-1 transition-colors ${
                          p === page
                            ? "bg-indigo-600 text-white ring-indigo-500"
                            : "bg-white/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 ring-black/10 dark:ring-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white disabled:opacity-40"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages || loading}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
              {total !== null && (
                <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 pt-1">
                  {total} résultat{total > 1 ? "s" : ""}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {debridModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setDebridModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl ring-1 ring-black/10 dark:ring-white/10 overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
                      Fichiers disponibles
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug line-clamp-2">
                      {debridModal.torrentName}
                    </p>
                  </div>
                  <button
                    onClick={() => setDebridModal(null)}
                    className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                  </button>
                </div>
              </div>

              {/* File list */}
              <div className="max-h-80 overflow-y-auto px-3 pb-3 space-y-1.5">
                {debridModal.files.map((file, i) => {
                  const fileName = file.name.split("/").pop() ?? file.name;
                  const showName = fileName !== debridModal.torrentName;
                  return (
                    <div key={i} className="rounded-xl bg-white/80 dark:bg-zinc-800/60 px-4 py-3">
                      <div className="mb-3">
                        {showName && (
                          <p className="text-sm font-medium text-zinc-900 dark:text-white leading-snug line-clamp-2 mb-0.5">
                            {fileName}
                          </p>
                        )}
                        <p className="text-xs text-zinc-500">{formatSize(file.size)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleOpenVlc(file.link)}
                          disabled={
                            downloadingLink !== null || copiedLink !== null || vlcLink !== null
                          }
                          className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {vlcLink === file.link ? (
                            <Loader2 className="h-3.5 w-3.5 text-zinc-900 dark:text-white animate-spin" />
                          ) : (
                            <img src={vlcLogo} className="h-4 w-4" />
                          )}
                          <span className="text-xs font-medium text-zinc-900 dark:text-white">
                            Lire avec VLC
                          </span>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleCopyLink(file.link)}
                          disabled={
                            downloadingLink !== null || copiedLink !== null || vlcLink !== null
                          }
                          className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {copiedLink === file.link ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                Copie !
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
                              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                Copier le lien
                              </span>
                            </>
                          )}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            handleDownloadFile(file.link);
                            setDebridModal(null);
                          }}
                          disabled={
                            downloadingLink !== null || copiedLink !== null || vlcLink !== null
                          }
                          className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {downloadingLink === file.link ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                              <span className="text-xs font-medium text-white">Ouverture...</span>
                            </>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5 text-white" />
                              <span className="text-xs font-medium text-white">Telecharger</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mangaLink && (
          <MangaLinkModal
            release={mangaLink}
            busy={addingHash !== null}
            onPick={addRelease}
            onClose={() => setMangaLink(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
