import { hash } from "../../core/hash";
import { PAL } from "../palette";
import { curveAt, ell, leaf, sphere, stem, type DrawFn } from "../raster";

// [bout x, bout y, courbure]
const BRANCHES: [number, number, number][] = [
  [4, 15, -3],
  [28, 14, 3],
  [9, 7, -2],
  [23, 6, 2],
  [16, 2, 0.5],
];

export const vergedor: DrawFn = (b, k, C) => {
  stem(b, k, 16, 47, 16, 20, 1.2, PAL.green, 0.5);
  for (let y = 43; y > 21; y -= 4.5)
    leaf(b, k, 16, y, Math.round(y) % 2 ? -0.35 : Math.PI + 0.35, 7, 2, PAL.green);
  BRANCHES.forEach(([ex, ey, bend], i) => {
    stem(b, k, 16, 21, ex, ey, 0.7, PAL.green, bend);
    for (let s = 0.3; s <= 1; s += 0.07) {
      const [x, y] = curveAt(16, 21, ex, ey, bend, s);
      const jx = (hash(i, Math.round(s * 100)) - 0.5) * 1.4;
      ell(b, k, x + jx, y - 1.1, 1.1, 1.1, 0, sphere(C, 0.1));
      ell(b, k, x - jx, y - 0.2, 0.9, 0.9, 0, sphere(C, -0.1));
    }
  });
};
