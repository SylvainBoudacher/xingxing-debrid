import { PAL } from "./palette";
import { ell, put, rampAt, sphere, stem, type DrawFn } from "./raster";

// `C` teinte le contenu : liquide de la fiole, poudre du pot.
export const ATELIER_DRAW = {
  fiole(b, k, C) {
    // panse en verre : liquide en bas, reflet clair en haut
    ell(b, k, 16, 39, 7.5, 7.5, 0, (nx, ny, _d, edge) => {
      if (edge) return PAL.white[1];
      if (ny < -0.15) return nx < -0.3 && ny < -0.4 ? PAL.white[3] : PAL.white[2];
      return rampAt(C, 0.75 - ny * 0.45 - nx * 0.2);
    });
    stem(b, k, 16, 32, 16, 25, 3.2, PAL.white);
    ell(b, k, 16, 24, 2.6, 1.8, 0, sphere(PAL.wood, 0.2));
    put(b, Math.round(12.5 * k), Math.round(36 * k), PAL.white[3]);
  },
  poudre(b, k, C) {
    ell(b, k, 16, 37.5, 6.5, 3.5, 0, sphere(C, 0.35));
    ell(b, k, 16, 42, 8.5, 5, 0, sphere(PAL.wood));
    ell(b, k, 16, 38.5, 8.5, 1.4, 0, () => PAL.wood[3]);
    for (const [x, y] of [
      [11, 31],
      [20, 29],
      [16, 27],
    ])
      put(b, Math.round(x * k), Math.round(y * k), C[3]);
  },
  chaudron(b, k) {
    stem(b, k, 8, 47, 10, 40, 1.6, PAL.metal);
    stem(b, k, 24, 47, 22, 40, 1.6, PAL.metal);
    ell(b, k, 16, 38, 12, 8.5, 0, sphere(PAL.metal, -0.1));
    ell(b, k, 16, 30.5, 12.5, 2.6, 0, () => PAL.metal[3]);
    ell(b, k, 16, 30.8, 10.5, 1.8, 0, sphere(PAL.green, 0.4));
  },
} satisfies Record<string, DrawFn>;
