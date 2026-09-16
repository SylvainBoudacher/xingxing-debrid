import { hash } from "../core/hash";
import type { ColorId, SpeciesId } from "../core/types";
import { PAL, type PaletteKey } from "./palette";
import { ell, leaf, petal, put, rampAt, sphere, stem, type DrawFn } from "./raster";

const TAU = Math.PI * 2;

export const SPECIES_COLOR: Record<ColorId, PaletteKey> = {
  yellow: "yellow",
  pink: "pink",
  white: "white",
  violet: "violet",
  red: "red",
  orange: "orange",
  bronze: "bronze",
  heather: "heather",
  lilac: "lilac",
};

// Chaque espèce a sa silhouette ; `C` est la gamme de sa couleur.
export const SPECIES_DRAW: Record<SpeciesId, DrawFn> = {
  tournesol(b, k, C) {
    stem(b, k, 16, 47, 16, 13, 2.2, PAL.green, 1.5);
    leaf(b, k, 16, 38, Math.PI * 0.95, 10, 6, PAL.green);
    leaf(b, k, 17, 31, -0.15, 9, 5.5, PAL.green);
    leaf(b, k, 16, 23, Math.PI * 1.08, 7, 4.5, PAL.green);
    for (let j = 0; j < 20; j++) petal(b, k, 16, 12, (j / 20) * TAU + 0.1, 8.5, 3, C);
    ell(b, k, 16, 12, 5.6, 5.6, 0, (nx, ny, d, _edge, px, py) => {
      if (d > 0.78) return PAL.brown[0];
      const lit = -(nx * 0.6 + ny * 0.8);
      return PAL.brown[(lit > 0.3 ? 1 : 0) + ((px + py) % 2)];
    });
  },
  dahlia(b, k, C) {
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
  },
  cosmos(b, k, C) {
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
  },
  aster(b, k, C) {
    const heads = [
      [9, 25],
      [23, 21],
      [15, 13],
    ];
    for (const [x, y] of heads) stem(b, k, 16, 47, x, y, 1, PAL.green, (x - 16) * 0.2);
    [
      [16, 40, 3.6],
      [16, 34, -0.5],
      [13, 30, 3.8],
      [20, 28, -0.7],
    ].forEach(([x, y, a]) => leaf(b, k, x, y, a, 6, 2, PAL.green));
    for (const [x, y] of heads) {
      for (let j = 0; j < 22; j++) petal(b, k, x, y, (j / 22) * TAU, 5.2, 1.4, C);
      ell(b, k, x, y, 1.9, 1.9, 0, sphere(PAL.yellow, 0.1));
    }
  },
  bruyere(b, k, C) {
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
  },
  colchique(b, k, C) {
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
  },
  chrysantheme(b, k, C) {
    [
      [16, 45, -2.5],
      [16, 45, -0.6],
      [15, 44, -1.6],
      [17, 44, 3.6],
      [16, 44, -2.1],
    ].forEach(([x, y, a]) => leaf(b, k, x, y, a, 9, 5, PAL.darkLeaf));
    const heads = [
      [9, 31, 4.6],
      [23, 30, 4.6],
      [16, 23, 5.4],
    ];
    for (const [x, y] of heads) stem(b, k, 16, 42, x, y, 1.1, PAL.green);
    for (const [x, y, r] of heads) {
      for (let j = 0; j < 16; j++) petal(b, k, x, y, (j / 16) * TAU, r, 1.9, C, { bias: -0.15 });
      for (let j = 0; j < 9; j++)
        petal(b, k, x, y + 0.5, Math.PI + (j / 8) * Math.PI, r * 0.7, 1.8, C, { bias: 0.05 });
      ell(b, k, x, y - 0.5, r * 0.42, r * 0.36, 0, sphere(C, 0.2));
    }
  },
  rosetremiere(b, k, C) {
    ell(b, k, 9, 42, 5.5, 4.2, 0.3, sphere(PAL.green, -0.05));
    ell(b, k, 23, 41, 5.2, 4, -0.3, sphere(PAL.green));
    stem(b, k, 16, 47, 16, 2, 1.6, PAL.green, 0.8);
    ell(b, k, 16, 3, 1.6, 1.8, 0, sphere(PAL.green, 0.1));
    ell(b, k, 15.6, 6.5, 2, 2.2, 0, sphere(C, -0.1));
    [
      [16, 11, 3.6],
      [15, 19, 4],
      [17.2, 27, 4.3],
      [15.8, 35, 4.3],
    ].forEach(([x, y, r]) => {
      for (let j = 0; j < 5; j++)
        petal(b, k, x, y, (j / 5) * TAU - 1.2, r, r * 0.95, C, { bias: 0.1 });
      ell(b, k, x, y, r * 0.3, r * 0.3, 0, () => C[0]);
      put(b, Math.round(x * k), Math.round(y * k), PAL.yellow[2]);
    });
  },
};
