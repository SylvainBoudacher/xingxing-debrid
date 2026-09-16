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

// rayon irrégulier selon l'angle
const wobble = (a: number, seed: number, amt: number) =>
  1 +
  amt *
    (Math.sin(a * 3 + seed) * 0.5 +
      Math.sin(a * 5 + seed * 2) * 0.3 +
      Math.sin(a * 7 + seed * 3) * 0.2);

const grainy = (t: number, x: number, y: number) =>
  rampAt(PAL.soil, t + (hash(x >> 1, y >> 1, 9) - 0.5) * 0.3);

// Trou de plantation vu de dessus : petit creux au bord irrégulier et tas de terre sortie à côté.
export function holeBuf(): Buf {
  const b = buf(HOLE_SIZE, HOLE_SIZE);
  const mid = HOLE_SIZE / 2;
  const mx = mid + 8;
  const my = mid - 7;
  for (let y = 0; y < HOLE_SIZE; y++)
    for (let x = 0; x < HOLE_SIZE; x++) {
      const dx = x + 0.5 - mx;
      const dy = y + 0.5 - my;
      const r = Math.hypot(dx / 1.3, dy);
      const R = 5.5 * wobble(Math.atan2(dy, dx), 2, 0.2);
      if (r < R) put(b, x, y, grainy(0.75 - (dx + dy) / 20 + (1 - r / R) * 0.15, x, y));
    }
  const hx = mid - 2;
  const hy = mid + 1;
  for (let y = 0; y < HOLE_SIZE; y++)
    for (let x = 0; x < HOLE_SIZE; x++) {
      const dx = x + 0.5 - hx;
      const dy = y + 0.5 - hy;
      const a = Math.atan2(dy, dx);
      const r = Math.hypot(dx, dy);
      const inner = 5.5 * wobble(a, 1, 0.18);
      if (r > 9 * wobble(a, 4, 0.15)) continue;
      const lit = -(dx * 0.6 + dy * 0.8) / (r || 1);
      if (r > inner) put(b, x, y, grainy(0.55 + 0.2 * lit, x, y));
      else put(b, x, y, rampAt(PAL.wet, 0.55 - 0.4 * lit * (r / inner) - (1 - r / inner) * 0.4));
    }
  outline(b);
  return b;
}

let hole: HTMLCanvasElement | null = null;

export function holeTile(): HTMLCanvasElement {
  hole ??= toCanvas(holeBuf());
  return hole;
}
