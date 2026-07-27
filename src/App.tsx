import type { Page } from "@/components/AppMenu";
import type { PanelId } from "@/components/settings/settingsNav";
import { DownloadsOverlay } from "@/components/DownloadsOverlay";
import { kingVariant, randomLegendaryVariant } from "@/components/duckRandom";
import { spawnVariant } from "@/components/duckShopBridge";
import { SplashScreen } from "@/components/SplashScreen";
import { SplashTransition } from "@/components/SplashTransition";
import { MangaWelcomeModal } from "@/components/MangaWelcomeModal";
import { Toaster } from "@/components/ui/sonner";
import { UpdateDialog } from "@/components/UpdateDialog";
import { getApiKey } from "@/lib/apiKeys";
import { isBrowserPreview } from "@/lib/devTauriShim";
import { prefetchLibrary } from "@/lib/library";
import { loadCategories } from "@/lib/libraryCategories";
import { loadLibraryPrefs } from "@/lib/libraryPrefs";
import { LATEST_VERSION } from "@/lib/patchnotes";
import type { SearchMode } from "@/lib/searchModes";
import { loadSeriesFolders } from "@/lib/seriesFolders";
import { onSettingsPanelRequest } from "@/lib/settingsNavigation";
import { loadStartupPage } from "@/lib/startupPage";
import type { MangaItem } from "@/lib/mangaItem";
import type { TmdbItem } from "@/lib/tmdbItem";
import type { LibraryTab } from "@/components/LibraryTabs";
import type { DiscoverTab } from "@/lib/useDiscoverFeed";
import { checkForUpdate, type UpdateInfo } from "@/lib/updater";
import { useActionShortcuts } from "@/lib/useActionShortcuts";
import { useAppInit } from "@/lib/useAppInit";
import { useNavShortcuts } from "@/lib/useNavShortcuts";
import { DiscoverPage } from "@/pages/DiscoverPage";
import { LibraryPage } from "@/pages/LibraryPage";
import { LazyStore } from "@tauri-apps/plugin-store";
import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense, useEffect, useState } from "react";

const PixelPool = lazy(() =>
  import("@/components/PixelPool").then((m) => ({ default: m.PixelPool })),
);
const DuckShop = lazy(() => import("@/components/DuckShop").then((m) => ({ default: m.DuckShop })));
const DuckDex = lazy(() => import("@/components/DuckDex").then((m) => ({ default: m.DuckDex })));
const SlotMachine = lazy(() =>
  import("@/components/SlotMachine").then((m) => ({ default: m.SlotMachine })),
);
const SetupPage = lazy(() => import("@/pages/SetupPage").then((m) => ({ default: m.SetupPage })));
const MainPage = lazy(() => import("@/pages/MainPage").then((m) => ({ default: m.MainPage })));
const MagnetsPage = lazy(() =>
  import("@/pages/MagnetsPage").then((m) => ({ default: m.MagnetsPage })),
);
// Page de test dev uniquement : exclue du bundle de production.
const NyaaTestPage = import.meta.env.DEV
  ? lazy(() => import("@/pages/NyaaTestPage").then((m) => ({ default: m.NyaaTestPage })))
  : null;
const PreferencesPage = lazy(() =>
  import("@/pages/PreferencesPage").then((m) => ({ default: m.PreferencesPage })),
);
const PatchnotesPage = lazy(() =>
  import("@/pages/PatchnotesPage").then((m) => ({ default: m.PatchnotesPage })),
);
const BoatGamePage = lazy(() =>
  import("@/pages/BoatGamePage").then((m) => ({ default: m.BoatGamePage })),
);

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

/**
 * Phases de démarrage :
 *  "splash"     — chargement en cours, SplashScreen visible
 *  "transition" — chargement terminé, SplashTransition en cours (pool tourne derrière)
 *  "done"       — transition terminée, MainPage seule visible
 */
type StartPhase = "splash" | "transition" | "done";

