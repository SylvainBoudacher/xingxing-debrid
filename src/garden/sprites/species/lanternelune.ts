import { PAL } from "../palette";
import { ell, leaf, put, sphere, stem, type DrawFn } from "../raster";

// Clochettes [x, y, rayon] en unités 32x48 ; le rendu y pose ses lumières.
export const LANTERN_BELLS: readonly [number, number, number][] = [
  [23, 16, 4],
  [17.5, 24, 3.3],
  [26, 28, 2.9],
];

// Hauteur du point d'attache de chaque clochette sur la tige arquée.
const ANCHORS = [8.5, 16.5, 7.5];

export const lanternelune: DrawFn = (b, k, C) => {
  stem(b, k, 12, 47, 12, 8, 1.4, PAL.darkLeaf, 2.5);
  stem(b, k, 12, 9, 26, 7, 1.1, PAL.darkLeaf, -3);
  stem(b, k, 12, 17, 18, 16, 0.8, PAL.darkLeaf, -1);
  leaf(b, k, 12, 40, Math.PI * 0.92, 8, 3.5, PAL.darkLeaf);
  leaf(b, k, 13, 32, -0.25, 7, 3, PAL.darkLeaf);
  LANTERN_BELLS.forEach(([x, y, r], i) => {
    stem(b, k, x, ANCHORS[i], x, y - r, 0.5, PAL.darkLeaf);
    ell(b, k, x, y, r, r * 1.2, 0, sphere(C, 0.25));
    ell(b, k, x, y + r * 0.9, r * 0.9, r * 0.35, 0, () => C[1]);
    put(b, Math.round(x * k), Math.round((y + r * 1.1) * k), PAL.glow[3]);
  });
};
