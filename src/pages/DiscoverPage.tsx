import { AppMenu, type Page } from "@/components/AppMenu";
import { DebridFilesModal } from "@/components/DebridFilesModal";
import { DiscoverMangaSection } from "@/components/DiscoverMangaSection";
import { DiscoverPosterCard } from "@/components/DiscoverPosterCard";
import { DiscoverReleasesModal } from "@/components/DiscoverReleasesModal";
import { DiscoverSearchBar } from "@/components/DiscoverSearchBar";
import { DiscoverSearchFilters } from "@/components/DiscoverSearchFilters";
import { DiscoverTabs } from "@/components/DiscoverTabs";
import { getApiKey } from "@/lib/apiKeys";
import {
  filterTvReleases,
  releasesQueryKey,
  searchC411,
  sortOccupants,
} from "@/lib/discoverReleases";
import { getCachedLibrary, loadLibrary } from "@/lib/library";
import { LETTERBOXD_FEED } from "@/lib/letterboxdFeed";
import { type LikedItem } from "@/lib/likes";
import { queryClient } from "@/lib/queryClient";
import { useLikes } from "@/lib/useLikes";
import { ownedTmdbKeys } from "@/lib/recommendations";
import type { MangaItem } from "@/lib/mangaItem";
import type { TmdbItem } from "@/lib/tmdbItem";
import { FEED_LABELS, useDiscoverFeed, type DiscoverTab } from "@/lib/useDiscoverFeed";
import { useRecommendations } from "@/lib/useRecommendations";
import { useSendToDebrid } from "@/lib/useSendToDebrid";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface DiscoverPageProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  hasPendingUpdate: boolean;
  onShowPendingUpdate: () => void;
  summerEnabled: boolean;
  /** Requête pré-remplie depuis la barre de MainPage (mode "Films & Séries") */
  initialQuery?: string;
  /** Onglet ouvert à l'arrivée (ex. "manga" depuis la bibliothèque manga) */
  initialTab?: DiscoverTab;
  /** Fiche à ouvrir directement (sélection d'une suggestion d'auto-complete) */
  initialItem?: TmdbItem | null;
  /** Requête MangaDex pré-remplie depuis la barre de MainPage (mode "Mangas") */
  initialMangaQuery?: string;
  /** Fiche manga à ouvrir directement (suggestion MangaDex de MainPage) */
  initialMangaItem?: MangaItem | null;
  /** Clé TMDB pré-chargée par useAppInit */
  initialTmdbKey?: string | null;
  /** Clés C411 et AllDebrid pré-chargées par useAppInit */
  initialC411Key?: string | null;
  initialAllDebridKey?: string | null;
  /** Likes pré-chargés par useAppInit */
  initialLikes?: LikedItem[];
  /** Lance une recherche brute sur un tracker (C411 / Nyaa) via la page principale */
  onSearchTracker: (query: string, source: "c411" | "nyaa") => void;
  /** Ouvre directement la fiche bibliothèque d'un titre (action "Voir" des toasts) */
  onOpenLibraryItem: (item: TmdbItem, infoHash: string) => void;
  /** Ouvre la bibliothèque manga, éventuellement sur une oeuvre donnée */
  onOpenMangaLibrary: (mangaId?: string) => void;
}

