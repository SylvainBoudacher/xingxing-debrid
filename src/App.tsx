import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LazyStore } from "@tauri-apps/plugin-store";
import { Toaster } from "@/components/ui/sonner";
import { SetupPage } from "@/pages/SetupPage";
import { MainPage } from "@/pages/MainPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { MagnetsPage } from "@/pages/MagnetsPage";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

type Page = "setup" | "main" | "settings" | "magnets";

function App() {
  const [page, setPage] = useState<Page | null>(null);

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
            <MainPage onNavigate={setPage} />
          </motion.div>
        )}
        {page === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            <SettingsPage onBack={() => setPage("main")} />
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
      </AnimatePresence>
    </>
  );
}

export default App;
