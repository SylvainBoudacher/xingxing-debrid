import { Maximize2, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import type { WindowLaunchMode } from "@/lib/useAppInit";
import { SettingsPanel } from "../SettingsPanel";
import { FieldTitle, ViewOptionCard } from "../controls";
import { settingsStore as store } from "../store";

export function AppearancePanel() {
  const [windowMode, setWindowMode] = useState<WindowLaunchMode | null>(null);

  useEffect(() => {
    store.get<WindowLaunchMode>("window_launch_mode").then((v) => setWindowMode(v ?? null));
  }, []);

  async function handleChange(mode: WindowLaunchMode) {
    setWindowMode(mode);
    await store.set("window_launch_mode", mode);
    await store.save();
  }

  return (
    <SettingsPanel
      icon={Monitor}
      title="Apparence et fenêtre"
      subtitle="Taille de la fenêtre au lancement."
    >
      <FieldTitle
        title="Taille au lancement"
        hint="Choisissez comment l'application s'ouvre au démarrage. Prend effet au prochain lancement."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <ViewOptionCard
          label="Compacte"
          selected={windowMode === "small"}
          onClick={() => handleChange("small")}
        >
          <div className="flex items-end justify-center h-10">
            <div className="w-10 h-7 rounded border-2 border-current opacity-60" />
          </div>
          <p className="text-xs text-zinc-500 mt-2">1100 x 720</p>
        </ViewOptionCard>

        <ViewOptionCard
          label="Standard"
          selected={windowMode === "large" || windowMode === null}
          onClick={() => handleChange("large")}
        >
          <div className="flex items-end justify-center h-10">
            <div className="w-14 h-9 rounded border-2 border-current opacity-60" />
          </div>
          <p className="text-xs text-zinc-500 mt-2">1280 x 800</p>
        </ViewOptionCard>

        <ViewOptionCard
          label="Plein écran"
          selected={windowMode === "maximized"}
          onClick={() => handleChange("maximized")}
        >
          <div className="flex items-end justify-center h-10">
            <Maximize2 className="h-8 w-8 opacity-60" />
          </div>
          <p className="text-xs text-zinc-500 mt-2">Fenêtre maximisée</p>
        </ViewOptionCard>
      </div>
    </SettingsPanel>
  );
}
