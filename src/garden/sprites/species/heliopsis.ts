import { PAL } from "../palette";
import { ell, leaf, petal, sphere, stem, type DrawFn } from "../raster";

const TAU = Math.PI * 2;
const HEADS: [number, number, number][] = [
  [9, 21, 5],
  [23, 18, 5],
  [16, 11, 5.8],
];

export const heliopsis: DrawFn = (b, k, C) => {
  stem(b, k, 16, 47, 16, 11, 1.4, PAL.green, 0.6);
  stem(b, k, 16, 33, 9, 21, 1, PAL.green, -1);
  stem(b, k, 16, 30, 23, 18, 1, PAL.green, 1);
  for (const y of [41, 35]) {
    leaf(b, k, 16, y, Math.PI * 0.95, 8, 4.5, PAL.green);
    leaf(b, k, 16, y, -0.1, 8, 4.5, PAL.green);
  }
  for (const [x, y, r] of HEADS) {
    for (let j = 0; j < 14; j++) petal(b, k, x, y, (j / 14) * TAU, r, 2.4, C, { bias: 0.05 });
    ell(b, k, x, y, r * 0.38, r * 0.38, 0, sphere(PAL.bronze, -0.25));
  }
};
