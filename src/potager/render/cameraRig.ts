import type { Rect } from "../core/catalog/map";
import type { CameraMode, CameraState } from "../core/types";

export const TILT_DEG = 33;
export const DISTANCE = 27;
export const FOV = 24;
export const FOV_NARROW = 34;

// champ vertical élargi quand la fenêtre est étroite
export const fovFor = (aspect: number) => (aspect < 1.3 ? FOV_NARROW : FOV);

// marge : la cible ne s'approche pas assez du bord pour montrer le vide au-delà de la carte
const MARGIN_X = 6;
const MARGIN_Z = 4;
const HALF_LIFE = 0.15;
// vue aérienne du fond (hauteur 1) : plus loin et plus plongeante que la vue de jeu (hauteur 0)
export const AERIAL_DISTANCE = 36;
export const AERIAL_TILT_DEG = 46;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export interface CameraRig {
  target(): { x: number; z: number };
  mode(): CameraMode;
  setMode(m: CameraMode): void;
  follow(p: { x: number; z: number }): void;
  reset(state: CameraState): void;
  pan(dx: number, dz: number): void;
  update(dt: number): void;
  // anime la hauteur ; en mode suivi, la cible glisse en même temps jusqu'au point suivi
  liftTo(goal: number, seconds: number): void;
  pose(): {
    position: [number, number, number];
    look: [number, number, number];
    distance: number;
  };
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
  let lift = 0;
  let swoop: {
    from: { x: number; z: number };
    l0: number;
    l1: number;
    t: number;
    dur: number;
  } | null = null;

  return {
    target: () => ({ x, z }),
    mode: () => mode,
    setMode(m) {
      mode = m;
    },
    follow(p) {
      goal = limit(p.x, p.z);
    },
    reset(state) {
      ({ x, z } = limit(state.x, state.z));
      goal = { x, z };
      mode = state.mode;
    },
    pan(dx, dz) {
      if (mode !== "free") return;
      ({ x, z } = limit(x + dx, z + dz));
    },
    liftTo(l1, seconds) {
      if (seconds <= 0) {
        lift = l1;
        swoop = null;
      } else swoop = { from: { x, z }, l0: lift, l1, t: 0, dur: seconds };
    },
    update(dt) {
      if (swoop) {
        swoop.t = Math.min(swoop.dur, swoop.t + dt);
        const k = easeInOut(swoop.t / swoop.dur);
        lift = lerp(swoop.l0, swoop.l1, k);
        if (mode === "follow") {
          x = lerp(swoop.from.x, goal.x, k);
          z = lerp(swoop.from.z, goal.z, k);
        }
        if (swoop.t >= swoop.dur) swoop = null;
        return;
      }
      if (mode !== "follow") return;
      const k = 1 - Math.pow(0.5, dt / HALF_LIFE);
      x += (goal.x - x) * k;
      z += (goal.z - z) * k;
    },
    pose() {
      const look: [number, number, number] = [x, groundAt(x, z) + 0.4, z];
      const distance = lerp(DISTANCE, AERIAL_DISTANCE, lift);
      const tilt = (lerp(TILT_DEG, AERIAL_TILT_DEG, lift) * Math.PI) / 180;
      return {
        look,
        distance,
        position: [x, look[1] + Math.sin(tilt) * distance, z + Math.cos(tilt) * distance],
      };
    },
  };
}
