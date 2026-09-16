import { PAL } from "./palette";
import { ell, petal, put, rampAt, sphere, stem, type Buf, type DrawFn, type Ramp } from "./raster";

type Pt = [number, number];

function inside(p: Pt[], x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i];
    const [xj, yj] = p[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// Polygone plein en unités ; `shade(u, v, edge)` choisit la couleur.
function poly(b: Buf, k: number, p: Pt[], shade: (u: number, v: number, edge: boolean) => string) {
  const xs = p.map((q) => q[0]);
  const ys = p.map((q) => q[1]);
  const at = (px: number, py: number) => inside(p, (px + 0.5) / k, (py + 0.5) / k);
  for (let py = Math.floor(Math.min(...ys) * k); py <= Math.ceil(Math.max(...ys) * k); py++)
    for (let px = Math.floor(Math.min(...xs) * k); px <= Math.ceil(Math.max(...xs) * k); px++) {
      if (!at(px, py)) continue;
      const edge = !at(px - 1, py) || !at(px + 1, py) || !at(px, py - 1) || !at(px, py + 1);
      put(b, px, py, shade((px + 0.5) / k, (py + 0.5) / k, edge));
    }
}

// Segment épais à bouts ronds, ombré selon le côté éclairé.
function bar(
  b: Buf,
  k: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  w: number,
  ramp: Ramp,
) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const ang = Math.atan2(y1 - y0, x1 - x0);
  ell(b, k, (x0 + x1) / 2, (y0 + y1) / 2, len / 2 + w / 2, w / 2, ang, (_nx, ny, _d, edge) =>
    edge ? ramp[0] : rampAt(ramp, 0.55 - ny * 0.35),
  );
}

const shadeEdge = (ramp: Ramp, t: number, edge: boolean) => (edge ? ramp[0] : rampAt(ramp, t));

