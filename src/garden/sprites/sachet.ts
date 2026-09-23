import type { SachetType } from "../core/types";
import { PAL } from "./palette";
import {
  buf,
  crop,
  ell,
  outline,
  put,
  rampAt,
  sphere,
  toCanvas,
  type Buf,
  type Ramp,
} from "./raster";

// Géométrie en unités 32x48 comme les autres sprites, rendue à l'échelle 1,5.
const K = 1.5;
const X0 = 5;
const X1 = 27;
const Y0 = 6;
const Y1 = 46;
// bas de la bande à déchirer
const BAND = 12;

const px = (u: number) => Math.round(u * K);

// L'image est recadrée sur le sachet, contour d'un pixel compris.
export const SACHET_W = px(X1) - px(X0) + 2;
export const SACHET_H = px(Y1) - px(Y0) + 2;
export const TEAR_ROW = px(BAND) - px(Y0) + 1;

const PAPER: Record<SachetType, Ramp> = {
  quotidien: PAL.hay,
  dore: PAL.glow,
  famille: PAL.apricot,
};

function paper(b: Buf, ramp: Ramp) {
  const [x0, x1, y0, y1] = [px(X0), px(X1), px(Y0), px(Y1)];
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      // bord du haut dentelé
      if (y === y0 && x % 3 === 0) continue;
      const edge = x === x0 || x === x1 - 1 || y === y1 - 1;
      put(b, x, y, rampAt(ramp, 0.9 - ((x - x0) / (x1 - x0)) * 0.5 - (edge ? 0.35 : 0)));
    }
  for (let x = x0 + 1; x < x1 - 1; x++) put(b, x, px(Y0 + 2.5), ramp[1]);
  for (let x = x0 + 1; x < x1 - 1; x += 2) put(b, x, px(BAND), ramp[0]);
}

function label(b: Buf) {
  for (let y = px(19); y < px(36); y++)
    for (let x = px(9); x < px(23); x++) put(b, x, y, PAL.cream[2]);
}

function flower(b: Buf, cx: number, cy: number, r: number) {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ell(b, K, cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.7, r * 0.7, 0, sphere(PAL.pink));
  }
  ell(b, K, cx, cy, r * 0.6, r * 0.6, 0, sphere(PAL.yellow));
}

const DECOR: Record<SachetType, (b: Buf) => void> = {
  quotidien(b) {
    label(b);
    ell(b, K, 16, 27.5, 3, 4.2, 0.4, sphere(PAL.brown));
  },
  dore(b) {
    label(b);
    const [cx, cy] = [px(16), px(27.5)];
    for (let d = -5; d <= 5; d++) {
      put(b, cx + d, cy, PAL.yellow[1]);
      put(b, cx, cy + d, PAL.yellow[1]);
    }
    for (let d = -3; d <= 3; d++) {
      put(b, cx + d, cy + d, PAL.yellow[2]);
      put(b, cx + d, cy - d, PAL.yellow[2]);
    }
    // reflets obliques entre la bande et l'étiquette
    for (const x0 of [px(17), px(21)])
      for (let i = 0; i < 6; i++) put(b, x0 + i, px(18) - i, PAL.glow[3]);
  },
  famille(b) {
    const spots: [number, number][] = [
      [10, 18],
      [22, 22],
      [15, 29],
      [11, 36],
      [21, 38],
      [16, 42],
    ];
    for (const [x, y] of spots) flower(b, x, y, 1.6);
  },
};

export function sachetBuf(type: SachetType): Buf {
  const b = buf(48, 72);
  paper(b, PAPER[type]);
  DECOR[type](b);
  outline(b);
  return crop(b);
}

const urls = new Map<SachetType, string>();

export function sachetDataUrl(type: SachetType): string {
  let url = urls.get(type);
  if (!url) {
    url = toCanvas(sachetBuf(type)).toDataURL();
    urls.set(type, url);
  }
  return url;
}
