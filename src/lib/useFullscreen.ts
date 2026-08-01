import { isBrowserPreview } from "@/lib/devTauriShim";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useState } from "react";

async function setNative(on: boolean) {
  if (isBrowserPreview) {
    if (on) await document.documentElement.requestFullscreen();
    else if (document.fullscreenElement) await document.exitFullscreen();
    return;
  }
  await getCurrentWindow().setFullscreen(on);
}

/** Plein ecran OS (fenetre Tauri), avec repli navigateur pour la preview dev. */
export function useFullscreen() {
  const [fullscreen, setFullscreen] = useState(false);

  const apply = useCallback(async (on: boolean) => {
    await setNative(on);
    setFullscreen(on);
  }, []);

  const toggle = useCallback(() => void apply(!fullscreen), [apply, fullscreen]);

  // Le plein ecran natif peut etre quitte hors de l'app (Escape systeme, geste
  // macOS) : on ne laisse pas l'app quitter en le croyant encore actif.
  useEffect(() => {
    return () => {
      void setNative(false);
    };
  }, []);

  return { fullscreen, toggle, exit: useCallback(() => void apply(false), [apply]) };
}
