import type { Rect } from "../core/catalog/map";
import type { CameraMode, CameraState } from "../core/types";

export const TILT_DEG = 33;
export const DISTANCE = 27;
export const FOV = 24;
export const FOV_NARROW = 34;

// marge : la cible ne s'approche pas assez du bord pour montrer le vide au-delà de la carte
const MARGIN_X = 6;
const MARGIN_Z = 4;
const HALF_LIFE = 0.15;

export interface CameraRig {
  target(): { x: number; z: number };
  mode(): CameraMode;
  setMode(m: CameraMode): void;
  follow(p: { x: number; z: number }): void;
  pan(dx: number, dz: number): void;
  update(dt: number): void;
  pose(): { position: [number, number, number]; look: [number, number, number] };
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function createCameraRig(
  init: CameraState,
  bounds: Rect,
  groundAt: (x: number, z: number) => number,
): CameraRig {
  const limit = (x: number, z: number) => ({
    x: clamp(x, bounds.x0 + MARGIN_X, bounds.x1 - MARGIN_X),
    z: clamp(z, bounds.z0 + MARGIN_Z, bounds.z1 - MARGIN_Z),
  });
  let { x, z } = limit(init.x, init.z);
  let mode = init.mode;
  let goal = { x, z };
  const tilt = (TILT_DEG * Math.PI) / 180;

  return {
    target: () => ({ x, z }),
    mode: () => mode,
    setMode(m) {
      mode = m;
    },
    follow(p) {
      goal = limit(p.x, p.z);
    },
    pan(dx, dz) {
      if (mode !== "free") return;
      ({ x, z } = limit(x + dx, z + dz));
    },
    update(dt) {
      if (mode !== "follow") return;
      const k = 1 - Math.pow(0.5, dt / HALF_LIFE);
      x += (goal.x - x) * k;
      z += (goal.z - z) * k;
    },
    pose() {
      const look: [number, number, number] = [x, groundAt(x, z) + 0.4, z];
      return {
        look,
        position: [x, look[1] + Math.sin(tilt) * DISTANCE, z + Math.cos(tilt) * DISTANCE],
      };
    },
  };
}
