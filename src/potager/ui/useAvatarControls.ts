import { useEffect, useRef } from "react";
import { findPath } from "../core/path";
import type { Point } from "../core/types";
import type { PotagerScene } from "../render/createPotagerScene";

const CLICK_PX = 5;
// positions physiques : ZQSD sur un clavier AZERTY
const KEYS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  KeyW: [0, -1],
  KeyS: [0, 1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
};

export interface AvatarControlOptions {
  // mini-jeu ou panneau ouvert : l'avatar ne bouge plus
  locked: boolean;
  // un clic sur un élément du jardin est pris en charge ailleurs (renvoie vrai)
  interceptClick?: (p: Point) => boolean;
  // le joueur reprend la main au clavier
  onManualMove?: () => void;
}

// Clavier : marche directe. Clic (sans glisser) sur le sol : l'avatar s'y rend.
export function useAvatarControls(
  scene: PotagerScene | null,
  canvas: HTMLCanvasElement | null,
  onFollow: () => void,
  options: AvatarControlOptions,
) {
  const opts = useRef(options);
  useEffect(() => {
    opts.current = options;
  });

  useEffect(() => {
    if (options.locked) scene?.avatar.setInput(0, 0);
  }, [options.locked, scene]);

  useEffect(() => {
    if (!scene || !canvas) return;
    const held = new Set<string>();
    let down: { x: number; y: number } | null = null;

    const apply = () => {
      let dx = 0,
        dz = 0;
      for (const code of held) {
        dx += KEYS[code][0];
        dz += KEYS[code][1];
      }
      scene.avatar.setInput(dx, dz);
    };
    const release = () => {
      held.clear();
      scene.avatar.setInput(0, 0);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      // macOS n'envoie pas de keyup pour une touche relâchée pendant que Cmd est tenu
      if (e.key === "Meta") return release();
      if (!(e.code in KEYS) || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      if (held.has(e.code)) return;
      held.add(e.code);
      if (opts.current.locked) return;
      if (scene.rig.mode() === "free") onFollow();
      opts.current.onManualMove?.();
      apply();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!held.delete(e.code) || opts.current.locked) return;
      apply();
    };
    const onVisibility = () => document.hidden && release();

    const onDown = (e: PointerEvent) => {
      if (e.button === 0) down = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      if (!down || e.button !== 0) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved >= CLICK_PX || opts.current.locked) return;
      const target = scene.pick(e.clientX, e.clientY);
      if (!target || opts.current.interceptClick?.(target)) return;
      opts.current.onManualMove?.();
      const path = findPath(scene.avatar.pose(), target, scene.walkable);
      if (path) scene.avatar.walkTo(path);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      release();
    };
  }, [scene, canvas, onFollow]);
}
