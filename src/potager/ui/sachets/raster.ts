// Tampon de sprite : géométrie exprimée en unités 32x48, mise à l'échelle par k.
export type Ramp = readonly [string, string, string, string];

export interface Buf {
  w: number;
  h: number;
  c: (string | null)[];
}

type Shade = (
  nx: number,
  ny: number,
  d: number,
  edge: boolean,
  ux: number,
  uy: number,
) => string | null;

const OUTLINE = "#140a14";
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const hexRgb = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

function mix(a: string, b: string, t: number): string {
  const B = hexRgb(b);
  return (
    "#" +
    hexRgb(a)
      .map((v, i) =>
        Math.round(v + (B[i] - v) * t)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

export const rampAt = (ramp: Ramp, t: number): string => ramp[clamp(Math.floor(t * 4), 0, 3)];

export const buf = (w: number, h: number): Buf => ({ w, h, c: new Array(w * h).fill(null) });

export function put(b: Buf, x: number, y: number, col: string | null): void {
  if (col && x >= 0 && y >= 0 && x < b.w && y < b.h) b.c[y * b.w + x] = col;
}

const get = (b: Buf, x: number, y: number): string | null =>
  x < 0 || y < 0 || x >= b.w || y >= b.h ? null : b.c[y * b.w + x];

export function ell(
  b: Buf,
  k: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number,
  shade: Shade,
): void {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const m = Math.max(rx, ry);
  const small = Math.min(rx, ry) * k;
  const edgeT = small < 1.6 ? 2 : 1 - 1.1 / small;
  for (let py = Math.floor((cy - m) * k); py <= Math.ceil((cy + m) * k); py++)
    for (let px = Math.floor((cx - m) * k); px <= Math.ceil((cx + m) * k); px++) {
      const ux = (px + 0.5) / k - cx;
      const uy = (py + 0.5) / k - cy;
      const lx = ux * cos + uy * sin;
      const ly = -ux * sin + uy * cos;
      const nx = lx / rx;
      const ny = ly / ry;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      put(b, px, py, shade(nx, ny, d, Math.sqrt(d) > edgeT, ux, uy));
    }
}

// Ombrage de boule éclairée en haut à gauche.
export const sphere =
  (ramp: Ramp): Shade =>
  (_nx, _ny, d, edge, ux, uy) => {
    const r = Math.hypot(ux, uy) || 1;
    const lit = -((ux / r) * 0.6 + (uy / r) * 0.8) * Math.sqrt(d);
    return rampAt(ramp, 0.5 + 0.45 * lit - (edge ? 0.3 : 0));
  };

export function leaf(
  b: Buf,
  k: number,
  cx: number,
  cy: number,
  ang: number,
  len: number,
  wid: number,
  ramp: Ramp,
): void {
  const x = cx + (Math.cos(ang) * len) / 2;
  const y = cy + (Math.sin(ang) * len) / 2;
  ell(b, k, x, y, len / 2, wid / 2, ang, (nx, ny, _d, edge) => {
    const along = (nx + 1) / 2;
    if (Math.abs(ny) < 0.13 && along > 0.08 && along < 0.85) return ramp[0];
    let t = 0.35 + 0.35 * along + (ny < 0 ? 0.2 : -0.1);
    if (edge) t -= 0.3;
    return rampAt(ramp, t);
  });
}

// Tige en courbe de Bézier quadratique ; `bend` décale le point de contrôle.
export function stem(
  b: Buf,
  k: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  w: number,
  ramp: Ramp,
  bend = 0,
): void {
  const pw = Math.max(1, Math.round(w * k));
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * k * 1.6) + 1;
  const mx = (x0 + x1) / 2 + bend;
  const my = (y0 + y1) / 2;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const [a, c, e] = [(1 - s) * (1 - s), 2 * s * (1 - s), s * s];
    const px = Math.round((a * x0 + c * mx + e * x1) * k - pw / 2);
    const py = Math.round((a * y0 + c * my + e * y1) * k);
    for (let j = 0; j < pw; j++) put(b, px + j, py, j === 0 && pw > 1 ? ramp[2] : ramp[1]);
  }
}

// Contour coloré : chaque pixel vide qui touche la forme prend la teinte sombre voisine.
export function outline(b: Buf): void {
  const out = b.c.slice();
  for (let y = 0; y < b.h; y++)
    for (let x = 0; x < b.w; x++) {
      if (b.c[y * b.w + x]) continue;
      const n = get(b, x - 1, y) || get(b, x + 1, y) || get(b, x, y - 1) || get(b, x, y + 1);
      if (n) out[y * b.w + x] = mix(n, OUTLINE, 0.65);
    }
  b.c = out;
}

// Recadre sur la boîte des pixels dessinés.
export function crop(b: Buf): Buf {
  let x0 = b.w;
  let y0 = b.h;
  let x1 = -1;
  let y1 = -1;
  b.c.forEach((col, i) => {
    if (!col) return;
    const x = i % b.w;
    const y = (i - x) / b.w;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  });
  if (x1 < 0) return b;
  const out = buf(x1 - x0 + 1, y1 - y0 + 1);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) put(out, x - x0, y - y0, b.c[y * b.w + x]);
  return out;
}

export function toCanvas(b: Buf): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = b.w;
  cv.height = b.h;
  const g = cv.getContext("2d")!;
  const img = g.createImageData(b.w, b.h);
  b.c.forEach((col, i) => {
    if (!col) return;
    const [r, gg, bb] = hexRgb(col);
    img.data.set([r, gg, bb, 255], i * 4);
  });
  g.putImageData(img, 0, 0);
  return cv;
}
