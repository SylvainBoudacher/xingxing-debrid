import { hash } from "../core/hash";
import { mix } from "./color";
import { PAL } from "./palette";
import { buf, put, rampAt, toCanvas } from "./raster";

export type GroundKind = "grass" | "soil" | "wet";

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
  }
  return toCanvas(b);
}
