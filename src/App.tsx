import { useEffect, useState } from "react";
import { LazyStore } from "@tauri-apps/plugin-store";
import { Toaster } from "@/components/ui/sonner";
import { SetupPage } from "@/pages/SetupPage";
import { MainPage } from "@/pages/MainPage";
import { SettingsPage } from "@/pages/SettingsPage";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

type Page = "setup" | "main" | "settings";

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
      {page === "setup" && <SetupPage onComplete={handleSetupComplete} />}
      {page === "main" && <MainPage onNavigate={setPage} />}
      {page === "settings" && <SettingsPage onBack={() => setPage("main")} />}
    </>
  );
}

export default App;
