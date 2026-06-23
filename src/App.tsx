import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LazyStore } from "@tauri-apps/plugin-store";
import { Toaster } from "@/components/ui/sonner";
import { SplashScreen } from "@/components/SplashScreen";
import { SplashTransition } from "@/components/SplashTransition";
import { useAppInit } from "@/lib/useAppInit";

const PixelPool = lazy(() =>
  import("@/components/PixelPool").then((m) => ({ default: m.PixelPool })),
);
const SetupPage = lazy(() =>
  import("@/pages/SetupPage").then((m) => ({ default: m.SetupPage })),
);
const MainPage = lazy(() =>
  import("@/pages/MainPage").then((m) => ({ default: m.MainPage })),
);
import { MagnetsPage } from "@/pages/MagnetsPage";
import { DiscoverPage } from "@/pages/DiscoverPage";
const PreferencesPage = lazy(() =>
  import("@/pages/PreferencesPage").then((m) => ({ default: m.PreferencesPage })),
);
const PatchnotesPage = lazy(() =>
  import("@/pages/PatchnotesPage").then((m) => ({ default: m.PatchnotesPage })),
);

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

type Page =
  | "setup"
  | "main"
  | "magnets"
  | "preferences"
  | "patchnotes"
  | "discover";

/**
 * Phases de démarrage :
 *  "splash"     — chargement en cours, SplashScreen visible
 *  "transition" — chargement terminé, SplashTransition en cours (pool tourne derrière)
 *  "done"       — transition terminée, MainPage seule visible
 */
type StartPhase = "splash" | "transition" | "done";

function App() {
  const { loading: appInitLoading, tmdbKey: initTmdbKey, likes: initLikes } = useAppInit();
  const [page, setPage] = useState<Page | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [summerEnabled, setSummerEnabled] = useState(true);
  const [summerFps, setSummerFps] = useState<30 | 60>(30);
  const [startPhase, setStartPhase] = useState<StartPhase>("splash");
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  // Observe le thème pour passer la bonne couleur à SplashTransition
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    Promise.all([
      store.get<boolean>("setup_complete"),
      store.get<boolean>("welcome_v1_seen"),
    ])
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
  // on passe en phase "transition".
  useEffect(() => {
    if (!appInitLoading && page !== null && startPhase === "splash") {
      setStartPhase("transition");
    }
  }, [appInitLoading, page, startPhase]);

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

  async function handleSetupComplete() {
    await store.set("setup_complete", true);
    await store.set("welcome_v1_seen", true);
    await store.save();
    setPage("main");
  }

  const showPool = summerEnabled && (
    page === "main" || page === "discover" || startPhase === "transition"
  );

  return (
    <>
      <Toaster />

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
            />
          </Suspense>
        </div>
      )}

      {/* ── Phase splash : écran de chargement ── */}
      <AnimatePresence>
        {startPhase === "splash" && <SplashScreen />}
      </AnimatePresence>

      {/* ── Phase transition : le voile se lève sur la pool ── */}
      {startPhase === "transition" && (
        <SplashTransition
          dark={dark}
          onComplete={() => setStartPhase("done")}
        />
      )}

      {/* ── Phase done : navigation normale ── */}
      {devMode && (
        <div className="fixed bottom-3 left-3 z-50 rounded-md bg-amber-500/15 ring-1 ring-amber-500/30 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-600 dark:text-amber-400">
          MODE DEV
        </div>
      )}

      <Suspense fallback={null}>
        <AnimatePresence mode="wait">
          {startPhase === "done" && page === "setup" && (
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
          {startPhase === "done" && page === "main" && (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <MainPage
                onNavigate={setPage}
                devMode={devMode}
                onToggleDevMode={() => setDevMode((v) => !v)}
                summerEnabled={summerEnabled}
              />
            </motion.div>
          )}
          {startPhase === "done" && page === "magnets" && (
            <motion.div
              key="magnets"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <MagnetsPage onBack={() => setPage("main")} onNavigate={setPage} />
            </motion.div>
          )}
          {startPhase === "done" && page === "preferences" && (
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
                summerEnabled={summerEnabled}
                onToggleSummer={handleToggleSummer}
                summerFps={summerFps}
                onSetSummerFps={handleSetSummerFps}
              />
            </motion.div>
          )}
          {startPhase === "done" && page === "discover" && (
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
                summerEnabled={summerEnabled}
                initialTmdbKey={initTmdbKey}
                initialLikes={initLikes}
              />
            </motion.div>
          )}
          {startPhase === "done" && page === "patchnotes" && (
            <motion.div
              key="patchnotes"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <PatchnotesPage onBack={() => setPage("main")} onNavigate={setPage} />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </>
  );
}

export default App;
