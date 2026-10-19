import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { toast } from "sonner";
import { isBrowserPreview } from "@/lib/devTauriShim";
import type { CameraMode } from "../core/types";
import { createPotagerScene, type PotagerScene } from "../render/createPotagerScene";
import { createChannel } from "../sim/channel";
import { createSimHost, type SimHost } from "../sim/simHost";
import { potagerStore } from "../storage/potagerStore";
import { moved, withView } from "./viewSave";

const VIEW_SAVE_MS = 2000;

// Simulation de la fenêtre Potager et scène qui l'affiche : création, sauvegarde de la vue, fermeture.
export function usePotagerSession(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
) {
  const [scene, setScene] = useState<PotagerScene | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<CameraMode>("follow");
  const [failed, setFailed] = useState(false);
  const hostRef = useRef<SimHost | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const host = createSimHost({ role: "potager", store: potagerStore, channel: createChannel() });
    hostRef.current = host;
    let alive = true;
    let cleanup = () => {};

    void host.start().then(
      () => {
        const save = host.state();
        if (!alive || !save || !canvasRef.current) return;
        if (host.recovered)
          toast.error(
            "Sauvegarde du Potager illisible : une copie a été mise de côté et une nouvelle partie a commencé.",
          );
        let created: PotagerScene;
        try {
          created = createPotagerScene(canvasRef.current, "potager", save);
        } catch {
          setFailed(true);
          return;
        }
        created.start();
        setScene(created);
        setCanvas(canvasRef.current);
        setMode(created.rig.mode());
        const unsubscribe = host.subscribe((s) => created.sync(s));
        let savedCamera = created.rig.target();
        let savedAvatar = created.avatar.pose();
        const id = setInterval(() => {
          const camera = created.rig.target(),
            avatar = created.avatar.pose();
          if (!moved(camera, savedCamera) && !moved(avatar, savedAvatar)) return;
          savedCamera = camera;
          savedAvatar = avatar;
          host.update(withView(created));
        }, VIEW_SAVE_MS);
        const onResize = () => created.resize();
        window.addEventListener("resize", onResize);
        cleanup = () => {
          clearInterval(id);
          unsubscribe();
          window.removeEventListener("resize", onResize);
          host.update(withView(created));
          created.dispose();
        };
      },
      () => alive && setFailed(true),
    );

    const close = async () => {
      cleanup();
      cleanup = () => {};
      // la fenêtre se ferme après ce gestionnaire, même si la sauvegarde échoue
      await host.stop().catch(() => {});
    };
    let unlistenClose: Promise<() => void> | null = null;
    const onHide = () => void close();
    if (isBrowserPreview) window.addEventListener("pagehide", onHide);
    else unlistenClose = getCurrentWindow().onCloseRequested(close);

    return () => {
      alive = false;
      window.removeEventListener("pagehide", onHide);
      void unlistenClose?.then((u) => u());
      void close();
    };
  }, [enabled, canvasRef]);

  const applyMode = useCallback(
    (next: CameraMode) => {
      if (!scene) return;
      scene.rig.setMode(next);
      setMode(next);
      hostRef.current?.update(withView(scene));
    },
    [scene],
  );

  return { scene, canvas, mode, failed, applyMode };
}
