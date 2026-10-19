import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { isBrowserPreview } from "@/lib/devTauriShim";
import type { CameraMode, PotagerSave } from "../core/types";
import type { CameraRig } from "../render/cameraRig";
import { createPotagerScene } from "../render/createPotagerScene";
import { hasWebgl } from "../render/webgl";
import { createChannel } from "../sim/channel";
import { createSimHost } from "../sim/simHost";
import { potagerStore } from "../storage/potagerStore";
import { PotagerHud } from "./PotagerHud";
import { PotagerToaster } from "./PotagerToaster";
import { useFreeCamera } from "./useFreeCamera";

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,700&display=swap";
const CAMERA_SAVE_MS = 2000;

function loadFont() {
  if (document.querySelector(`link[href="${FONT_URL}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = FONT_URL;
  document.head.appendChild(link);
}

const withCamera =
  (rig: CameraRig) =>
  (s: PotagerSave): PotagerSave => ({
    ...s,
    camera: { ...rig.target(), mode: rig.mode() },
  });

export default function PotagerApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rig, setRig] = useState<CameraRig | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<CameraMode>("follow");
  const [webglOk] = useState(hasWebgl);
  const [failed, setFailed] = useState(false);
  const hostRef = useRef<ReturnType<typeof createSimHost> | null>(null);

  useEffect(loadFont, []);

  useEffect(() => {
    if (!webglOk) return;
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
        let scene: ReturnType<typeof createPotagerScene>;
        try {
          scene = createPotagerScene(canvasRef.current, "potager", save);
        } catch {
          setFailed(true);
          return;
        }
        scene.start();
        setRig(scene.rig);
        setCanvas(canvasRef.current);
        setMode(scene.rig.mode());
        const unsubscribe = host.subscribe((s) => scene.sync(s));
        let saved = scene.rig.target();
        const id = setInterval(() => {
          const t = scene.rig.target();
          if (Math.hypot(t.x - saved.x, t.z - saved.z) < 0.01) return;
          saved = t;
          host.update(withCamera(scene.rig));
        }, CAMERA_SAVE_MS);
        const onResize = () => scene.resize();
        window.addEventListener("resize", onResize);
        cleanup = () => {
          clearInterval(id);
          unsubscribe();
          window.removeEventListener("resize", onResize);
          host.update(withCamera(scene.rig));
          scene.dispose();
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
  }, [webglOk]);

  useFreeCamera(rig, canvas);

  function toggleMode() {
    if (!rig) return;
    const next = rig.mode() === "follow" ? "free" : "follow";
    rig.setMode(next);
    setMode(next);
    hostRef.current?.update(withCamera(rig));
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1a1410] select-none">
      <PotagerToaster />
      {failed ? (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[#f1e6d2]">
          Le Potager n'a pas pu être chargé.
        </div>
      ) : webglOk ? (
        <>
          <canvas ref={canvasRef} className="block h-full w-full" />
          {rig && <PotagerHud mode={mode} onToggleMode={toggleMode} />}
        </>
      ) : (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[#f1e6d2]">
          Le Potager a besoin de WebGL, qui n'est pas disponible sur cet appareil.
        </div>
      )}
    </div>
  );
}
