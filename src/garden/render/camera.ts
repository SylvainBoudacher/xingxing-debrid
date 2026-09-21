import type { Rect } from "../core/plots";
import type { Framed } from "./framing";
import { wx, wz } from "./world";

export interface CameraPose {
  x: number;
  y: number;
  z: number;
  look: [number, number, number];
}

export interface CameraRig {
  pose(): CameraPose;
  // le champ a changé de taille : nouveau cadrage de référence, décalage conservé
  setFrame(frame: Framed, rect: Rect): void;
  pan(dx: number, dz: number): void;
  zoomBy(delta: number): void;
  nudge(dt: number, dir: { x: number; z: number }): void;
  reset(): void;
  // vrai tant que le joueur cadre : la boucle passe alors à 60 images/s
  moving(now: number): boolean;
  readonly moved: boolean;
  readonly zoom: number;
}

export const ZOOM = { min: 0.5, max: 2 } as const;

// la visée peut sortir du champ de deux cases : assez pour longer un bord, pas pour le perdre
const MARGIN = 2;
// cases par seconde au clavier, au cadrage d'origine
const KEY_SPEED = 7;
// la caméra reste "en mouvement" ce temps après la dernière commande : un pan à la
// souris arrive par à-coups, la cadence ne doit pas retomber entre deux événements
export const MOTION_TAIL = 250;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function createCameraRig(frame: Framed, rect: Rect): CameraRig {
  let view = frame;
  let field = rect;
  let offX = 0;
  let offZ = 0;
  let zoom = 1;
  let lastInput = -Infinity;

  function pan(dx: number, dz: number) {
    offX += dx;
    offZ += dz;
    lastInput = performance.now();
    clampOffsets();
  }

  function clampOffsets() {
    const [lx, , lz] = view.look;
    offX = clamp(offX, wx(field.x) - MARGIN - lx, wx(field.x + field.w - 1) + MARGIN - lx);
    offZ = clamp(offZ, wz(field.y) - MARGIN - lz, wz(field.y + field.h - 1) + MARGIN - lz);
  }

  return {
    pose() {
      const look: [number, number, number] = [
        view.look[0] + offX,
        view.look[1],
        view.look[2] + offZ,
      ];
      return {
        x: look[0],
        y: look[1] + (view.y - view.look[1]) * zoom,
        z: look[2] + (view.z - view.look[2]) * zoom,
        look,
      };
    },
    setFrame(next, nextRect) {
      view = next;
      field = nextRect;
      clampOffsets();
    },
    pan,
    zoomBy(delta) {
      zoom = clamp(zoom * Math.exp(delta), ZOOM.min, ZOOM.max);
      lastInput = performance.now();
    },
    nudge(dt, dir) {
      const step = KEY_SPEED * dt * zoom;
      pan(dir.x * step, dir.z * step);
    },
    moving(now) {
      return now - lastInput < MOTION_TAIL;
    },
    reset() {
      offX = 0;
      offZ = 0;
      zoom = 1;
    },
    get moved() {
      return offX !== 0 || offZ !== 0 || zoom !== 1;
    },
    get zoom() {
      return zoom;
    },
  };
}
