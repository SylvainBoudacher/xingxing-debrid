import { hash } from "../core/hash";
import { PAL } from "./palette";
import { ell, leaf, put, rampAt, sphere, stem, type Buf, type DrawFn } from "./raster";

const TAU = Math.PI * 2;
const AUTUMN = [PAL.orange, PAL.yellow, PAL.bronze, PAL.red];

export const DECOR_DRAW = {
  trou(b, k) {
    ell(b, k, 21.5, 44.8, 3.4, 1.8, 0, sphere(PAL.soil, 0.35));
    ell(b, k, 14.5, 45.2, 5.2, 2.2, 0, (_nx, ny) =>
      ny < -0.2 ? PAL.soil[2] : ny < 0.3 ? PAL.soil[0] : "#140c08",
    );
  },
  tas(b, k) {
    for (let i = 0; i < 46; i++) {
      const a = hash(i, 31) * Math.PI;
      const r = Math.sqrt(hash(i, 32));
      const x = 16 + Math.cos(a) * r * 11;
      const y = 46 - Math.sin(a) * r * 6;
      ell(b, k, x, y, 2.2, 1.2, hash(i, 33) * 3, sphere(AUTUMN[i % 4], (y - 44) * -0.04));
    }
  },
  citrouille(b, k) {
    stem(b, k, 16, 34, 17.5, 30, 1.8, PAL.brown, 0.8);
    [
      [7, 4.5],
      [25, 4.5],
      [11, 5.5],
      [21, 5.5],
      [16, 6],
    ].forEach(([x, rx]) =>
      ell(b, k, x, 40, rx, 6.8, 0, (nx, _ny, _d, edge, _px, _py, ux, uy) => {
        const gx = (x + ux - 16) / 11;
        const gy = uy / 7;
        const lit = -(gx * 0.6 + gy * 0.8);
        return rampAt(PAL.orange, 0.5 + 0.35 * lit - Math.abs(nx) * 0.25 - (edge ? 0.3 : 0));
      }),
    );
    leaf(b, k, 17, 33, -0.3, 6, 3.4, PAL.green);
  },
  paille(b, k) {
    for (let py = Math.floor(31 * k); py < Math.floor(47 * k); py++)
      for (let px = Math.floor(3 * k); px < Math.floor(29 * k); px++) {
        const u = px / k;
        const v = py / k;
        const top = v < 35;
        // ficelles
        if (Math.abs(u - 10) < 0.8 || Math.abs(u - 22) < 0.8) {
          put(b, px, py, top ? PAL.wood[2] : PAL.wood[1]);
          continue;
        }
        const t =
          (top ? 0.75 : 0.45) + (hash(Math.floor(px / 3), py) - 0.5) * 0.45 - (v > 44 ? 0.25 : 0);
        put(b, px, py, rampAt(PAL.hay, t));
      }
  },
  lanterne(b, k) {
    stem(b, k, 11, 47, 11, 22, 2, PAL.wood);
    stem(b, k, 11, 23, 23, 23, 1.2, PAL.wood);
    stem(b, k, 21, 23, 21, 25, 0.6, PAL.metal);
    ell(b, k, 21, 26.5, 3, 1.5, 0, sphere(PAL.metal, 0.1));
    for (let py = Math.floor(27.5 * k); py < Math.floor(34 * k); py++)
      for (let px = Math.floor(18.5 * k); px < Math.floor(23.5 * k); px++) {
        const u = px / k;
        const frame = u < 19.3 || u > 22.7;
        put(
          b,
          px,
          py,
          frame
            ? PAL.metal[1]
            : rampAt(PAL.glow, 0.95 - Math.abs(u - 21) * 0.25 - (py / k - 30) * 0.06),
        );
      }
    ell(b, k, 21, 34.5, 2.8, 1, 0, sphere(PAL.metal));
  },
  // se répète bord à bord : les traverses dépassent de la tuile
  cloture(b, k) {
    stem(b, k, -1, 33, 33, 33, 2, PAL.wood);
    stem(b, k, -1, 40, 33, 40, 2, PAL.wood);
    stem(b, k, 5, 47, 5, 29, 2.6, PAL.wood);
    stem(b, k, 27, 47, 27, 29, 2.6, PAL.wood);
    ell(b, k, 5.3, 29, 1.3, 1, 0, () => PAL.wood[3]);
    ell(b, k, 27.3, 29, 1.3, 1, 0, () => PAL.wood[3]);
  },
} satisfies Record<string, DrawFn>;

// Arbre d'automne, dessiné dans un espace 96x144 (trois tuiles de large).
export function drawTree(b: Buf, k: number): void {
  stem(b, k, 48, 143, 47, 70, 7, PAL.wood, -2);
  stem(b, k, 47, 100, 30, 72, 3, PAL.wood, 3);
  stem(b, k, 48, 92, 66, 66, 3, PAL.wood, -3);
  ell(b, k, 48, 141, 14, 3, 0, sphere(PAL.grass, -0.2));
  for (let i = 0; i < 46; i++) {
    const a = hash(i, 1) * TAU;
    const rr = Math.sqrt(hash(i, 2));
    const x = 48 + Math.cos(a) * rr * 34;
    const y = 54 + Math.sin(a) * rr * 34;
    const ramp = AUTUMN[Math.floor(hash(i, 3) * 3.4)];
    ell(
      b,
      k,
      x,
      y,
      9 + hash(i, 4) * 5,
      8 + hash(i, 5) * 4,
      0,
      (_nx, _ny, _d, edge, px, py, ux, uy) => {
        const gx = (x + ux - 48) / 42;
        const gy = (y + uy - 50) / 42;
        const lit = -(gx * 0.7 + gy * 0.7);
        return rampAt(
          ramp,
          0.45 + 0.5 * lit + (hash(px >> 1, py >> 1, 7) - 0.5) * 0.35 - (edge ? 0.25 : 0),
        );
      },
    );
  }
}
