import { hash } from "../core/hash";
import { mix } from "./color";
import { PAL } from "./palette";
import { buf, outline, put, rampAt, toCanvas, type Buf } from "./raster";

export type GroundKind = "grass" | "soil" | "wet" | "dry";

const S = 48;
const K = S / 32;
const cache = new Map<string, HTMLCanvasElement>();

export function groundTile(kind: GroundKind, tx: number, ty: number): HTMLCanvasElement {
  const key = `${kind}:${tx}:${ty}`;
  let cv = cache.get(key);
  if (!cv) {
    cv = paintTile(kind, tx, ty);
    cache.set(key, cv);
  }
  return cv;
}

function paintTile(kind: GroundKind, tx: number, ty: number): HTMLCanvasElement {
  const b = buf(S, S);
  const pal = PAL[kind];
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      if (kind === "grass") {
        const n = hash(Math.floor((x + tx * S) / (3 * K)), Math.floor((y + ty * S) / (3 * K)), 3);
        put(b, x, y, n > 0.55 ? pal[2] : pal[1]);
      } else {
        // sillons tous les 8 unités
        const v = (y / K) % 8;
        const t =
          (v < 1.2 ? 0.05 : v < 2.4 ? 0.7 : 0.4) + (hash(x + tx * 97, y + ty * 57) - 0.5) * 0.25;
        put(b, x, y, rampAt(pal, t));
      }
    }
  if (kind === "grass") {
    const blades = Math.round(22 * K * K);
    for (let i = 0; i < blades; i++) {
      const x = Math.floor(hash(tx, ty, i) * S);
      const y = Math.floor(hash(ty, tx, i + 400) * S);
      const h = 2 + Math.floor(hash(i, tx, ty) * 3 * K);
      put(b, x, y + 1, pal[0]);
      for (let j = 0; j < h; j++)
        put(b, x + (j === h - 1 && i % 2 ? 1 : 0), y - j, j > h / 2 ? pal[3] : pal[2]);
    }
    // feuilles mortes tombées dans l'herbe
    for (let i = 0; i < 2; i++) {
      if (hash(tx, ty, i + 900) <= 0.55) continue;
      const x = Math.floor(hash(tx, ty, i + 901) * (S - 4));
      const y = Math.floor(hash(tx, ty, i + 902) * (S - 4));
      const c = PAL.fall[i + (((tx % 2) + 2) % 2)];
      put(b, x, y, c);
      put(b, x + 1, y, c);
      put(b, x + 1, y + 1, c);
      put(b, x + 2, y + 1, mix(c, "#000000", 0.3));
    }
  } else {
    for (let i = 0; i < 6 * K; i++) {
      const x = Math.floor(hash(tx, ty, i + 50) * S);
      const y = Math.floor(hash(ty, tx, i + 60) * S);
      put(b, x, y, pal[3]);
      put(b, x, y + 1, pal[0]);
    }
    if (kind === "dry") {
      // craquelures : petites marches aléatoires sombres
      for (let i = 0; i < 4; i++) {
        let x = Math.floor(hash(tx, ty, i + 70) * S);
        let y = Math.floor(hash(ty, tx, i + 80) * S);
        for (let j = 0; j < 9 * K; j++) {
          put(b, x, y, pal[0]);
          x += hash(tx + j, ty, i + 90) > 0.35 ? 1 : 0;
          y += hash(tx, ty + j, i + 95) > 0.5 ? 1 : -1;
        }
      }
    }
  }
  return toCanvas(b);
}

export const HOLE_SIZE = 36;
const HOLE_IN = 9.5;
const HOLE_OUT = 15.5;

// Trou vu de dessus : fond sombre, paroi éclairée côté opposé à la lumière, bourrelet de terre.
export function holeBuf(): Buf {
  const b = buf(HOLE_SIZE, HOLE_SIZE);
  const mid = HOLE_SIZE / 2;
  for (let y = 0; y < HOLE_SIZE; y++)
    for (let x = 0; x < HOLE_SIZE; x++) {
      const dx = x + 0.5 - mid;
      const dy = y + 0.5 - mid;
      const r = Math.hypot(dx, dy);
      if (r > HOLE_OUT) continue;
      const lit = -(dx * 0.6 + dy * 0.8) / (r || 1);
      if (r > HOLE_IN) {
        const bump = 1 - Math.abs(r - (HOLE_IN + HOLE_OUT) / 2) / ((HOLE_OUT - HOLE_IN) / 2);
        put(b, x, y, rampAt(PAL.soil, 0.45 + 0.35 * lit * bump + 0.15 * bump));
      } else {
        const depth = r / HOLE_IN;
        put(b, x, y, depth < 0.6 ? "#140c08" : rampAt(PAL.wet, 0.3 - 0.35 * lit * depth));
      }
    }
  outline(b);
  return b;
}

let hole: HTMLCanvasElement | null = null;

export function holeTile(): HTMLCanvasElement {
  hole ??= toCanvas(holeBuf());
  return hole;
}
