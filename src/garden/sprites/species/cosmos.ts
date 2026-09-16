import { PAL } from "../palette";
import { ell, petal, sphere, stem, type DrawFn } from "../raster";

const TAU = Math.PI * 2;

export const cosmos: DrawFn = (b, k, C) => {
  stem(b, k, 16, 47, 17, 16, 1.1, PAL.green, -2.5);
  for (let y = 42; y > 22; y -= 5) {
    const dir = y % 10 ? 1 : -1;
    stem(b, k, 16, y, 16 + dir * 7, y - 5, 0.8, PAL.green, dir);
    stem(b, k, 16 + dir * 3, y - 1, 16 + dir * 4, y - 6, 0.7, PAL.green);
  }
  for (let j = 0; j < 8; j++)
    petal(b, k, 17, 13, (j / 8) * TAU + 0.2, 8.2, 4.8, C, { notch: true });
  const heart = sphere(PAL.yellow);
  ell(b, k, 17, 13, 2.4, 2.4, 0, (nx, ny, d, edge, px, py) =>
    (px * 3 + py) % 4 === 0 ? PAL.yellow[0] : heart(nx, ny, d, edge, px, py, nx, ny),
  );
};