export function DiscoverPage({
  onBack,
  onNavigate,
  hasPendingUpdate,
  onShowPendingUpdate,
  summerEnabled,
  initialQuery,
  initialTab,
  initialItem,
  initialMangaQuery,
  initialMangaItem,
  initialTmdbKey,
  initialC411Key,
  initialAllDebridKey,
  initialLikes,
  onSearchTracker,
  onOpenLibraryItem,
  onOpenMangaLibrary,
}: DiscoverPageProps) {
  const [tmdbKey, setTmdbKey] = useState<string | null | undefined>(
    initialTmdbKey !== undefined ? initialTmdbKey : undefined,
  );
  const { likes, likedKeys, toggleLike } = useLikes(initialLikes);
  const [selected, setSelected] = useState<TmdbItem | null>(null);
  // Recherche de l'onglet Mangas : la barre du haut est partagée, son contenu
  // dépend de l'univers affiché (TMDB ou MangaDex).
  const [mangaQuery, setMangaQuery] = useState(initialMangaQuery ?? "");
  // Fiche manga ouverte : Escape lui revient, pas au retour accueil.
  const [mangaBusy, setMangaBusy] = useState(false);

  const c411KeyRef = useRef<string>(initialC411Key ?? "");
  const allDebridKeyRef = useRef<string>(initialAllDebridKey ?? "");
  const prefersReducedMotion = useReducedMotion();

  const {
    query,
    setQuery,
    mediaType,
    feed,
    items,
    mode,
    searchedQuery,
    searchFilter,
    tmdbPage,
    tmdbTotalPages,
    loadingMovies,
    moviesError,
    tmdbKeyInvalid,
    loadMoreRef,
    feedMode,
    searchUiActive,
    gridKey,
    showTop,
    startGeneralSearch,
    changeSearchFilter,
    handleSubmit,
    clearSearch,
    switchType,
    switchFeed,
  } = useDiscoverFeed(tmdbKey, initialQuery, initialTab);

  const recosApi = useRecommendations(tmdbKey, likes);

  // Ids TMDB deja presents dans la bibliotheque : badge "Dans la bibliotheque"
  // sur les affiches. Rafraichi apres chaque ajout depuis cette page.
  const [ownedKeys, setOwnedKeys] = useState<Set<string>>(() =>
    ownedTmdbKeys(getCachedLibrary() ?? []),
  );
  useEffect(() => {
    void loadLibrary().then((lib) => setOwnedKeys(ownedTmdbKeys(lib)));
  }, []);

  const { sendingHash, libraryHash, debridModal, setDebridModal, sendToDebrid } = useSendToDebrid({
    getC411Key: () => c411KeyRef.current,
    getAllDebridKey: () => allDebridKeyRef.current,
    onOpenLibrary: onOpenLibraryItem,
    onLibraryChange: () => setOwnedKeys(ownedTmdbKeys(getCachedLibrary() ?? [])),
  });

  useEffect(() => {
    // Ne re-fetch les clés que si elles n'ont pas été injectées par useAppInit.
    // These are intentional initial-value props — only read once on mount.
    if (initialC411Key === undefined) {
      getApiKey("c411_api_key").then((v) => {
        if (v) c411KeyRef.current = v;
      });
    }
    if (initialAllDebridKey === undefined) {
      getApiKey("alldebrid_api_key").then((v) => {
        if (v) allDebridKeyRef.current = v;
      });
    }
    if (initialTmdbKey === undefined) {
      getApiKey("tmdb_api_key").then((v) => setTmdbKey(v || null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Selection d'un item : les saisons (TV) et les releases sont chargees par
  // les queries reactives de DiscoverReleasesModal.
  // Pour les series TV, on lance immediatement un prefetch C411 en fire-and-forget
  // (le titre est connu des maintenant) en parallele du tvDetailQuery TMDB.
  // Quand tvDetailQuery revient et active releasesQuery, les torrents sont
  // souvent deja en cache → affichage quasi-instantane.
  const openItem = useCallback((item: TmdbItem) => {
    setSelected(item);

    if (item.mediaType === "tv") {
      // Prefetch C411 : saison null = tous les torrents bruts, la saison sera
      // filtree plus tard par releasesQuery.queryFn quand activeSeason est connu.
      // On utilise la meme queryKey que releasesQuery avec saison null pour que
      // le cache soit reutilise directement (la saison par defaut est la 1 et
      // filterTvReleases sera applique dans queryFn une seule fois).
      queryClient.prefetchQuery({
        queryKey: releasesQueryKey(item.mediaType, item.id, null),
        queryFn: () =>
          searchC411(item, c411KeyRef.current).then(({ torrents, nTitles }) =>
            sortOccupants(filterTvReleases(torrents, nTitles, null)),
          ),
        staleTime: 60_000,
      });
    }
    // searchC411 ne depend que de refs et d'aides module-level : stable.
  }, []);

  useEffect(() => {
    if (!tmdbKey || mediaType === "manga") return;
    // Arrivée depuis la barre de MainPage : on lance directement la recherche
    // TMDB sur l'onglet Films (le terme est conservé si on bascule vers Séries).
    const q = initialQuery?.trim();
    if (q) {
      startGeneralSearch(q);
      // Suggestion d'auto-complete : on ouvre la fiche du titre APRÈS la
      // transition d'entrée de la page, pour éviter que les deux animations se
      // superposent (ouverture "brutale"). La recherche générale reste en fond.
      if (initialItem) {
        const item = initialItem;
        const timer = setTimeout(() => openItem(item), 420);
        return () => clearTimeout(timer);
      }
      return;
    }
    // Données préchauffées au démarrage : lecture directe du cache, sans spinner.
    showTop("movie", "top_rated");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tmdbKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (debridModal) setDebridModal(null);
      else if (selected) setSelected(null);
      else if (mangaBusy) return;
      else onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debridModal, selected, mangaBusy, onBack]);

  function switchTab(t: Exclude<DiscoverTab, "all">) {
    if (t === "recos" && mediaType !== "recos" && !recosApi.loading) recosApi.load();
    switchType(t);
  }

  const displayItems =
    mediaType === "likes" ? likes : mediaType === "recos" ? recosApi.recos : items;

  // Le classement Letterboxd est servi dans l'ordre : la position de l'affiche
  // dans la grille est son rang.
  const showRank = mode === "top" && mediaType === "movie" && feed === LETTERBOXD_FEED;

  return (
    <main
      className={`relative isolate flex min-h-screen flex-col ${
        summerEnabled ? "" : "bg-[#f4f6fc] dark:bg-[#04050c]"
      }`}
    >
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={prefersReducedMotion ? {} : { opacity: [0.7, 1, 0.7], scale: [1, 1.08, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 left-1/2 -translate-x-1/2 h-[440px] w-[700px] rounded-full bg-indigo-600/25 blur-[120px]"
        />
        <div className="absolute top-1/3 -left-40 h-80 w-80 rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="absolute -bottom-24 -right-32 h-96 w-96 rounded-full bg-sky-500/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.10)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_45%_at_50%_22%,black,transparent_75%)]" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/30 backdrop-blur-xl">
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 sm:px-8">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onBack}
            className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </motion.button>

          <h1 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight absolute left-1/2 -translate-x-1/2">
            Découverte
          </h1>

          <AppMenu
            currentPage="discover"
            onNavigate={onNavigate}
            onBack={onBack}
            hasPendingUpdate={hasPendingUpdate}
            onShowPendingUpdate={onShowPendingUpdate}
          />
        </div>
      </div>

      {/* Missing or invalid TMDB key */}
      {(tmdbKey === null || tmdbKeyInvalid) && mediaType !== "manga" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/12 ring-1 ring-indigo-500/25">
            <KeyRound className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              {tmdbKeyInvalid ? "Clé API TMDB invalide" : "Clé API TMDB manquante"}
            </p>
            <p className="mt-1 max-w-sm text-xs text-zinc-500 leading-relaxed">
              {tmdbKeyInvalid
                ? "TMDB a refusé votre clé. Vérifiez-la dans les paramètres ou créez-en une nouvelle sur themoviedb.org."
                : "La page Découverte utilise The Movie Database pour lister les films. Créez une clé gratuite sur themoviedb.org puis ajoutez-la dans les paramètres."}
            </p>
          </div>
          <button
            onClick={() => onNavigate("preferences")}
            className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Ouvrir les paramètres
          </button>
        </div>
      )}

      <div className="mx-auto w-full max-w-5xl px-6 pt-8 sm:px-8">
        {(mediaType === "manga" || (tmdbKey && !tmdbKeyInvalid)) && (
          <DiscoverSearchBar
            visible={feedMode || mediaType === "manga"}
            query={mediaType === "manga" ? mangaQuery : query}
            placeholder={
              mediaType === "manga" ? "Rechercher un manga" : "Rechercher un film ou une série"
            }
            loading={mediaType === "manga" ? false : loadingMovies}
            showClear={
              mediaType === "manga" ? !!mangaQuery.trim() : !!query.trim() || mode === "search"
            }
            onQueryChange={mediaType === "manga" ? setMangaQuery : setQuery}
            onClear={mediaType === "manga" ? () => setMangaQuery("") : clearSearch}
            onSubmit={mediaType === "manga" ? (e) => e.preventDefault() : handleSubmit}
          />
        )}

        <DiscoverTabs
          collapsed={searchUiActive}
          mediaType={mediaType}
          feed={feed}
          mode={mode}
          onSwitchType={switchTab}
          onSwitchFeed={switchFeed}
        />
      </div>

      {mediaType === "manga" && (
        <div className="mx-auto w-full max-w-5xl flex-1 px-6 pb-10 sm:px-8">
          <DiscoverMangaSection
            query={mangaQuery}
            initialItem={initialMangaItem}
            getC411Key={() => c411KeyRef.current}
            getAllDebridKey={() => allDebridKeyRef.current}
            onOpenLibrary={onOpenMangaLibrary}
            onBusyChange={setMangaBusy}
          />
        </div>
      )}

      {tmdbKey && !tmdbKeyInvalid && mediaType !== "manga" && (
        <div className="mx-auto w-full max-w-5xl flex-1 px-6 pb-10 sm:px-8">
          <DiscoverSearchFilters
            visible={mode === "search"}
            active={searchFilter}
            onChange={changeSearchFilter}
          />

          <h2 className="mb-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            {mediaType === "likes"
              ? `Ma liste (${likes.length})`
              : mediaType === "recos"
                ? "Pour vous"
                : mode === "search"
                  ? `Résultats pour "${searchedQuery}"`
                  : `${mediaType === "movie" ? "Films" : mediaType === "tv" ? "Séries" : "Animations"} - ${FEED_LABELS[feed]}`}
          </h2>

          {feedMode && moviesError && (
            <p className="text-sm text-red-600 dark:text-red-400">{moviesError}</p>
          )}

          {feedMode && !moviesError && items.length === 0 && !loadingMovies && (
            <p className="text-sm text-zinc-500">Aucun résultat trouvé.</p>
          )}

          {mediaType === "likes" && likes.length === 0 && (
            <p className="text-sm text-zinc-500">
              Aucun contenu enregistré. Cliquez sur le coeur d'une affiche pour l'ajouter à votre
              liste.
            </p>
          )}

          {mediaType === "recos" && recosApi.loading && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          )}

          {mediaType === "recos" && recosApi.error && (
            <p className="text-sm text-red-600 dark:text-red-400">{recosApi.error}</p>
          )}

          {mediaType === "recos" &&
            !recosApi.loading &&
            !recosApi.error &&
            recosApi.recos.length === 0 && (
              <p className="text-sm text-zinc-500">
                Ajoutez des titres à votre liste ou à votre bibliothèque pour obtenir des
                recommandations personnalisées.
              </p>
            )}

          {/* Poster grid */}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={gridKey}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5"
            >
              {displayItems.map((m, i) => {
                const key = `${m.mediaType}-${m.id}`;
                const because = mediaType === "recos" ? recosApi.because.get(key) : undefined;
                return (
                  <DiscoverPosterCard
                    key={`${key}-${i}`}
                    item={m}
                    index={i}
                    liked={likedKeys.has(key)}
                    inLibrary={ownedKeys.has(key)}
                    subtitle={
                      because
                        ? `Car vous avez aimé ${because}`
                        : showRank
                          ? `#${i + 1} - ${m.year}`
                          : m.year
                    }
                    onOpen={openItem}
                    onToggleLike={toggleLike}
                  />
                );
              })}
            </motion.div>
          </AnimatePresence>

          {feedMode && tmdbPage < tmdbTotalPages && items.length > 0 && (
            <div ref={loadMoreRef} className="mt-8 flex h-8 justify-center">
              {loadingMovies && <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />}
            </div>
          )}
        </div>
      )}

      {/* Movie releases modal */}
      <AnimatePresence>
        {selected && tmdbKey && (
          <DiscoverReleasesModal
            item={selected}
            tmdbKey={tmdbKey}
            getC411Key={() => c411KeyRef.current}
            liked={likedKeys.has(`${selected.mediaType}-${selected.id}`)}
            sendingHash={sendingHash}
            libraryHash={libraryHash}
            onToggleLike={toggleLike}
            onClose={() => setSelected(null)}
            onSend={(occ, addToLibrary) => sendToDebrid(occ, selected, addToLibrary)}
            onSearchTracker={onSearchTracker}
          />
        )}
      </AnimatePresence>

      {/* Debrid files modal */}
      <AnimatePresence>
        {debridModal && (
          <DebridFilesModal
            modal={debridModal}
            getAllDebridKey={() => allDebridKeyRef.current}
            onClose={() => setDebridModal(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
