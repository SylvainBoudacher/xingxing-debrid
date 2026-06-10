import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LazyStore } from "@tauri-apps/plugin-store";
import { Toaster } from "@/components/ui/sonner";
import { SetupPage } from "@/pages/SetupPage";
import { MainPage } from "@/pages/MainPage";
import { MagnetsPage } from "@/pages/MagnetsPage";
import { PreferencesPage } from "@/pages/PreferencesPage";
import { PatchnotesPage } from "@/pages/PatchnotesPage";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

type Page = "setup" | "main" | "magnets" | "preferences" | "patchnotes";

function App() {
  const [page, setPage] = useState<Page | null>(null);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    store.get<boolean>("setup_complete")
      .then((done) => setPage(done ? "main" : "setup"))
      .catch((err) => {
        console.error("Store read failed:", err);
        setPage("setup");
      });
  }, []);

  async function handleSetupComplete() {
    await store.set("setup_complete", true);
    await store.save();
    setPage("main");
  }

  if (page === null) return null;

  return (
    <>
      <Toaster />
      {devMode && (
        <div className="fixed bottom-3 left-3 z-50 rounded-md bg-amber-500/15 ring-1 ring-amber-500/30 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-400">
          MODE DEV
        </div>
      )}
      <AnimatePresence mode="wait">
        {page === "setup" && (
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
        {page === "main" && (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            <MainPage
              onNavigate={setPage}
              devMode={devMode}
              onToggleDevMode={() => setDevMode((v) => !v)}
            />
          </motion.div>
        )}
        {page === "magnets" && (
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
        {page === "preferences" && (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            <PreferencesPage onBack={() => setPage("main")} onNavigate={setPage} />
          </motion.div>
        )}
        {page === "patchnotes" && (
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
    </>
  );
}

export default App;
