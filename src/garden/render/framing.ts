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

export interface Framed extends View {
  // de combien le champ a grandi depuis le champ de départ : sert aussi au brouillard
  scale: number;
}

export function framing(view: View, rect: Rect): Framed {
  const cx = (wx(rect.x) + wx(rect.x + rect.w - 1)) / 2;
  const cz = (wz(rect.y) + wz(rect.y + rect.h - 1)) / 2;
  const look: [number, number, number] = [
    cx + (view.look[0] - BASE.cx),
    view.look[1],
    cz + (view.look[2] - BASE.cz),
  ];
  // les rangées ajoutées arrivent vers la caméra : elles mangent autant de place
  // à l'écran que la largeur, d'où un recul proportionnel au plus grand des deux
  const k = Math.max(rect.w / BASE.w, rect.h / BASE.h);
  return {
    ...view,
    scale: k,
    look,
    y: look[1] + (view.y - view.look[1]) * k,
    z: look[2] + (view.z - view.look[2]) * k,
  };
}
