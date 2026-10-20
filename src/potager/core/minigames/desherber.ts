import type { Grade } from "../types";
import type { Minigame } from "./types";

// Tension : appuyer fait monter le curseur, relâcher le fait redescendre ;
// le garder dans la zone mobile fait sortir la racine.
const HALF_ZONE = 0.11,
  LIMIT_S = 8,
  PERFECT_OUT_S = 0.6;

export interface DesherberView {
  cursor: number;
  zone: number;
  halfZone: number;
  progress: number;
}

export function createDesherber(): Minigame<DesherberView> {
  let t = 0,
    cursor = 0.2,
    vel = 0,
    progress = 0,
    out = 0,
    hold = false;
  let grade: Grade | null = null;
  const zone = () => 0.5 + Math.sin(t * 1.3) * 0.25 + Math.sin(t * 2.9) * 0.08;
  return {
    press(input, down) {
      if (!grade && input === "action") hold = down;
    },
    update(dt) {
      if (grade) return;
      t += dt;
      vel += (hold ? 2.2 : -1.8) * dt;
      vel *= Math.pow(0.9, dt * 60);
      cursor = Math.min(1, Math.max(0, cursor + vel * dt * 4));
      if (cursor <= 0 || cursor >= 1) vel = 0;
      const inside = Math.abs(cursor - zone()) < HALF_ZONE;
      progress = Math.min(1, Math.max(0, progress + (inside ? 0.45 : -0.25) * dt));
      if (!inside) out += dt;
      if (progress >= 1) grade = out < PERFECT_OUT_S ? "parfait" : "bien";
      else if (t >= LIMIT_S) grade = "rate";
    },
    view: () => ({ cursor, zone: zone(), halfZone: HALF_ZONE, progress }),
    result: () => (grade ? { grade } : null),
  };
}
