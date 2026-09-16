import { PAL } from "../palette";
import { ell, leaf, petal, sphere, stem, type DrawFn } from "../raster";

const TAU = Math.PI * 2;

export const chrysantheme: DrawFn = (b, k, C) => {
  [
    [16, 45, -2.5],
    [16, 45, -0.6],
    [15, 44, -1.6],
    [17, 44, 3.6],
    [16, 44, -2.1],
  ].forEach(([x, y, a]) => leaf(b, k, x, y, a, 9, 5, PAL.darkLeaf));
  const heads = [
    [9, 31, 4.6],
    [23, 30, 4.6],
    [16, 23, 5.4],
  ];
  for (const [x, y] of heads) stem(b, k, 16, 42, x, y, 1.1, PAL.green);
  for (const [x, y, r] of heads) {
    for (let j = 0; j < 16; j++) petal(b, k, x, y, (j / 16) * TAU, r, 1.9, C, { bias: -0.15 });
    for (let j = 0; j < 9; j++)
      petal(b, k, x, y + 0.5, Math.PI + (j / 8) * Math.PI, r * 0.7, 1.8, C, { bias: 0.05 });
    ell(b, k, x, y - 0.5, r * 0.42, r * 0.36, 0, sphere(C, 0.2));
  }
};
