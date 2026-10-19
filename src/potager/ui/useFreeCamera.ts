import { useEffect } from "react";
import { DISTANCE, fovFor, TILT_DEG, type CameraRig } from "../render/cameraRig";

const SPEED = 8;
const EDGE = 24;

// Mode libre : glisser et bords d'écran. Sans effet en mode suivi.
export function useFreeCamera(rig: CameraRig | null, canvas: HTMLCanvasElement | null) {
  useEffect(() => {
    if (!rig || !canvas) return;
    let drag: { x: number; y: number } | null = null;
    let pointer: { x: number; y: number } | null = null;
    // unités de sol par pixel d'écran, au centre de la vue
    const unitsPerPx = () => {
      const h = Math.max(1, canvas.clientHeight);
      const fov = fovFor(canvas.clientWidth / h);
      return (2 * DISTANCE * Math.tan(((fov / 2) * Math.PI) / 180)) / h;
    };
    const foreshortening = 1 / Math.sin((TILT_DEG * Math.PI) / 180);

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || rig.mode() !== "free") return;
      drag = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      if (!drag) return;
      const k = unitsPerPx();
      rig.pan(-(e.clientX - drag.x) * k, -(e.clientY - drag.y) * k * foreshortening);
      drag = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => (drag = null);
    const onLeave = () => (pointer = null);
    const onBlur = () => (pointer = null);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (rig.mode() !== "free") return;
      let dx = 0,
        dz = 0;
      if (pointer && !drag) {
        if (pointer.x < EDGE) dx -= 1;
        if (pointer.x > innerWidth - EDGE) dx += 1;
        if (pointer.y < EDGE) dz -= 1;
        if (pointer.y > innerHeight - EDGE) dz += 1;
      }
      if (dx || dz) rig.pan(Math.sign(dx) * SPEED * dt, Math.sign(dz) * SPEED * dt);
    };
    raf = requestAnimationFrame(loop);

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onBlur);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onBlur);
    };
  }, [rig, canvas]);
}
