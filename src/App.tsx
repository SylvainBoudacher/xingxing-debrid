import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LazyStore } from "@tauri-apps/plugin-store";
import { Toaster } from "@/components/ui/sonner";
import { SplashScreen } from "@/components/SplashScreen";
import { SplashTransition } from "@/components/SplashTransition";
import { useAppInit } from "@/lib/useAppInit";
import { UpdateDialog } from "@/components/UpdateDialog";
import { checkForUpdate, type UpdateInfo } from "@/lib/updater";
import { LATEST_VERSION } from "@/lib/patchnotes";
import type { Page } from "@/components/AppMenu";

const PixelPool = lazy(() =>
  import("@/components/PixelPool").then((m) => ({ default: m.PixelPool })),
);
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
  } = useAppInit();
  const [page, setPage] = useState<Page | null>(null);
  const [patchnotesSeenVersion, setPatchnotesSeenVersion] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [summerEnabled, setSummerEnabled] = useState(true);
  const [summerFps, setSummerFps] = useState<30 | 60>(30);
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
      if (savedFps === 60) setSummerFps(60);
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
            <PixelPool active={showPool} fps={summerFps} />
          </Suspense>
        </div>
      )}

      {/* ── Phase splash : écran de chargement ── */}
      <AnimatePresence>{effectivePhase === "splash" && <SplashScreen />}</AnimatePresence>

      {/* ── Phase transition : le voile se lève sur la pool ── */}
      {effectivePhase === "transition" && (
        <SplashTransition dark={dark} onComplete={() => setStartPhase("done")} />
      )}

      {/* ── Phase done : navigation normale ── */}
      {devMode && (
        <div className="fixed bottom-3 left-3 z-50 rounded-md bg-amber-500/15 ring-1 ring-amber-500/30 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-600 dark:text-amber-400">
          MODE DEV
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
