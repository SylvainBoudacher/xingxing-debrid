import { useCallback, useEffect, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { detectVlc } from "@/lib/player";
import { settingsStore } from "@/components/settings/store";

export const VLC_DOWNLOAD_URL = "https://images.videolan.org/vlc/index.fr.html";

// Simulation dev : force le resultat de la detection tant qu'elle est active.
export type VlcSim = "none" | "ok" | "fail";
const SIM_PATH = "[DEV] /Applications/VLC.app";

/** Detecte VLC au montage ; `pick` enregistre un chemin choisi a la main. */
export function useVlcDetection(sim: VlcSim = "none") {
  const [detected, setDetected] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const detect = useCallback(async () => {
    if (import.meta.env.DEV && sim !== "none") return sim === "ok" ? SIM_PATH : null;
    return detectVlc();
  }, [sim]);

  useEffect(() => {
    detect().then((path) => {
      setDetected(path);
      setChecking(false);
    });
  }, [detect]);

  async function check() {
    setChecking(true);
    setDetected(await detect());
    setChecking(false);
  }

  async function pick() {
    const isMac = navigator.userAgent.includes("Mac");
    const picked = await openDialog({
      multiple: false,
      filters: isMac
        ? [{ name: "Application", extensions: ["app"] }]
        : [{ name: "Exécutable", extensions: ["exe"] }],
    });
    if (typeof picked !== "string") return;
    await settingsStore.set("vlc_path", picked);
    await settingsStore.save();
    await check();
  }

  return { detected, checking, check, pick };
}
