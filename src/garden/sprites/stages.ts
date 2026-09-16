import { PAL } from "./palette";
import { ell, leaf, put, sphere, stem, type DrawFn } from "./raster";

export const STAGE_DRAW = {
  // monticule de terre et étiquette plantée ; `C` colore l'étiquette
  graine(b, k, C) {
    ell(b, k, 16, 46.5, 5, 1.6, 0, sphere(PAL.soil, 0.2));
    stem(b, k, 21, 47, 21, 37, 1, PAL.wood);
    for (let y = 34; y < 39; y++)
      for (let x = 18; x < 25; x++)
        for (let py = Math.floor(y * k); py < Math.floor((y + 1) * k); py++)
          for (let px = Math.floor(x * k); px < Math.floor((x + 1) * k); px++)
            put(b, px, py, y === 34 ? C[3] : x === 18 ? C[1] : C[2]);
  },
  pousse(b, k) {
    stem(b, k, 16, 47, 16, 42, 1.1, PAL.green);
    leaf(b, k, 16, 42, -Math.PI * 0.85, 5.5, 3.2, PAL.green);
    leaf(b, k, 16, 42, -Math.PI * 0.15, 5.5, 3.2, PAL.green);
  },
  jeune(b, k) {
    stem(b, k, 16, 47, 16, 32, 1.3, PAL.green, 0.8);
    leaf(b, k, 16, 43, Math.PI * 0.9, 7, 4, PAL.green);
    leaf(b, k, 16, 40, -0.15, 7, 4, PAL.green);
    leaf(b, k, 16, 36, Math.PI * 1.15, 5.5, 3.2, PAL.green);
    leaf(b, k, 16, 33, -0.5, 5, 3, PAL.green);
  },
  // `C` teinte le haut du bouton
  bouton(b, k, C) {
    stem(b, k, 16, 47, 16, 21, 1.4, PAL.green, 1);
    leaf(b, k, 16, 40, Math.PI * 0.9, 8, 4.5, PAL.green);
    leaf(b, k, 16, 34, -0.2, 7, 4, PAL.green);
    leaf(b, k, 16, 28, Math.PI * 1.1, 5.5, 3.2, PAL.green);
    const top = sphere(C, 0.05);
    const body = sphere(PAL.green);
    ell(b, k, 16, 19, 2.8, 3.8, 0, (nx, ny, d, edge, px, py, ux, uy) =>
      (ny < -0.25 ? top : body)(nx, ny, d, edge, px, py, ux, uy),
    );
    leaf(b, k, 16, 21, -Math.PI * 0.62, 3.5, 1.4, PAL.green);
    leaf(b, k, 16, 21, -Math.PI * 0.38, 3.5, 1.4, PAL.green);
  },
} satisfies Record<string, DrawFn>;
