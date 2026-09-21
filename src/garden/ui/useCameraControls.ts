import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { GardenScene } from "../render/createGardenScene";

// Flèches et ZQSD : la même direction, en cases du champ.
const KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  q: [-1, 0],
  d: [1, 0],
  z: [0, -1],
  s: [0, 1],
};

const RECENTER_KEY = "r";
// la molette rend des deltas très variables selon la plateforme : on les écrase
const WHEEL_STEP = 0.0015;

const norm = (e: KeyboardEvent) => (e.key.length === 1 ? e.key.toLowerCase() : e.key);

export function useCameraControls(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  sceneRef: RefObject<GardenScene | null>,
  active: boolean,
): { panning: boolean; moved: boolean; recenter: () => void } {
  const [panning, setPanning] = useState(false);
  const [moved, setMoved] = useState(false);
  const held = useRef(new Set<string>());

  const recenter = useCallback(() => {
    sceneRef.current?.camera?.reset();
    setMoved(false);
  }, [sceneRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // la main reste au joueur : le clic droit cadre, il n'ouvre pas de menu
    const onMenu = (e: MouseEvent) => e.preventDefault();

    const onWheel = (e: WheelEvent) => {
      const controls = sceneRef.current?.camera;
      if (!controls) return;
      e.preventDefault();
      // molette vers le haut (delta négatif) : on se rapproche
      controls.zoomBy(e.deltaY * WHEEL_STEP);
      setMoved(controls.moved);
    };

    let from: { x: number; z: number } | null = null;

    const onMove = (e: PointerEvent) => {
      const controls = sceneRef.current?.camera;
      if (!controls || !from) return;
      const to = controls.groundAt(e.clientX, e.clientY);
      if (!to) return;
      // la terre colle au curseur : on rattrape l'écart mesuré sous lui
      controls.pan(from.x - to.x, from.z - to.z);
      setMoved(true);
    };

    const stop = () => {
      from = null;
      setPanning(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };

    const onDown = (e: PointerEvent) => {
      const controls = sceneRef.current?.camera;
      if (!controls || e.button !== 2) return;
      from = controls.groundAt(e.clientX, e.clientY);
      if (!from) return;
      setPanning(true);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", stop);
      window.addEventListener("pointercancel", stop);
    };

    canvas.addEventListener("contextmenu", onMenu);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("pointerdown", onDown);
    return () => {
      stop();
      canvas.removeEventListener("contextmenu", onMenu);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, [canvasRef, sceneRef]);

  useEffect(() => {
    const keys = held.current;
    const apply = () => {
      const dir = [...keys].reduce((acc, k) => ({ x: acc.x + KEYS[k][0], z: acc.z + KEYS[k][1] }), {
        x: 0,
        z: 0,
      });
      sceneRef.current?.camera?.setNudge(dir.x || dir.z ? dir : null);
    };
    const release = () => {
      keys.clear();
      sceneRef.current?.camera?.setNudge(null);
    };
    if (!active) {
      release();
      return;
    }

    const onDown = (e: KeyboardEvent) => {
      const key = norm(e);
      if (key === RECENTER_KEY) return recenter();
      if (!KEYS[key]) return;
      e.preventDefault();
      keys.add(key);
      apply();
      setMoved(true);
    };
    const onUp = (e: KeyboardEvent) => {
      if (!keys.delete(norm(e))) return;
      apply();
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    // une fenêtre qui perd le focus ne renvoie pas les relâchements
    window.addEventListener("blur", release);
    return () => {
      release();
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", release);
    };
  }, [active, recenter, sceneRef]);

  return { panning, moved, recenter };
}
