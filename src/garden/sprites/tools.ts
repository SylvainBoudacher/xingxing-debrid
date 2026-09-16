import { PAL } from "./palette";
import { ell, petal, sphere, stem, type DrawFn } from "./raster";

export const TOOL_DRAW = {
  main(b, k) {
    ell(b, k, 16, 40, 6, 6.5, 0, sphere(PAL.hay, 0.2));
    (
      [
        [11, -2.2],
        [14, -1.8],
        [17.5, -1.7],
        [21, -2],
      ] as const
    ).forEach(([x, a], i) =>
      petal(b, k, x, 36, a, 7 - Math.abs(i - 1.5), 2.8, PAL.hay, { bias: 0.25 }),
    );
    petal(b, k, 11, 41, -2.7, 6, 2.8, PAL.hay, { bias: 0.2 });
  },
  transplantoir(b, k) {
    stem(b, k, 16, 30, 16, 38, 2.6, PAL.wood);
    petal(b, k, 16, 38, Math.PI / 2, 10, 5, PAL.metal, { bias: 0.2 });
  },
  arrosoir(b, k) {
    ell(b, k, 15, 41, 7, 5.5, 0, sphere(PAL.metal, 0.25));
    stem(b, k, 21, 40, 29, 33, 1.4, PAL.metal);
    ell(b, k, 29.5, 32.5, 1.6, 1.2, -0.6, sphere(PAL.metal, 0.3));
    stem(b, k, 9, 37, 11, 33, 1, PAL.metal, -3);
    stem(b, k, 11, 33, 20, 36, 1, PAL.metal, -2);
  },
  secateur(b, k) {
    stem(b, k, 11, 46, 17, 36, 2.2, PAL.red);
    stem(b, k, 21, 46, 16, 36, 2.2, PAL.red);
    petal(b, k, 16.5, 36, -Math.PI / 2 - 0.25, 8, 2.4, PAL.metal, { bias: 0.25 });
    petal(b, k, 16.5, 36, -Math.PI / 2 + 0.25, 8, 2.4, PAL.metal, { bias: 0.1 });
    ell(b, k, 16.5, 36, 1.2, 1.2, 0, () => PAL.yellow[2]);
  },
  rateau(b, k) {
    stem(b, k, 8, 47, 21, 33, 1.4, PAL.wood);
    stem(b, k, 17, 28, 27, 38, 1.6, PAL.metal);
    for (let i = 0; i < 4; i++)
      stem(b, k, 18 + i * 3, 29 + i * 3, 21 + i * 3, 26 + i * 3, 0.8, PAL.metal);
  },
} satisfies Record<string, DrawFn>;
