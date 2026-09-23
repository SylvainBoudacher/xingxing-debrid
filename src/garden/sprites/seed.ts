import type { Rarity } from "../core/types";
import { PAL } from "./palette";
import {
  buf,
  ell,
  leaf,
  outline,
  put,
  sphere,
  stem,
  toCanvas,
  type Buf,
  type Ramp,
} from "./raster";

// Graine de carte au format des sprites de fleur (48x72, unités 32x48) : elle ne montre
// que sa rareté, l'espèce reste une surprise jusqu'à l'éclosion.
const K = 1.5;
const TILT = 0.35;

const SHELL: Record<Rarity, Ramp> = {
  commune: PAL.brown,
  rare: PAL.blue,
  epique: PAL.violet,
  legendaire: PAL.glow,
};

const dot = (b: Buf, x: number, y: number, col: string) =>
  put(b, Math.round(x * K), Math.round(y * K), col);

const DECOR: Record<Rarity, (b: Buf) => void> = {
  commune() {},
  rare(b) {
    for (const [x, y] of [
      [13, 24],
      [18, 31],
      [14, 35],
    ])
      dot(b, x, y, PAL.white[3]);
  },
  epique(b) {
    for (let i = 0; i < 6; i++) dot(b, 11.5 + i * 1.6, 22 + i * 3, PAL.lilac[3]);
  },
  legendaire(b) {
    stem(b, K, 18, 17.5, 19, 11, 1, PAL.green);
    leaf(b, K, 19, 12, -2.4, 5, 2.4, PAL.green);
    leaf(b, K, 19, 13, -0.5, 4.5, 2.2, PAL.green);
  },
};

export function seedBuf(rarity: Rarity): Buf {
  const b = buf(48, 72);
  const shell = SHELL[rarity];
  ell(b, K, 16, 29, 8.5, 12.5, TILT, sphere(shell));
  // sillon de la graine
  stem(b, K, 13.5, 19.5, 15.5, 38.5, 0.7, [shell[0], shell[0], shell[1], shell[1]], 2);
  DECOR[rarity](b);
  outline(b);
  return b;
}

const canvases = new Map<Rarity, HTMLCanvasElement>();

export function seedCanvas(rarity: Rarity): HTMLCanvasElement {
  let cv = canvases.get(rarity);
  if (!cv) {
    cv = toCanvas(seedBuf(rarity));
    canvases.set(rarity, cv);
  }
  return cv;
}
