import { Maximize2, Monitor } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { WindowLaunchMode } from "@/lib/useAppInit";
import { SettingsPanel } from "../SettingsPanel";
import { FieldTitle, ViewOptionCard } from "../controls";
import { settingsStore as store } from "../store";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function AppearancePanel() {
  const [windowMode, setWindowMode] = useState<WindowLaunchMode | null>(null);
  const [customSize, setCustomSize] = useState<{ width: number; height: number } | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    store.get<WindowLaunchMode>("window_launch_mode").then((v) => setWindowMode(v ?? null));
    store
      .get<{ width: number; height: number }>("window_custom_size")
      .then((v) => setCustomSize(v ?? null));
  }, []);

  useEffect(() => {
    return () => {
      unlistenRef.current?.();
    };
  }, []);

  async function handleChange(mode: WindowLaunchMode) {
    unlistenRef.current?.();
    unlistenRef.current = null;

    setWindowMode(mode);
    await store.set("window_launch_mode", mode);
    await store.save();

    if (mode === "custom") {
      await startListening();
    }
  }

  async function startListening() {
    const win = getCurrentWindow();

    const size = await win.innerSize();
    const scaleFactor = await win.scaleFactor();
    const snap = {
      width: Math.round(size.width / scaleFactor),
      height: Math.round(size.height / scaleFactor),
    };
    setCustomSize(snap);
    await store.set("window_custom_size", snap);
    await store.save();

    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    const unlisten = await win.onResized(async (event) => {
      const sf = await win.scaleFactor();
      const newSize = {
        width: Math.round(event.payload.width / sf),
        height: Math.round(event.payload.height / sf),
      };
      setCustomSize(newSize);
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        await store.set("window_custom_size", newSize);
        await store.save();
      }, 400);
    });

    unlistenRef.current = () => {
      unlisten();
      if (saveTimer) clearTimeout(saveTimer);
    };
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
          <div className="flex flex-col items-center text-center">
            <div className="flex items-end justify-center h-10">
              <div className="w-10 h-7 rounded border-2 border-current opacity-60" />
            </div>
            <p className="text-xs text-zinc-500 mt-2">1100 x 720</p>
          </div>
        </ViewOptionCard>

        <ViewOptionCard
          label="Standard"
          selected={windowMode === "large" || windowMode === null}
          onClick={() => handleChange("large")}
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex items-end justify-center h-10">
              <div className="w-14 h-9 rounded border-2 border-current opacity-60" />
            </div>
            <p className="text-xs text-zinc-500 mt-2">1280 x 800</p>
          </div>
        </ViewOptionCard>

        <ViewOptionCard
          label="Plein écran"
          selected={windowMode === "maximized"}
          onClick={() => handleChange("maximized")}
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex items-end justify-center h-10">
              <Maximize2 className="h-8 w-8 opacity-60" />
            </div>
            <p className="text-xs text-zinc-500 mt-2">Fenêtre maximisée</p>
          </div>
        </ViewOptionCard>

        <ViewOptionCard
          label="Personnalisée"
          selected={windowMode === "custom"}
          onClick={() => handleChange("custom")}
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex items-end justify-center h-10">
              <div
                className="rounded border-2 border-current opacity-60"
                style={{ width: "40px", height: "28px" }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              {customSize ? `${customSize.width} x ${customSize.height}` : "Taille actuelle"}
            </p>
          </div>
        </ViewOptionCard>
      </div>

      {windowMode === "custom" && (
        <p className="text-xs text-zinc-500 mt-2">
          Redimensionnez la fenêtre pour mettre à jour la taille sauvegardée.
        </p>
      )}
    </SettingsPanel>
  );
}
