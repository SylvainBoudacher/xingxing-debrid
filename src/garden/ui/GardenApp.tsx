import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import { isBrowserPreview } from "@/lib/devTauriShim";
import { withDemoPlants } from "../core/demo";
import type { GardenSave } from "../core/types";
import { createGardenScene, type GardenScene } from "../render/createGardenScene";
import { hasWebgl } from "../render/webgl";
import { createSaveScheduler, loadGarden } from "../storage/gardenStore";
import { GardenDevBar } from "./GardenDevBar";
import { announceGardenClosed, announceGardenOpened } from "./gardenWindow";

const RESYNC_MS = 60_000;

export default function GardenApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GardenScene | null>(null);
  const [saver] = useState(() => createSaveScheduler());
  const [webglOk] = useState(hasWebgl);
  const [save, setSave] = useState<GardenSave | null>(null);

  useEffect(() => {
    let alive = true;
    loadGarden().then(({ save, recovered }) => {
      if (!alive) return;
      if (recovered)
        toast.error(
          "Sauvegarde du Potager illisible : une copie a été mise de côté et un nouveau champ a été créé.",
        );
      setSave(save);
    });
    void announceGardenOpened();
    if (!webglOk) return;
    const scene = createGardenScene(canvasRef.current!, "garden");
    sceneRef.current = scene;
    scene.start();
    return () => {
      alive = false;
      scene.dispose();
      sceneRef.current = null;
    };
  }, [webglOk]);

  useEffect(() => {
    if (!save) return;
    saver.schedule(save);
    sceneRef.current?.sync(save, Date.now());
    const id = setInterval(() => sceneRef.current?.sync(save, Date.now()), RESYNC_MS);
    return () => clearInterval(id);
  }, [save, saver]);

  useEffect(() => {
    if (isBrowserPreview) {
      const onHide = () => void saver.flush();
      window.addEventListener("pagehide", onHide);
      return () => window.removeEventListener("pagehide", onHide);
    }
    const pending = getCurrentWindow().onCloseRequested(async () => {
      await saver.flush();
      await announceGardenClosed();
    });
    return () => {
      pending.then((unlisten) => unlisten());
    };
  }, [saver]);

  return (
    <div className="flex h-screen flex-col bg-[#1a1216] text-[#f1e6d2]">
      <Toaster theme="dark" />
      <nav className="flex gap-1 border-b border-amber-300/25 px-4 pt-2">
        <span className="rounded-t-lg bg-amber-300/10 px-4 py-2 font-serif text-lg font-semibold text-[#f3dca0] shadow-[inset_0_-2px_0_#d9b46a]">
          Champ
        </span>
      </nav>
      <div className="relative flex-1">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        {!webglOk && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm">
            Le Potager a besoin de WebGL, qui n'est pas disponible sur cet appareil.
          </div>
        )}
        {import.meta.env.DEV && save && (
          <GardenDevBar onSeed={() => setSave((s) => (s ? withDemoPlants(s, Date.now()) : s))} />
        )}
      </div>
    </div>
  );
}
