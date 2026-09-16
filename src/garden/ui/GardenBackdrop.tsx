import { useEffect, useRef, useState } from "react";
import type { GardenSave } from "../core/types";
import { createGardenScene, type GardenScene } from "../render/createGardenScene";
import { hasWebgl } from "../render/webgl";
import { loadGarden } from "../storage/gardenStore";
import { backdropMode } from "./backdropMode";
import { GardenFrozen } from "./GardenFrozen";
import { onGardenOpenChange } from "./gardenWindow";

const RESYNC_MS = 60_000;

export function GardenBackdrop({
  active,
  onWebglError,
}: {
  active: boolean;
  onWebglError: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GardenScene | null>(null);
  const saveRef = useRef<GardenSave | null>(null);
  const [focused, setFocused] = useState(() => document.hasFocus());
  const [hidden, setHidden] = useState(() => document.hidden);
  const [gardenOpen, setGardenOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasWebgl()) {
      onWebglError();
      return;
    }
    let scene: GardenScene;
    try {
      scene = createGardenScene(canvasRef.current!, "backdrop");
    } catch {
      onWebglError();
      return;
    }
    sceneRef.current = scene;
    let alive = true;
    loadGarden().then(({ save }) => {
      if (!alive) return;
      saveRef.current = save;
      scene.sync(save, Date.now());
      setReady(true);
    });
    const id = setInterval(
      () => saveRef.current && scene.sync(saveRef.current, Date.now()),
      RESYNC_MS,
    );
    return () => {
      alive = false;
      clearInterval(id);
      scene.dispose();
      sceneRef.current = null;
    };
  }, [onWebglError]);

  useEffect(() => {
    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);
    const onVisibility = () => setHidden(document.hidden);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    const stop = onGardenOpenChange(setGardenOpen);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, []);

  const mode = backdropMode({ active, focused, hidden, gardenOpen });

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !ready) return;
    if (mode === "frozen") {
      scene.renderOnce();
      scene.stop();
      return;
    }
    let alive = true;
    // retour d'un gel : la fenêtre Potager a pu modifier la sauvegarde
    loadGarden().then(({ save }) => {
      if (!alive) return;
      saveRef.current = save;
      scene.sync(save, Date.now());
      if (mode === "run") scene.start();
      else {
        scene.stop();
        scene.renderOnce();
      }
    });
    return () => {
      alive = false;
    };
  }, [mode, ready]);

  const frozen = mode === "frozen";
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#120c10]">
      <canvas
        ref={canvasRef}
        className={`h-full w-full transition-[filter] duration-500 ${
          frozen ? "scale-105 blur-[10px] brightness-[.55] saturate-[.7]" : ""
        }`}
      />
      {frozen && <GardenFrozen />}
    </div>
  );
}
