import { PAL } from "../palette";
import { ell, leaf, petal, sphere, stem, type DrawFn } from "../raster";

const TAU = Math.PI * 2;

export const aster: DrawFn = (b, k, C) => {
  const heads = [
    [9, 25],
    [23, 21],
    [15, 13],
  ];
  for (const [x, y] of heads) stem(b, k, 16, 47, x, y, 1, PAL.green, (x - 16) * 0.2);
  [
    [16, 40, 3.6],
    [16, 34, -0.5],
    [13, 30, 3.8],
    [20, 28, -0.7],
  ].forEach(([x, y, a]) => leaf(b, k, x, y, a, 6, 2, PAL.green));
  for (const [x, y] of heads) {
    for (let j = 0; j < 22; j++) petal(b, k, x, y, (j / 22) * TAU, 5.2, 1.4, C);
    ell(b, k, x, y, 1.9, 1.9, 0, sphere(PAL.yellow, 0.1));
  }
};
