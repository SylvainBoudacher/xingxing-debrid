import { hash } from "../../core/hash";
import { PAL } from "../palette";
import { ell, rampAt, sphere, stem, type DrawFn } from "../raster";

export const bruyere: DrawFn = (b, k, C) => {
  ell(b, k, 16, 42, 12.5, 6, 0, (_nx, ny, _d, edge, px, py) =>
    rampAt(PAL.darkLeaf, 0.4 - ny * 0.35 + (hash(px, py) - 0.5) * 0.5 - (edge ? 0.3 : 0)),
  );
  const tops = [
    [5, 31],
    [9, 27],
    [13, 24],
    [17, 22],
    [21, 25],
    [25, 28],
    [28, 33],
  ];
  for (const [tx, ty] of tops) {
    const x0 = 16 + (tx - 16) * 0.4;
    const y0 = 42;
    stem(b, k, x0, y0, tx, ty, 0.8, PAL.brown);
    for (let s = 0.05; s < 0.95; s += 0.1) {
      const x = x0 + (tx - x0) * s;
      const y = y0 + (ty - y0) * s;
      const side = Math.round(s * 10) % 2 ? 0.9 : -0.9;
      ell(b, k, x + side, y, 1.2, 1.3, 0, sphere(C, 0.05));
    }
  }
};
