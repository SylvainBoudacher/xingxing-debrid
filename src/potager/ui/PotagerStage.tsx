import { useEffect, useRef, useState } from "react";
import type { CameraState } from "../core/types";
import { createPotagerScene, type PotagerScene } from "../render/createPotagerScene";
import { hasWebgl } from "../render/webgl";
import { getMainHost } from "../sim/mainHost";
import { backdropMode } from "./backdropMode";
import { PotagerGame } from "./PotagerGame";

// le fond ne suit pas l'avatar : il garde la dernière vue du Potager
const fixed = (c: CameraState): CameraState => ({ ...c, mode: "free" });

// Une seule scène : fond animé derrière l'app, et terrain de jeu quand on y entre.
export function PotagerStage({
  active,
  playing,
  onExit,
  onWebglError,
}: {
  active: boolean;
  playing: boolean;
  onExit: () => void;
  onWebglError: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<{ scene: PotagerScene; canvas: HTMLCanvasElement } | null>(
    null,
  );
  const scene = stage?.scene ?? null;
  const [focused, setFocused] = useState(() => document.hasFocus());
  const [hidden, setHidden] = useState(() => document.hidden);
  // en jeu, la scène fait foi pour la caméra : le fond ne la recale plus sur la sauvegarde
  const playingRef = useRef(playing);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    if (!hasWebgl()) {
      onWebglError();
      return;
    }
    const host = getMainHost();
    let created: PotagerScene | null = null;
    let camera = "";
    const apply = () => {
      const save = host.state();
      if (!save || !canvasRef.current) return;
      if (!created) {
        try {
          created = createPotagerScene(canvasRef.current, "backdrop", {
            ...save,
            camera: fixed(save.camera),
          });
        } catch {
          onWebglError();
          return;
        }
        setStage({ scene: created, canvas: canvasRef.current });
      }
      created.sync(save);
      if (playingRef.current) return;
      const key = `${save.camera.x},${save.camera.z},${save.avatar.x},${save.avatar.z}`;
      if (key !== camera) {
        camera = key;
        created.rig.reset(fixed(save.camera));
        created.renderOnce();
      }
    };
    apply();
    const unsubscribe = host.subscribe(apply);
    const onResize = () => created?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      unsubscribe();
      window.removeEventListener("resize", onResize);
      created?.dispose();
    };
  }, [onWebglError]);

  useEffect(() => {
    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);
    const onVisibility = () => setHidden(document.hidden);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const mode = backdropMode({ active: active || playing, focused, hidden });

  useEffect(() => {
    if (!scene) return;
    if (mode === "run") scene.start();
    else {
      scene.stop();
      scene.renderOnce();
    }
  }, [mode, scene]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#120c10]">
      <canvas ref={canvasRef} className="block h-full w-full" />
      {playing && stage && (
        <PotagerGame
          scene={stage.scene}
          canvas={stage.canvas}
          host={getMainHost()}
          onExit={onExit}
        />
      )}
    </div>
  );
}
