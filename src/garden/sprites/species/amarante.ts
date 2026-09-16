import { hash } from "../../core/hash";
import { PAL } from "../palette";
import { ell, leaf, sphere, stem, type DrawFn } from "../raster";

// [départ x, départ y, écart latéral, longueur] : chapelets en fontaine
const TASSELS: [number, number, number, number][] = [
  [15, 14, -9, 24],
  [17, 14, 9, 22],
  [16, 13, -4, 28],
  [16, 13, 4, 26],
];

export const amarante: DrawFn = (b, k, C) => {
  stem(b, k, 16, 47, 16, 13, 1.8, PAL.green, 1);
  leaf(b, k, 16, 42, Math.PI * 0.88, 11, 6.5, PAL.green);
  leaf(b, k, 16, 37, -0.25, 11, 6.5, PAL.green);
  leaf(b, k, 16, 20, Math.PI * 1.15, 7, 4, PAL.green);
  leaf(b, k, 16, 19, -0.45, 7, 4, PAL.green);
  TASSELS.forEach(([sx, sy, side, len], t) => {
    for (let s = 0; s <= 1; s += 0.05) {
      // monte un peu, s'écarte, puis retombe
      const x = sx + side * Math.sin(Math.min(1, s * 1.6) * Math.PI * 0.5);
      const y = sy - 4 * Math.sin(Math.min(1, s * 2.5) * Math.PI) * (1 - s) + s * len;
      const r = 1.6 * (1 - s * 0.35);
      ell(b, k, x, y, r, r, 0, sphere(C, -0.05 + (hash(t, Math.round(s * 20)) - 0.5) * 0.3));
    }
  });
  ell(b, k, 16, 12, 2.4, 2, 0, sphere(C, 0.15));
};
