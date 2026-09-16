import { PAL } from "../palette";
import { ell, leaf, rampAt, stem, type DrawFn } from "../raster";

const TAU = Math.PI * 2;

export const dahlia: DrawFn = (b, k, C) => {
  stem(b, k, 16, 47, 16, 20, 1.6, PAL.green);
  leaf(b, k, 16, 38, Math.PI * 0.92, 8, 5, PAL.darkLeaf);
  leaf(b, k, 16, 34, -0.2, 8, 5, PAL.darkLeaf);
  leaf(b, k, 16, 27, Math.PI * 1.1, 6, 3.6, PAL.darkLeaf);
  const cx = 16;
  const cy = 15;
  for (let r = 7.4; r > 0.4; r -= 2) {
    const n = Math.max(1, Math.round((TAU * r) / 2.3));
    for (let j = 0; j < n; j++) {
      const a = (j / n) * TAU + r;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r * 0.92;
      const lit = -((x - cx) * 0.6 + (y - cy) * 0.8) / 8;
      ell(b, k, x, y, 1.8, 1.5, a, (_nx, _ny, d, edge) =>
        rampAt(C, 0.45 + 0.4 * lit + (d > 0.4 ? 0.18 : -0.22) - (edge ? 0.3 : 0)),
      );
    }
  }
};
