import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LazyStore } from "@tauri-apps/plugin-store";
import { Toaster } from "@/components/ui/sonner";
import { DownloadsOverlay } from "@/components/DownloadsOverlay";
import { SplashScreen } from "@/components/SplashScreen";
import { SplashTransition } from "@/components/SplashTransition";
import { useAppInit } from "@/lib/useAppInit";
import { UpdateDialog } from "@/components/UpdateDialog";
import { checkForUpdate, type UpdateInfo } from "@/lib/updater";
import { LATEST_VERSION } from "@/lib/patchnotes";
import type { Page } from "@/components/AppMenu";
import { prefetchLibrary } from "@/lib/library";
import { kingVariant, randomLegendaryVariant } from "@/components/duckRandom";
import { spawnVariant } from "@/components/duckShopBridge";

const PixelPool = lazy(() =>
  import("@/components/PixelPool").then((m) => ({ default: m.PixelPool })),
);
const DuckShop = lazy(() => import("@/components/DuckShop").then((m) => ({ default: m.DuckShop })));
const DuckDex = lazy(() => import("@/components/DuckDex").then((m) => ({ default: m.DuckDex })));
const SetupPage = lazy(() => import("@/pages/SetupPage").then((m) => ({ default: m.SetupPage })));
const MainPage = lazy(() => import("@/pages/MainPage").then((m) => ({ default: m.MainPage })));
import { MagnetsPage } from "@/pages/MagnetsPage";
import { DiscoverPage } from "@/pages/DiscoverPage";
import { NyaaTestPage } from "@/pages/NyaaTestPage";
const PreferencesPage = lazy(() =>
  import("@/pages/PreferencesPage").then((m) => ({ default: m.PreferencesPage })),
);
const PatchnotesPage = lazy(() =>
  import("@/pages/PatchnotesPage").then((m) => ({ default: m.PatchnotesPage })),
);
import { LibraryPage } from "@/pages/LibraryPage";

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
  const [patchnotesSeenVersion, setPatchnotesSeenVersion] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [summerEnabled, setSummerEnabled] = useState(true);
  const [summerFps, setSummerFps] = useState<30 | 60>(60);
  const [summerMaxDucks, setSummerMaxDucks] = useState(15);
  const [idleAutoHide, setIdleAutoHide] = useState(true);
  const [startPhase, setStartPhase] = useState<StartPhase>("splash");
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
    // Réchauffe le cache bibliothèque pendant le splash (best-effort).
    prefetchLibrary().catch(() => {});

    Promise.all([store.get<boolean>("setup_complete"), store.get<boolean>("welcome_v1_seen")])
      .then(([done, welcomeSeen]) => {
        setPage(done && welcomeSeen ? "main" : "setup");
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

  async function handleSetIdleAutoHide(v: boolean) {
    setIdleAutoHide(v);
    await store.set("idle_auto_hide", v);
    await store.save();
  }

  function handleNavigate(p: Page) {
    if (p === "patchnotes") setPatchnotesSeenVersion(LATEST_VERSION);
    setPage(p);
  }

  async function handleSetupComplete() {
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
            <PixelPool active={showPool} fps={summerFps} maxDucks={summerMaxDucks} />
          </Suspense>
        </div>
      )}

      {/* Duck shop / collection panel — own overlay so it stays interactive
          above the pointer-events-none pool canvas */}
      {summerEnabled && (
        <Suspense fallback={null}>
          <DuckShop />
          <DuckDex />
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
                devMode={devMode}
                onToggleDevMode={() => setDevMode((v) => !v)}
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
                initialPatchnotesSeen={patchnotesSeenVersion ?? initPrefs.patchnotesSeen}
                initialSearchViewMode={initPrefs.searchViewMode}
                initialIdleAutoHide={idleAutoHide && summerEnabled}
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
                onNavigate={setPage}
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
                onNavigate={setPage}
                hasPendingUpdate={availableUpdate !== null}
                onShowPendingUpdate={() => setPendingUpdate(availableUpdate)}
                initialAllDebridKey={initAllDebridKey}
                initialTmdbKey={initTmdbKey}
                initialViewMode={initPrefs.libraryViewMode}
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
                onNavigate={setPage}
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
                onNavigate={setPage}
                hasPendingUpdate={availableUpdate !== null}
                onShowPendingUpdate={() => setPendingUpdate(availableUpdate)}
                summerEnabled={summerEnabled}
                initialTmdbKey={initTmdbKey}
                initialC411Key={initC411Key}
                initialAllDebridKey={initAllDebridKey}
                initialLikes={initLikes}
              />
            </motion.div>
          )}
          {effectivePhase === "done" && page === "nyaa" && devMode && (
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
                onNavigate={setPage}
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
