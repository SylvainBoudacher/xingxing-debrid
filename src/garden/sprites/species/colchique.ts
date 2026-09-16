import { PAL } from "../palette";
import { petal, stem, type DrawFn } from "../raster";

export const colchique: DrawFn = (b, k, C) => {
  const flowers = [
    [10, 36, -0.25],
    [21, 33, 0.2],
    [15.5, 30, 0],
  ];
  const up = -Math.PI / 2;
  for (const [x, y, lean] of flowers) {
    stem(b, k, x - lean * 4, 47, x, y, 1.3, PAL.cream);
    petal(b, k, x, y, up + lean - 0.32, 9, 4.2, C, { base: PAL.cream, bias: -0.1 });
    petal(b, k, x, y, up + lean + 0.32, 9, 4.2, C, { base: PAL.cream, bias: -0.1 });
    petal(b, k, x, y, up + lean, 10, 4, C, { base: PAL.cream, bias: 0.1 });
  }
};
