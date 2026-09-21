import type { Rect } from "../core/plots";
import { wx, wz } from "./world";

export interface View {
  y: number;
  z: number;
  look: [number, number, number];
  parallax: number;
}

export type SceneProfile = "backdrop" | "garden";

export const VIEWS: Record<SceneProfile, View> = {
  backdrop: { y: 6.2, z: 11.5, look: [0, 0.9, -0.6], parallax: 0 },
  garden: { y: 7.4, z: 11.8, look: [0.9, 0.2, 0.6], parallax: 0.6 },
};

// Cadrage réglé sur le champ de départ ; tout le reste s'en déduit.
const BASE = { w: 9, h: 5, cx: 0.5, cz: 0.5 };

// La profondeur s'enfonce vers l'horizon et se tasse à l'écran : elle pèse moins
// que la largeur dans le recul de la caméra.
const DEPTH_WEIGHT = 0.6;

export function framing(view: View, rect: Rect): View {
  const cx = (wx(rect.x) + wx(rect.x + rect.w - 1)) / 2;
  const cz = (wz(rect.y) + wz(rect.y + rect.h - 1)) / 2;
  const look: [number, number, number] = [
    cx + (view.look[0] - BASE.cx),
    view.look[1],
    cz + (view.look[2] - BASE.cz),
  ];
  const k = Math.max(rect.w / BASE.w, 1 + (rect.h / BASE.h - 1) * DEPTH_WEIGHT);
  return {
    ...view,
    look,
    y: look[1] + (view.y - view.look[1]) * k,
    z: look[2] + (view.z - view.look[2]) * k,
  };
}
