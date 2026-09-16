import { PAL } from "../palette";
import { ell, leaf, petal, sphere, stem, type DrawFn } from "../raster";

const TAU = Math.PI * 2;
const HEADS: [number, number][] = [
  [6, 21],
  [26, 17],
  [16, 8],
];

export const anemone: DrawFn = (b, k, C) => {
  [
    [16, 46, 3.4],
    [16, 46, -0.3],
    [15, 45, 4.2],
    [17, 45, 5.3],
  ].forEach(([x, y, a]) => leaf(b, k, x, y, a, 8, 5, PAL.darkLeaf));
  for (const [x, y] of HEADS) stem(b, k, 16, 43, x, y, 0.8, PAL.green, (x - 16) * 0.35);
  for (const [x, y] of HEADS) {
    for (let j = 0; j < 6; j++) petal(b, k, x, y, (j / 6) * TAU + 0.3, 5.6, 4.2, C, { bias: 0.05 });
    ell(b, k, x, y, 2.1, 2.1, 0, sphere(PAL.yellow, 0.1));
    ell(b, k, x, y, 1.2, 1.2, 0, sphere(PAL.green, 0.15));
  }
};
