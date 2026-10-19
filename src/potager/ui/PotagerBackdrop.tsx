import { useEffect, useRef, useState } from "react";
import type { CameraState } from "../core/types";
import { createPotagerScene, type PotagerScene } from "../render/createPotagerScene";
import { hasWebgl } from "../render/webgl";
import { getMainHost } from "../sim/mainHost";
import { backdropMode } from "./backdropMode";
import { onPotagerOpenChange } from "./potagerWindow";
import { PotagerFrozen } from "./PotagerFrozen";

// le fond ne suit pas l'avatar : il garde la dernière vue du Potager
const fixed = (c: CameraState): CameraState => ({ ...c, mode: "free" });

export function PotagerBackdrop({
  active,
  onWebglError,
}: {
  active: boolean;
  onWebglError: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<PotagerScene | null>(null);
  const [ready, setReady] = useState(false);
  const [focused, setFocused] = useState(() => document.hasFocus());
  const [hidden, setHidden] = useState(() => document.hidden);
  const [potagerOpen, setPotagerOpen] = useState(false);

  useEffect(() => {
    if (!hasWebgl()) {
      onWebglError();
      return;
    }
    const host = getMainHost();
    let scene: PotagerScene | null = null;
    let camera = "";
    const apply = () => {
      const save = host.state();
      if (!save || !canvasRef.current) return;
      if (!scene) {
        try {
          scene = createPotagerScene(canvasRef.current, "backdrop", {
            ...save,
            camera: fixed(save.camera),
          });
        } catch {
          onWebglError();
          return;
        }
        sceneRef.current = scene;
        setReady(true);
      }
      scene.sync(save);
      const key = `${save.camera.x},${save.camera.z},${save.avatar.x},${save.avatar.z}`;
      if (key !== camera) {
        camera = key;
        scene.rig.reset(fixed(save.camera));
        scene.renderOnce();
      }
    };
    apply();
    const unsubscribe = host.subscribe(apply);
    const onResize = () => scene?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      unsubscribe();
      window.removeEventListener("resize", onResize);
      scene?.dispose();
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
    const stop = onPotagerOpenChange(setPotagerOpen);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, []);

  const mode = backdropMode({ active, focused, hidden, potagerOpen });

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !ready) return;
    if (mode === "run") scene.start();
    else {
      scene.stop();
      scene.renderOnce();
    }
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
      {frozen && <PotagerFrozen />}
    </div>
  );
}