export const TOOL_DRAW = {
  main(b, k) {
    // manche vert
    poly(
      b,
      k,
      [
        [10.5, 42],
        [21.5, 42],
        [22, 47.5],
        [10, 47.5],
      ],
      (u, _v, e) => shadeEdge(PAL.green, 0.8 - (u - 10) / 16, e),
    );
    // doigts : capsules à bout rond, séparées par un liseré sombre
    const fingers: [number, number, number][] = [
      [10.6, 19.5, 3.6],
      [14.6, 17.5, 3.7],
      [18.6, 18.5, 3.6],
      [22.2, 22, 3.2],
    ];
    for (const [x, top, w] of fingers) {
      poly(
        b,
        k,
        [
          [x - w / 2, top + w / 2],
          [x + w / 2, top + w / 2],
          [x + w / 2, 30],
          [x - w / 2, 30],
        ],
        (u, _v, e) => (e ? PAL.skin[1] : rampAt(PAL.skin, 0.95 - ((u - x + w / 2) / w) * 0.5)),
      );
      ell(b, k, x, top + w / 2, w / 2, w / 2, 0, (nx, ny, _d, e) =>
        e ? PAL.skin[1] : rampAt(PAL.skin, 0.9 - nx * 0.2 - ny * 0.1),
      );
    }
    // pouce : court et large, sa base passe sous la paume, ongle au bout
    const bx = 11.5;
    const by = 40;
    const ax = -0.72;
    const ay = -0.69;
    const thumb = (d: number, t: number): Pt => [bx + ax * d - ay * t, by + ay * d + ax * t];
    poly(
      b,
      k,
      [
        thumb(0, -3.6),
        thumb(8, -2.7),
        thumb(11, -1.4),
        thumb(11.6, 0.4),
        thumb(10.4, 2.2),
        thumb(3, 3.4),
        thumb(0, 3.4),
      ],
      (u, v, e) => {
        if (e) return PAL.skin[1];
        const t = -ay * (u - bx) + ax * (v - by);
        return rampAt(PAL.skin, t < 0 ? 0.9 : 0.7);
      },
    );
    const [nx0, ny0] = thumb(9.8, -0.5);
    ell(b, k, nx0, ny0, 1.4, 1.1, Math.atan2(ay, ax), (_x, _y, _d, e) =>
      e ? PAL.skin[2] : PAL.skin[3],
    );
    // paume
    poly(
      b,
      k,
      [
        [8.8, 28],
        [24, 28],
        [23.6, 37],
        [21.8, 42.5],
        [11, 42.5],
        [9, 37.5],
      ],
      (u, v, e) => (e ? PAL.skin[1] : rampAt(PAL.skin, 0.95 - (u - 9) / 40 - (v - 28) / 45)),
    );
    for (let x = 12; x < 21; x++)
      put(b, Math.round(x * k), Math.round((32.5 + (x - 12) * 0.2) * k), PAL.skin[1]);
  },
  transplantoir(b, k) {
    // manche bois en bas à gauche, virole, lame en pointe vers le haut à droite
    bar(b, k, 4.5, 45.5, 12.5, 37.5, 3.6, PAL.wood);
    bar(b, k, 12.5, 37.5, 14.5, 35.5, 4.2, PAL.metal);
    const ox = 14.5;
    const oy = 35.5;
    const ax = Math.SQRT1_2;
    const ay = -Math.SQRT1_2;
    const local: Pt[] = [
      [0, -2.6],
      [3, -5.8],
      [10, -6],
      [15.5, -2.5],
      [17, 0],
      [15.5, 2.5],
      [10, 6],
      [3, 5.8],
      [0, 2.6],
    ];
    const pts = local.map(([s, t]): Pt => [ox + ax * s - ay * t, oy + ay * s + ax * t]);
    poly(b, k, pts, (u, v, e) => {
      const du = u - ox;
      const dv = v - oy;
      const t = -ay * du + ax * dv;
      if (e) return PAL.metal[0];
      if (Math.abs(t) < 0.55) return PAL.metal[1];
      return rampAt(PAL.metal, t < 0 ? 0.95 : 0.55);
    });
  },
  arrosoir(b, k) {
    // anse en arc au-dessus, de l'arrière vers le milieu
    for (let a = 0; a <= Math.PI; a += 0.06)
      ell(b, k, 13 - Math.cos(a) * 6.5, 33 - Math.sin(a) * 5.5, 1.1, 1.1, 0, (_nx, ny) =>
        ny < 0 ? PAL.can[2] : PAL.can[1],
      );
    // bec conique depuis le bas du corps, pomme d'arrosoir plate au bout
    const sx = 21;
    const sy = 44;
    const ex = 29.5;
    const ey = 31;
    const len = Math.hypot(ex - sx, ey - sy);
    const dx = (ex - sx) / len;
    const dy = (ey - sy) / len;
    const n: Pt = [-dy, dx];
    poly(
      b,
      k,
      [
        [sx + n[0] * 1.9, sy + n[1] * 1.9],
        [ex + n[0] * 1, ey + n[1] * 1],
        [ex - n[0] * 1, ey - n[1] * 1],
        [sx - n[0] * 1.9, sy - n[1] * 1.9],
      ],
      (u, v, e) => {
        if (e) return PAL.can[0];
        const side = (u - sx) * n[0] + (v - sy) * n[1];
        return side < 0 ? PAL.can[2] : PAL.can[1];
      },
    );
    const rot = Math.atan2(dy, dx) + Math.PI / 2;
    const rx = ex + dx * 1.2;
    const ry = ey + dy * 1.2;
    ell(b, k, rx, ry, 3.4, 1.5, rot, (_nx, ny, _d, e) =>
      e ? PAL.metal[0] : ny < 0 ? PAL.metal[3] : PAL.metal[2],
    );
    // corps plus large que haut, épaules arrondies
    poly(
      b,
      k,
      [
        [4.5, 35],
        [6, 33.2],
        [20, 33.2],
        [21.5, 35],
        [22.5, 46.5],
        [3.5, 46.5],
      ],
      (u, v, e) => {
        if (e) return PAL.can[0];
        if (v < 35) return PAL.can[3];
        if (v > 39.2 && v < 40.4) return PAL.can[1];
        return rampAt(PAL.can, 0.95 - (u - 3.5) / 19);
      },
    );
  },
  secateur(b, k) {
    const px = 16;
    const py = 31;
    // poignées droites et symétriques, ressort en zigzag entre les deux
    const grip: Ramp = [PAL.red[1], PAL.red[2], PAL.red[2], PAL.red[3]];
    bar(b, k, 15, 32.5, 7.5, 46, 3.2, grip);
    bar(b, k, 17, 32.5, 24.5, 46, 3.2, grip);
    const zig: Pt[] = [
      [11.4, 42.6],
      [12.9, 40.9],
      [14.4, 42.6],
      [15.9, 40.9],
      [17.4, 42.6],
      [18.9, 40.9],
      [20.6, 42.6],
    ];
    for (let i = 0; i + 1 < zig.length; i++)
      bar(b, k, zig[i][0], zig[i][1], zig[i + 1][0], zig[i + 1][1], 0.8, [
        PAL.metal[1],
        PAL.metal[3],
        PAL.metal[3],
        PAL.metal[3],
      ]);
    // lames identiques ouvertes en V
    const open = 0.5;
    petal(b, k, px, py, -Math.PI / 2 - open, 13, 3.6, PAL.metal, { bias: 0.25 });
    petal(b, k, px, py, -Math.PI / 2 + open, 13, 3.6, PAL.metal, { bias: 0.05 });
    ell(b, k, px, py, 1.7, 1.7, 0, sphere(PAL.yellow, 0.1));
  },
  rateau(b, k) {
    stem(b, k, 8, 47, 21, 33, 1.4, PAL.wood);
    stem(b, k, 17, 28, 27, 38, 1.6, PAL.metal);
    for (let i = 0; i < 4; i++)
      stem(b, k, 18 + i * 3, 29 + i * 3, 21 + i * 3, 26 + i * 3, 0.8, PAL.metal);
  },
} satisfies Record<string, DrawFn>;
