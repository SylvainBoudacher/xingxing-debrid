import { PAL } from "../palette";
import { ell, leaf, petal, stem, type DrawFn } from "../raster";

const TAU = Math.PI * 2;

export const tournesol: DrawFn = (b, k, C) => {
  stem(b, k, 16, 47, 16, 13, 2.2, PAL.green, 1.5);
  leaf(b, k, 16, 38, Math.PI * 0.95, 10, 6, PAL.green);
  leaf(b, k, 17, 31, -0.15, 9, 5.5, PAL.green);
  leaf(b, k, 16, 23, Math.PI * 1.08, 7, 4.5, PAL.green);
  for (let j = 0; j < 20; j++) petal(b, k, 16, 12, (j / 20) * TAU + 0.1, 8.5, 3, C);
  ell(b, k, 16, 12, 5.6, 5.6, 0, (nx, ny, d, _edge, px, py) => {
    if (d > 0.78) return PAL.brown[0];
    const lit = -(nx * 0.6 + ny * 0.8);
    return PAL.brown[(lit > 0.3 ? 1 : 0) + ((px + py) % 2)];
  });
};