function App() {
  const {
    loading: appInitLoading,
    tmdbKey: initTmdbKey,
    likes: initLikes,
    c411Key: initC411Key,
    allDebridKey: initAllDebridKey,
    prefs: initPrefs,
    applyKeys,
  } = useAppInit();
  const [page, setPage] = useState<Page | null>(null);
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discoverItem, setDiscoverItem] = useState<TmdbItem | null>(null);
  const [discoverTab, setDiscoverTab] = useState<DiscoverTab | undefined>(undefined);
  const [discoverMangaQuery, setDiscoverMangaQuery] = useState("");
  const [discoverMangaItem, setDiscoverMangaItem] = useState<MangaItem | null>(null);
  const [libraryTab, setLibraryTab] = useState<LibraryTab | undefined>(undefined);
  const [mangaLibraryId, setMangaLibraryId] = useState<string | null>(null);
  const [libraryExpandedHash, setLibraryExpandedHash] = useState<string | null>(null);
  const [libraryExpandedGroupId, setLibraryExpandedGroupId] = useState<number | null>(null);
  const [mainSearch, setMainSearch] = useState<{
    query: string;
    source: "c411" | "nyaa";
  } | null>(null);
  // Mode de la barre de recherche de l'accueil : remonté ici pour survivre au
  // démontage de MainPage lors d'une navigation.
  const [searchMode, setSearchMode] = useState<SearchMode>("discover");
  const [patchnotesSeenVersion, setPatchnotesSeenVersion] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [showMangaWelcome, setShowMangaWelcome] = useState(false);
  const [summerEnabled, setSummerEnabled] = useState(true);
  const [summerFps, setSummerFps] = useState<30 | 60>(60);
  const [summerMaxDucks, setSummerMaxDucks] = useState(15);
  const [idleAutoHide, setIdleAutoHide] = useState(true);
  // En preview navigateur, les animations rAF gèlent quand l'onglet est en
  // arrière-plan : on saute splash + transition pour ne pas bloquer dessus.
  const [startPhase, setStartPhase] = useState<StartPhase>(isBrowserPreview ? "done" : "splash");
  const [settingsPanel, setSettingsPanel] = useState<PanelId | undefined>(undefined);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [pendingUpdate, setPendingUpdate] = useState<UpdateInfo | null>(null);
  const fakeUpdate: UpdateInfo = {
    version: "9.9.9",
    body: "- Nouvelle fonctionnalite incroyable\n- Correction de bugs\n- Amelioration des performances",
    download: async () => {},
  };
  const [availableUpdate, setAvailableUpdate] = useState<UpdateInfo | null>(
    import.meta.env.DEV ? fakeUpdate : null,
  );

  useNavShortcuts((action) => {
    setPage((p) => (p === null || p === "setup" || p === "boatgame" ? p : action));
  });
  useActionShortcuts();

  useEffect(
    () =>
      onSettingsPanelRequest((panel) => {
        setSettingsPanel(panel);
        setPage("preferences");
      }),
    [],
  );

  useEffect(() => {
    checkForUpdate()
      .then((u) => {
        if (u) {
          setAvailableUpdate(u);
          setPendingUpdate(u);
        }
      })
      .catch(() => {});
  }, []);

  // Observe le thème pour passer la bonne couleur à SplashTransition
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    // Réchauffe les caches bibliothèque et dossiers de séries pendant le
    // splash (best-effort).
    prefetchLibrary().catch(() => {});
    loadSeriesFolders().catch(() => {});
    // Réglages d'affichage et catégories : la bibliothèque s'ouvre déjà triée,
    // rangée et filtrée, sans recalcul visible au premier rendu.
    loadLibraryPrefs().catch(() => {});
    loadCategories().catch(() => {});

    Promise.all([
      store.get<boolean>("setup_complete"),
      store.get<boolean>("welcome_v1_seen"),
      loadStartupPage(store),
      store.get<boolean>("manga_welcome_v160_seen"),
    ])
      .then(([done, welcomeSeen, startupPage, mangaWelcomeSeen]) => {
        const installed = Boolean(done && welcomeSeen);
        setPage(installed ? startupPage : "setup");
        // Seuls les utilisateurs qui avaient deja l'app installee voient la
        // presentation Manga : un nouvel arrivant decouvre tout via le setup.
        if (installed && !mangaWelcomeSeen) setShowMangaWelcome(true);
      })
      .catch((err) => {
        console.error("Store read failed:", err);
        setPage("setup");
      });

    // SUMMER is enabled by default and force-enabled once for this update.
    (async () => {
      const applied = await store.get<boolean>("summer_default_v1");
      if (!applied) {
        await store.set("summer_pool_enabled", true);
        await store.set("summer_default_v1", true);
        await store.save();
        setSummerEnabled(true);
      } else {
        const v = await store.get<boolean>("summer_pool_enabled");
        setSummerEnabled(v ?? true);
      }
      const savedFps = await store.get<number>("summer_pool_fps");
      if (savedFps === 30) setSummerFps(30);
      const savedMaxDucks = await store.get<number>("summer_pool_max_ducks");
      if (typeof savedMaxDucks === "number") setSummerMaxDucks(savedMaxDucks);
      const savedIdleAutoHide = await store.get<boolean>("idle_auto_hide");
      if (typeof savedIdleAutoHide === "boolean") setIdleAutoHide(savedIdleAutoHide);
    })();
  }, []);

  // Dès que le chargement est terminé ET que la destination est connue,
  // on passe en phase "transition". Derive instead of a synchronous setState
  // in an effect to avoid cascading renders.
  const effectivePhase: StartPhase =
    startPhase === "splash" && !appInitLoading && page !== null ? "transition" : startPhase;

  async function handleSetSummerFps(v: 30 | 60) {
    setSummerFps(v);
    await store.set("summer_pool_fps", v);
    await store.save();
  }

  async function handleToggleSummer(v: boolean) {
    setSummerEnabled(v);
    await store.set("summer_pool_enabled", v);
    await store.save();
  }

  async function handleSetSummerMaxDucks(v: number) {
    setSummerMaxDucks(v);
    await store.set("summer_pool_max_ducks", v);
    await store.save();
  }

  async function handleCloseMangaWelcome() {
    setShowMangaWelcome(false);
    await store.set("manga_welcome_v160_seen", true);
    await store.save();
  }

  async function handleSetIdleAutoHide(v: boolean) {
    setIdleAutoHide(v);
    await store.set("idle_auto_hide", v);
    await store.save();
  }

  function handleNavigate(p: Page) {
    if (p === "patchnotes") setPatchnotesSeenVersion(LATEST_VERSION);
    // "manga" n'est plus une page : c'est l'onglet Mangas de la Découverte.
    if (p === "manga") {
      setDiscoverQuery("");
      setDiscoverItem(null);
      setDiscoverMangaQuery("");
      setDiscoverMangaItem(null);
      setDiscoverTab("manga");
      setPage("discover");
      return;
    }
    // Une navigation "normale" vers Découverte (menu, CTA) repart sur le feed :
    // seule la barre de recherche de MainPage passe une requête / un item.
    if (p === "discover") {
      setDiscoverQuery("");
      setDiscoverItem(null);
      setDiscoverMangaQuery("");
      setDiscoverMangaItem(null);
      setDiscoverTab(undefined);
    }
    // Toute navigation "normale" vers l'accueil repart sur une barre vierge :
    // seule la fiche Découverte injecte une recherche tracker à lancer.
    if (p === "main") setMainSearch(null);
    // Navigation "normale" vers la bibliothèque : pas de fiche pré-ouverte
    // (seule l'action "Voir" d'un toast d'ajout en injecte une).
    if (p === "library") {
      setLibraryExpandedHash(null);
      setLibraryExpandedGroupId(null);
      setLibraryTab(undefined);
      setMangaLibraryId(null);
    }
    // "mangalibrary" n'est plus une page : c'est l'onglet Mangas de la
    // bibliothèque. Seule l'action "Voir" d'une fiche pré-ouvre une oeuvre.
    if (p === "mangalibrary") {
      setMangaLibraryId(null);
      setLibraryTab("manga");
      setPage("library");
      return;
    }
    setPage(p);
  }

  // Action "Voir" d'un toast d'ajout à la bibliothèque : ouvre directement la
  // fiche du titre (groupe série ou entrée film) plutôt que la liste seule.
  function openLibraryItem(item: TmdbItem, infoHash: string) {
    if (item.mediaType === "tv") {
      setLibraryExpandedGroupId(item.id);
      setLibraryExpandedHash(null);
    } else {
      setLibraryExpandedHash(infoHash);
      setLibraryExpandedGroupId(null);
    }
    setPage("library");
  }

  // Depuis une fiche manga : ouvre la bibliothèque manga sur cette oeuvre.
  function openMangaEntry(mangaId?: string) {
    setMangaLibraryId(mangaId ?? null);
    setLibraryTab("manga");
    setLibraryTab("media");
    setPage("library");
  }

  // Barre de MainPage en mode Mangas : ouvre l'onglet Mangas de la Découverte
  // avec la recherche MangaDex, et la fiche du titre si une suggestion a été
  // choisie.
  function launchDiscoverManga(q: string) {
    setDiscoverMangaQuery(q);
    setDiscoverMangaItem(null);
    setDiscoverQuery("");
    setDiscoverItem(null);
    setDiscoverTab("manga");
    setPage("discover");
  }

  function launchDiscoverMangaItem(item: MangaItem) {
    setDiscoverMangaQuery(item.title);
    setDiscoverMangaItem(item);
    setDiscoverQuery("");
    setDiscoverItem(null);
    setDiscoverTab("manga");
    setPage("discover");
  }

  function launchDiscover(q: string) {
    setDiscoverQuery(q);
    setDiscoverItem(null);
    setDiscoverMangaQuery("");
    setDiscoverMangaItem(null);
    setDiscoverTab("movie");
    setPage("discover");
  }

  // Sélection d'une suggestion d'auto-complete : on ouvre directement la fiche
  // du titre dans Découverte, avec sa recherche générale en fond.
  function launchDiscoverItem(item: TmdbItem) {
    setDiscoverQuery(item.title);
    setDiscoverItem(item);
    setDiscoverMangaQuery("");
    setDiscoverMangaItem(null);
    setDiscoverTab("movie");
    setPage("discover");
  }

  // Depuis la fiche Découverte sans version C411 : bascule sur l'accueil et lance
  // une recherche brute sur le tracker choisi.
  function launchTrackerSearch(query: string, source: "c411" | "nyaa") {
    setMainSearch({ query, source });
    setSearchMode(source);
    setPage("main");
  }

  async function handleSetupComplete() {
    // useAppInit a tourné avant la fin du setup : les clés en mémoire sont
    // nulles. On les relit du keyring pour les injecter sans redémarrage.
    const [c411Key, allDebridKey, tmdbKey] = await Promise.all([
      getApiKey("c411_api_key"),
      getApiKey("alldebrid_api_key"),
      getApiKey("tmdb_api_key"),
    ]);
    applyKeys({ c411Key, allDebridKey, tmdbKey });
    await store.set("setup_complete", true);
    await store.set("welcome_v1_seen", true);
    await store.save();
    setPage("main");
  }

  const showPool =
    summerEnabled && (page === "main" || page === "discover" || effectivePhase === "transition");

  return (
    <>
      <Toaster />
      <DownloadsOverlay />

      {effectivePhase === "done" && pendingUpdate && (
        <UpdateDialog update={pendingUpdate} onDismiss={() => setPendingUpdate(null)} />
      )}

      <AnimatePresence>
        {effectivePhase === "done" && page !== "setup" && showMangaWelcome && (
          <MangaWelcomeModal onClose={handleCloseMangaWelcome} />
        )}
      </AnimatePresence>

      {/* Pool canvas — montée dès la phase "transition" pour qu'elle soit déjà
          visible quand le voile du splash se lève */}
      {summerEnabled && (
        <div
          aria-hidden
          className={`pointer-events-none fixed inset-0 -z-10 transition-opacity duration-500 ${
            showPool ? "opacity-100" : "opacity-0"
          }`}
        >
          <Suspense fallback={null}>
            <PixelPool
              active={showPool}
              fps={summerFps}
              maxDucks={summerMaxDucks}
              onBoatWarp={() => setPage("boatgame")}
            />
          </Suspense>
        </div>
      )}

      {/* Duck shop / collection panel — own overlay so it stays interactive
          above the pointer-events-none pool canvas */}
      {summerEnabled && (
        <Suspense fallback={null}>
          <DuckShop />
          <DuckDex />
          <SlotMachine />
        </Suspense>
      )}

      {/* ── Phase splash : écran de chargement ── */}
      <AnimatePresence>{effectivePhase === "splash" && <SplashScreen />}</AnimatePresence>

      {/* ── Phase transition : le voile se lève sur la pool ── */}
      {effectivePhase === "transition" && (
        <SplashTransition dark={dark} onComplete={() => setStartPhase("done")} />
      )}

      {/* ── Phase done : navigation normale ── */}
      {devMode && (
        <div className="fixed bottom-28 left-3 z-50 flex items-center gap-1.5">
          <div className="rounded-md bg-amber-500/15 ring-1 ring-amber-500/30 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-600 dark:text-amber-400">
            MODE DEV
          </div>
          {summerEnabled && (
            <button
              onClick={() => spawnVariant(randomLegendaryVariant())}
              className="rounded-md bg-amber-500/15 ring-1 ring-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition-colors"
            >
              + legendaire
            </button>
          )}
          {summerEnabled && (
            <button
              onClick={() => spawnVariant(kingVariant())}
              className="rounded-md bg-yellow-400/20 ring-1 ring-yellow-400/40 px-2 py-0.5 text-[10px] font-bold text-yellow-600 dark:text-yellow-300 hover:bg-yellow-400/30 transition-colors"
            >
              + roi
            </button>
          )}
        </div>
      )}

      <Suspense fallback={null}>
        <AnimatePresence mode="wait">
          {effectivePhase === "done" && page === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <SetupPage onComplete={handleSetupComplete} />
            </motion.div>
          )}
          {effectivePhase === "done" && page === "main" && (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <MainPage
                onNavigate={handleNavigate}
                onLaunchDiscover={launchDiscover}
                onLaunchDiscoverItem={launchDiscoverItem}
                onLaunchDiscoverManga={launchDiscoverManga}
                onLaunchDiscoverMangaItem={launchDiscoverMangaItem}
                devMode={devMode}
                onToggleDevMode={() => setDevMode((v) => !v)}
                onShowMangaWelcome={() => setShowMangaWelcome(true)}
                onShowUpdatePreview={() =>
                  setPendingUpdate({
                    version: "9.9.9",
                    body: "- Nouvelle fonctionnalite incroyable\n- Correction de bugs\n- Amelioration des performances",
                    download: async () => {},
                  })
                }
                hasPendingUpdate={availableUpdate !== null}
                onShowPendingUpdate={() => setPendingUpdate(availableUpdate)}
                summerEnabled={summerEnabled}
                initialC411Key={initC411Key}
                initialAllDebridKey={initAllDebridKey}
                initialTmdbKey={initTmdbKey}
                initialPatchnotesSeen={patchnotesSeenVersion ?? initPrefs.patchnotesSeen}
                initialSearchViewMode={initPrefs.searchViewMode}
                initialIdleAutoHide={idleAutoHide && summerEnabled && !isBrowserPreview}
                searchMode={searchMode}
                onSearchModeChange={setSearchMode}
                initialSearch={mainSearch}
                onSearchConsumed={() => setMainSearch(null)}
              />
            </motion.div>
          )}
          {effectivePhase === "done" && page === "magnets" && (
            <motion.div
              key="magnets"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <MagnetsPage
                onBack={() => setPage("main")}
                onNavigate={handleNavigate}
                hasPendingUpdate={availableUpdate !== null}
                onShowPendingUpdate={() => setPendingUpdate(availableUpdate)}
                initialAllDebridKey={initAllDebridKey}
                initialViewMode={initPrefs.viewMode}
                initialHideNfoFiles={initPrefs.hideNfoFiles}
                initialSkipNfoDownload={initPrefs.skipNfoDownload}
              />
            </motion.div>
          )}
          {effectivePhase === "done" && page === "library" && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <LibraryPage
                onBack={() => setPage("main")}
                onNavigate={handleNavigate}
                hasPendingUpdate={availableUpdate !== null}
                onShowPendingUpdate={() => setPendingUpdate(availableUpdate)}
                initialAllDebridKey={initAllDebridKey}
                initialTmdbKey={initTmdbKey}
                initialC411Key={initC411Key}
                initialViewMode={initPrefs.libraryViewMode}
                initialTab={libraryTab}
                initialMangaId={mangaLibraryId}
                initialExpandedHash={libraryExpandedHash}
                initialExpandedGroupId={libraryExpandedGroupId}
              />
            </motion.div>
          )}
          {effectivePhase === "done" && page === "preferences" && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <PreferencesPage
                onBack={() => setPage("main")}
                onNavigate={handleNavigate}
                hasPendingUpdate={availableUpdate !== null}
                onShowPendingUpdate={() => setPendingUpdate(availableUpdate)}
                summerEnabled={summerEnabled}
                onToggleSummer={handleToggleSummer}
                summerFps={summerFps}
                onSetSummerFps={handleSetSummerFps}
                summerMaxDucks={summerMaxDucks}
                onSetSummerMaxDucks={handleSetSummerMaxDucks}
                idleAutoHide={idleAutoHide}
                onSetIdleAutoHide={handleSetIdleAutoHide}
                onKeysSaved={applyKeys}
                initialPanel={settingsPanel}
              />
            </motion.div>
          )}
          {effectivePhase === "done" && page === "discover" && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <DiscoverPage
                onBack={() => setPage("main")}
                onNavigate={handleNavigate}
                hasPendingUpdate={availableUpdate !== null}
                onShowPendingUpdate={() => setPendingUpdate(availableUpdate)}
                summerEnabled={summerEnabled}
                initialQuery={discoverQuery}
                initialTab={discoverTab}
                initialItem={discoverItem}
                initialMangaQuery={discoverMangaQuery}
                initialMangaItem={discoverMangaItem}
                initialTmdbKey={initTmdbKey}
                initialC411Key={initC411Key}
                initialAllDebridKey={initAllDebridKey}
                initialLikes={initLikes}
                onSearchTracker={launchTrackerSearch}
                onOpenLibraryItem={openLibraryItem}
                onOpenMangaLibrary={openMangaEntry}
              />
            </motion.div>
          )}
          {effectivePhase === "done" && page === "nyaa" && devMode && NyaaTestPage && (
            <motion.div
              key="nyaa"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <NyaaTestPage onBack={() => setPage("main")} />
            </motion.div>
          )}
          {effectivePhase === "done" && page === "boatgame" && (
            <motion.div
              key="boatgame"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <BoatGamePage onExit={() => setPage("main")} />
            </motion.div>
          )}
          {effectivePhase === "done" && page === "patchnotes" && (
            <motion.div
              key="patchnotes"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <PatchnotesPage
                onBack={() => setPage("main")}
                onNavigate={handleNavigate}
                hasPendingUpdate={availableUpdate !== null}
                onShowPendingUpdate={() => setPendingUpdate(availableUpdate)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </>
  );
}

export default App;
