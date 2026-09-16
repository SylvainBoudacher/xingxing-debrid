import { hash } from "../../core/hash";
import { PAL } from "../palette";
import { curveAt, ell, sphere, stem, type DrawFn } from "../raster";

const STEMS = [11, 16, 21];
const DOME_Y = 25;

export const sedum: DrawFn = (b, k, C) => {
  for (const x of STEMS) {
    const bend = (x - 16) * 0.15;
    stem(b, k, 16, 47, x, DOME_Y, 1.7, PAL.green, bend);
    for (let s = 0.2; s < 0.8; s += 0.3) {
      const [lx, ly] = curveAt(16, 47, x, DOME_Y, bend, s);
      for (const side of [-1, 1])
        ell(b, k, lx + side * 2, ly, 2.2, 1.4, side * 0.5, sphere(PAL.green, 0.25));
    }
  }
  // dôme bombé de petites étoiles, du bas vers le haut
  for (let row = 4; row >= 0; row--) {
    const half = 11 - (4 - row) * 1.2 - (row === 0 ? 2 : 0);
    for (let dx = -half; dx <= half; dx += 1.6) {
      const jitter = (hash(Math.round(dx * 10), row) - 0.5) * 0.8;
      const y = DOME_Y - 1 - (4 - row) * 1.5 - (1 - (dx / 11) ** 2) * 2 + jitter;
      ell(b, k, 16 + dx, y, 1.2, 1.1, 0, sphere(C, 0.1 - row * 0.08));
    }
  }
};
