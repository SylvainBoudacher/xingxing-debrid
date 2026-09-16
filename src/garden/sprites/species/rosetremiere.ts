import { PAL } from "../palette";
import { ell, petal, put, sphere, stem, type DrawFn } from "../raster";

const TAU = Math.PI * 2;

export const rosetremiere: DrawFn = (b, k, C) => {
  ell(b, k, 9, 42, 5.5, 4.2, 0.3, sphere(PAL.green, -0.05));
  ell(b, k, 23, 41, 5.2, 4, -0.3, sphere(PAL.green));
  stem(b, k, 16, 47, 16, 2, 1.6, PAL.green, 0.8);
  ell(b, k, 16, 3, 1.6, 1.8, 0, sphere(PAL.green, 0.1));
  ell(b, k, 15.6, 6.5, 2, 2.2, 0, sphere(C, -0.1));
  [
    [16, 11, 3.6],
    [15, 19, 4],
    [17.2, 27, 4.3],
    [15.8, 35, 4.3],
  ].forEach(([x, y, r]) => {
    for (let j = 0; j < 5; j++)
      petal(b, k, x, y, (j / 5) * TAU - 1.2, r, r * 0.95, C, { bias: 0.1 });
    ell(b, k, x, y, r * 0.3, r * 0.3, 0, () => C[0]);
    put(b, Math.round(x * k), Math.round(y * k), PAL.yellow[2]);
  });
};
