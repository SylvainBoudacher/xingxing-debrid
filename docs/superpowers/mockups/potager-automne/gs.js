(() => {
  var __defProp = Object.defineProperty;
  var __returnValue = (v) => v;
  function __exportSetter(name, newValue) {
    this[name] = __returnValue.bind(null, newValue);
  }
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, {
        get: all[name],
        enumerable: true,
        configurable: true,
        set: __exportSetter.bind(all, name)
      });
  };

  // src/garden/core/hash.ts
  function hash(a, b = 0, c = 0) {
    let h = a * 374761393 + b * 668265263 + c * 1442695041 | 0;
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }

  // src/garden/sprites/palette.ts
  var PAL = {
    crow: ["#0e0c16", "#1f1c2c", "#343048", "#5a5474"],
    green: ["#243d26", "#3e6b2f", "#5f9a3a", "#9cc75a"],
    darkLeaf: ["#1a3020", "#2c4f2e", "#437438", "#66994a"],
    yellow: ["#8a4a0c", "#d98e14", "#f5c52a", "#fff08a"],
    brown: ["#2e180c", "#5e3418", "#87501f", "#b07a34"],
    pink: ["#7a2350", "#c24a86", "#ec84b4", "#ffc4de"],
    white: ["#6c6a84", "#b4b4c8", "#e6e6ef", "#ffffff"],
    violet: ["#3a2366", "#6a44a8", "#9a76d6", "#c9b0f2"],
    red: ["#5e1024", "#a8243a", "#dc4a4a", "#f79080"],
    orange: ["#6e2a0c", "#b8521c", "#e8862e", "#ffc070"],
    bronze: ["#5a2a14", "#9a4a1e", "#cf7a34", "#f0b060"],
    lilac: ["#5a3a7a", "#9270b8", "#c0a4e0", "#eadcfa"],
    heather: ["#4a1a4a", "#8a3480", "#c05ab0", "#e89ad8"],
    cream: ["#8a8a70", "#c8c6a8", "#ecebd4", "#ffffff"],
    wood: ["#3a2418", "#6a4428", "#9a6a40", "#c69a64"],
    metal: ["#23222c", "#3d3b4a", "#5d5a6c", "#8a879a"],
    hay: ["#6e4e1c", "#a8802e", "#d2b050", "#f0dc8a"],
    glow: ["#c8801c", "#f6c343", "#ffe38a", "#fffbe0"],
    grass: ["#2f5226", "#447230", "#578c38", "#7fb44a"],
    soil: ["#2e1c14", "#4e3222", "#654230", "#7e5a42"],
    wet: ["#1e120e", "#342218", "#452e22", "#583c2e"],
    skin: ["#6e3b2a", "#b06a4a", "#e0a07a", "#f6cfae"],
    can: ["#1f3d34", "#2f6b56", "#4f9a78", "#8fd0a8"],
    dry: ["#4a3426", "#7a5a40", "#96765a", "#b4967a"],
    fall: ["#b8401c", "#e08a2a", "#f2c14a", "#8f2a1a"]
  };

  // src/garden/sprites/raster.ts
  var exports_raster = {};
  __export(exports_raster, {
    toCanvas: () => toCanvas,
    stem: () => stem,
    sphere: () => sphere,
    rampAt: () => rampAt,
    put: () => put,
    petal: () => petal,
    outline: () => outline,
    leaf: () => leaf,
    ell: () => ell,
    crop: () => crop,
    buf: () => buf
  });

  // src/garden/sprites/color.ts
  var hexRgb = (h) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16)
  ];
  function mix(a, b, t) {
    const A = hexRgb(a);
    const B = hexRgb(b);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }

  // src/garden/sprites/raster.ts
  var OUTLINE = "#140a14";
  var clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  var rampAt = (ramp, t) => ramp[clamp(Math.floor(t * 4), 0, 3)];
  var buf = (w, h) => ({ w, h, c: new Array(w * h).fill(null) });
  function put(b, x, y, col) {
    if (col && x >= 0 && y >= 0 && x < b.w && y < b.h)
      b.c[y * b.w + x] = col;
  }
  var get = (b, x, y) => x < 0 || y < 0 || x >= b.w || y >= b.h ? null : b.c[y * b.w + x];
  function ell(b, k, cx, cy, rx, ry, rot, shade) {
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const m = Math.max(rx, ry);
    const small = Math.min(rx, ry) * k;
    const edgeT = small < 1.6 ? 2 : 1 - 1.1 / small;
    for (let py = Math.floor((cy - m) * k);py <= Math.ceil((cy + m) * k); py++)
      for (let px = Math.floor((cx - m) * k);px <= Math.ceil((cx + m) * k); px++) {
        const ux = (px + 0.5) / k - cx;
        const uy = (py + 0.5) / k - cy;
        const lx = ux * cos + uy * sin;
        const ly = -ux * sin + uy * cos;
        const nx = lx / rx;
        const ny = ly / ry;
        const d = nx * nx + ny * ny;
        if (d > 1)
          continue;
        put(b, px, py, shade(nx, ny, d, Math.sqrt(d) > edgeT, px, py, ux, uy));
      }
  }
  var sphere = (ramp, bias = 0) => (_nx, _ny, d, edge, _px, _py, ux, uy) => {
    const r = Math.hypot(ux, uy) || 1;
    const lit = -(ux / r * 0.6 + uy / r * 0.8) * Math.sqrt(d);
    return rampAt(ramp, 0.5 + 0.45 * lit + bias - (edge ? 0.3 : 0));
  };
  function petal(b, k, cx, cy, ang, len, wid, ramp, o = {}) {
    const x = cx + Math.cos(ang) * len / 2;
    const y = cy + Math.sin(ang) * len / 2;
    const face = -(Math.cos(ang) * 0.6 + Math.sin(ang) * 0.8) * 0.15;
    ell(b, k, x, y, len / 2, wid / 2, ang, (nx, ny, _d, edge) => {
      const along = (nx + 1) / 2;
      const across = Math.abs(ny);
      if (o.notch && along > 0.86 && across < 0.24)
        return null;
      if (o.base && along < 0.28)
        return rampAt(o.base, 0.55 + along);
      let t = 0.25 + 0.7 * along - 0.25 * across + face + (o.bias ?? 0);
      if (edge)
        t -= 0.35;
      return rampAt(ramp, t);
    });
  }
  function leaf(b, k, cx, cy, ang, len, wid, ramp) {
    const x = cx + Math.cos(ang) * len / 2;
    const y = cy + Math.sin(ang) * len / 2;
    ell(b, k, x, y, len / 2, wid / 2, ang, (nx, ny, _d, edge) => {
      const along = (nx + 1) / 2;
      if (Math.abs(ny) < 0.13 && along > 0.08 && along < 0.85)
        return ramp[0];
      let t = 0.35 + 0.35 * along + (ny < 0 ? 0.2 : -0.1);
      if (edge)
        t -= 0.3;
      return rampAt(ramp, t);
    });
  }
  function stem(b, k, x0, y0, x1, y1, w, ramp, bend = 0) {
    const pw = Math.max(1, Math.round(w * k));
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * k * 1.6) + 1;
    const mx = (x0 + x1) / 2 + bend;
    const my = (y0 + y1) / 2;
    for (let i = 0;i <= n; i++) {
      const s = i / n;
      const a = (1 - s) * (1 - s);
      const c = 2 * s * (1 - s);
      const e = s * s;
      const x = a * x0 + c * mx + e * x1;
      const y = a * y0 + c * my + e * y1;
      const px = Math.round(x * k - pw / 2);
      const py = Math.round(y * k);
      for (let j = 0;j < pw; j++)
        put(b, px + j, py, j === 0 && pw > 1 ? ramp[2] : ramp[1]);
    }
  }
  function outline(b) {
    const out = b.c.slice();
    for (let y = 0;y < b.h; y++)
      for (let x = 0;x < b.w; x++) {
        if (b.c[y * b.w + x])
          continue;
        const n = get(b, x - 1, y) || get(b, x + 1, y) || get(b, x, y - 1) || get(b, x, y + 1);
        if (n)
          out[y * b.w + x] = mix(n, OUTLINE, 0.65);
      }
    b.c = out;
  }
  function crop(b, pad = 0) {
    let x0 = b.w;
    let y0 = b.h;
    let x1 = -1;
    let y1 = -1;
    b.c.forEach((col, i) => {
      if (!col)
        return;
      const x = i % b.w;
      const y = (i - x) / b.w;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    });
    if (x1 < 0)
      return b;
    const out = buf(x1 - x0 + 1 + 2 * pad, y1 - y0 + 1 + 2 * pad);
    for (let y = y0;y <= y1; y++)
      for (let x = x0;x <= x1; x++)
        put(out, x - x0 + pad, y - y0 + pad, b.c[y * b.w + x]);
    return out;
  }
  function toCanvas(b) {
    const cv = document.createElement("canvas");
    cv.width = b.w;
    cv.height = b.h;
    const g = cv.getContext("2d");
    const img = g.createImageData(b.w, b.h);
    b.c.forEach((col, i) => {
      if (!col)
        return;
      const [r, gg, bb] = hexRgb(col);
      img.data.set([r, gg, bb, 255], i * 4);
    });
    g.putImageData(img, 0, 0);
    return cv;
  }

  // src/garden/sprites/decor.ts
  var TAU = Math.PI * 2;
  var AUTUMN = [PAL.orange, PAL.yellow, PAL.bronze, PAL.red];
  var DECOR_DRAW = {
    trou(b, k) {
      ell(b, k, 21.5, 44.8, 3.4, 1.8, 0, sphere(PAL.soil, 0.35));
      ell(b, k, 14.5, 45.2, 5.2, 2.2, 0, (_nx, ny) => ny < -0.2 ? PAL.soil[2] : ny < 0.3 ? PAL.soil[0] : "#140c08");
    },
    tas(b, k) {
      for (let i = 0;i < 46; i++) {
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
        [16, 6]
      ].forEach(([x, rx]) => ell(b, k, x, 40, rx, 6.8, 0, (nx, _ny, _d, edge, _px, _py, ux, uy) => {
        const gx = (x + ux - 16) / 11;
        const gy = uy / 7;
        const lit = -(gx * 0.6 + gy * 0.8);
        return rampAt(PAL.orange, 0.5 + 0.35 * lit - Math.abs(nx) * 0.25 - (edge ? 0.3 : 0));
      }));
      leaf(b, k, 17, 33, -0.3, 6, 3.4, PAL.green);
    },
    paille(b, k) {
      for (let py = Math.floor(31 * k);py < Math.floor(47 * k); py++)
        for (let px = Math.floor(3 * k);px < Math.floor(29 * k); px++) {
          const u = px / k;
          const v = py / k;
          const top = v < 35;
          if (Math.abs(u - 10) < 0.8 || Math.abs(u - 22) < 0.8) {
            put(b, px, py, top ? PAL.wood[2] : PAL.wood[1]);
            continue;
          }
          const t = (top ? 0.75 : 0.45) + (hash(Math.floor(px / 3), py) - 0.5) * 0.45 - (v > 44 ? 0.25 : 0);
          put(b, px, py, rampAt(PAL.hay, t));
        }
    },
    lanterne(b, k) {
      stem(b, k, 11, 47, 11, 22, 2, PAL.wood);
      stem(b, k, 11, 23, 23, 23, 1.2, PAL.wood);
      stem(b, k, 21, 23, 21, 25, 0.6, PAL.metal);
      ell(b, k, 21, 26.5, 3, 1.5, 0, sphere(PAL.metal, 0.1));
      for (let py = Math.floor(27.5 * k);py < Math.floor(34 * k); py++)
        for (let px = Math.floor(18.5 * k);px < Math.floor(23.5 * k); px++) {
          const u = px / k;
          const frame = u < 19.3 || u > 22.7;
          put(b, px, py, frame ? PAL.metal[1] : rampAt(PAL.glow, 0.95 - Math.abs(u - 21) * 0.25 - (py / k - 30) * 0.06));
        }
      ell(b, k, 21, 34.5, 2.8, 1, 0, sphere(PAL.metal));
    },
    corbeau(b, k) {
      petal(b, k, 11, 41, Math.PI * 0.94, 7, 3, PAL.crow);
      stem(b, k, 14, 44, 13, 47, 0.6, PAL.metal);
      stem(b, k, 17, 44, 18, 47, 0.6, PAL.metal);
      ell(b, k, 15, 40.5, 6.5, 4.2, -0.15, sphere(PAL.crow));
      ell(b, k, 14, 40, 5, 2.4, -0.3, sphere(PAL.crow, -0.2));
      ell(b, k, 21, 35.5, 3.4, 3.2, 0, sphere(PAL.crow, 0.1));
      petal(b, k, 23.8, 36, 0.12, 3.6, 1.6, PAL.metal, { bias: 0.2 });
      put(b, Math.round(22 * k), Math.round(34.6 * k), "#e8e0d0");
    },
    cloture(b, k) {
      stem(b, k, -1, 33, 33, 33, 2, PAL.wood);
      stem(b, k, -1, 40, 33, 40, 2, PAL.wood);
      stem(b, k, 5, 47, 5, 29, 2.6, PAL.wood);
      stem(b, k, 27, 47, 27, 29, 2.6, PAL.wood);
      ell(b, k, 5.3, 29, 1.3, 1, 0, () => PAL.wood[3]);
      ell(b, k, 27.3, 29, 1.3, 1, 0, () => PAL.wood[3]);
    }
  };
  function drawTree(b, k) {
    stem(b, k, 48, 143, 47, 70, 7, PAL.wood, -2);
    stem(b, k, 47, 100, 30, 72, 3, PAL.wood, 3);
    stem(b, k, 48, 92, 66, 66, 3, PAL.wood, -3);
    ell(b, k, 48, 141, 14, 3, 0, sphere(PAL.grass, -0.2));
    for (let i = 0;i < 46; i++) {
      const a = hash(i, 1) * TAU;
      const rr = Math.sqrt(hash(i, 2));
      const x = 48 + Math.cos(a) * rr * 34;
      const y = 54 + Math.sin(a) * rr * 34;
      const ramp = AUTUMN[Math.floor(hash(i, 3) * 3.4)];
      ell(b, k, x, y, 9 + hash(i, 4) * 5, 8 + hash(i, 5) * 4, 0, (_nx, _ny, _d, edge, px, py, ux, uy) => {
        const gx = (x + ux - 48) / 42;
        const gy = (y + uy - 50) / 42;
        const lit = -(gx * 0.7 + gy * 0.7);
        return rampAt(ramp, 0.45 + 0.5 * lit + (hash(px >> 1, py >> 1, 7) - 0.5) * 0.35 - (edge ? 0.25 : 0));
      });
    }
  }

  // src/garden/sprites/species.ts
  var TAU2 = Math.PI * 2;
  var SPECIES_COLOR = {
    yellow: "yellow",
    pink: "pink",
    white: "white",
    violet: "violet",
    red: "red",
    orange: "orange",
    bronze: "bronze",
    heather: "heather",
    lilac: "lilac"
  };
  var SPECIES_DRAW = {
    tournesol(b, k, C) {
      stem(b, k, 16, 47, 16, 13, 2.2, PAL.green, 1.5);
      leaf(b, k, 16, 38, Math.PI * 0.95, 10, 6, PAL.green);
      leaf(b, k, 17, 31, -0.15, 9, 5.5, PAL.green);
      leaf(b, k, 16, 23, Math.PI * 1.08, 7, 4.5, PAL.green);
      for (let j = 0;j < 20; j++)
        petal(b, k, 16, 12, j / 20 * TAU2 + 0.1, 8.5, 3, C);
      ell(b, k, 16, 12, 5.6, 5.6, 0, (nx, ny, d, _edge, px, py) => {
        if (d > 0.78)
          return PAL.brown[0];
        const lit = -(nx * 0.6 + ny * 0.8);
        return PAL.brown[(lit > 0.3 ? 1 : 0) + (px + py) % 2];
      });
    },
    dahlia(b, k, C) {
      stem(b, k, 16, 47, 16, 20, 1.6, PAL.green);
      leaf(b, k, 16, 38, Math.PI * 0.92, 8, 5, PAL.darkLeaf);
      leaf(b, k, 16, 34, -0.2, 8, 5, PAL.darkLeaf);
      leaf(b, k, 16, 27, Math.PI * 1.1, 6, 3.6, PAL.darkLeaf);
      const cx = 16;
      const cy = 15;
      for (let r = 7.4;r > 0.4; r -= 2) {
        const n = Math.max(1, Math.round(TAU2 * r / 2.3));
        for (let j = 0;j < n; j++) {
          const a = j / n * TAU2 + r;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r * 0.92;
          const lit = -((x - cx) * 0.6 + (y - cy) * 0.8) / 8;
          ell(b, k, x, y, 1.8, 1.5, a, (_nx, _ny, d, edge) => rampAt(C, 0.45 + 0.4 * lit + (d > 0.4 ? 0.18 : -0.22) - (edge ? 0.3 : 0)));
        }
      }
    },
    cosmos(b, k, C) {
      stem(b, k, 16, 47, 17, 16, 1.1, PAL.green, -2.5);
      for (let y = 42;y > 22; y -= 5) {
        const dir = y % 10 ? 1 : -1;
        stem(b, k, 16, y, 16 + dir * 7, y - 5, 0.8, PAL.green, dir);
        stem(b, k, 16 + dir * 3, y - 1, 16 + dir * 4, y - 6, 0.7, PAL.green);
      }
      for (let j = 0;j < 8; j++)
        petal(b, k, 17, 13, j / 8 * TAU2 + 0.2, 8.2, 4.8, C, { notch: true });
      const heart = sphere(PAL.yellow);
      ell(b, k, 17, 13, 2.4, 2.4, 0, (nx, ny, d, edge, px, py) => (px * 3 + py) % 4 === 0 ? PAL.yellow[0] : heart(nx, ny, d, edge, px, py, nx, ny));
    },
    aster(b, k, C) {
      const heads = [
        [9, 25],
        [23, 21],
        [15, 13]
      ];
      for (const [x, y] of heads)
        stem(b, k, 16, 47, x, y, 1, PAL.green, (x - 16) * 0.2);
      [
        [16, 40, 3.6],
        [16, 34, -0.5],
        [13, 30, 3.8],
        [20, 28, -0.7]
      ].forEach(([x, y, a]) => leaf(b, k, x, y, a, 6, 2, PAL.green));
      for (const [x, y] of heads) {
        for (let j = 0;j < 22; j++)
          petal(b, k, x, y, j / 22 * TAU2, 5.2, 1.4, C);
        ell(b, k, x, y, 1.9, 1.9, 0, sphere(PAL.yellow, 0.1));
      }
    },
    bruyere(b, k, C) {
      ell(b, k, 16, 42, 12.5, 6, 0, (_nx, ny, _d, edge, px, py) => rampAt(PAL.darkLeaf, 0.4 - ny * 0.35 + (hash(px, py) - 0.5) * 0.5 - (edge ? 0.3 : 0)));
      const tops = [
        [5, 31],
        [9, 27],
        [13, 24],
        [17, 22],
        [21, 25],
        [25, 28],
        [28, 33]
      ];
      for (const [tx, ty] of tops) {
        const x0 = 16 + (tx - 16) * 0.4;
        const y0 = 42;
        stem(b, k, x0, y0, tx, ty, 0.8, PAL.brown);
        for (let s = 0.05;s < 0.95; s += 0.1) {
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
        [15.5, 30, 0]
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
        [16, 44, -2.1]
      ].forEach(([x, y, a]) => leaf(b, k, x, y, a, 9, 5, PAL.darkLeaf));
      const heads = [
        [9, 31, 4.6],
        [23, 30, 4.6],
        [16, 23, 5.4]
      ];
      for (const [x, y] of heads)
        stem(b, k, 16, 42, x, y, 1.1, PAL.green);
      for (const [x, y, r] of heads) {
        for (let j = 0;j < 16; j++)
          petal(b, k, x, y, j / 16 * TAU2, r, 1.9, C, { bias: -0.15 });
        for (let j = 0;j < 9; j++)
          petal(b, k, x, y + 0.5, Math.PI + j / 8 * Math.PI, r * 0.7, 1.8, C, { bias: 0.05 });
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
        [15.8, 35, 4.3]
      ].forEach(([x, y, r]) => {
        for (let j = 0;j < 5; j++)
          petal(b, k, x, y, j / 5 * TAU2 - 1.2, r, r * 0.95, C, { bias: 0.1 });
        ell(b, k, x, y, r * 0.3, r * 0.3, 0, () => C[0]);
        put(b, Math.round(x * k), Math.round(y * k), PAL.yellow[2]);
      });
    }
  };

  // src/garden/sprites/stages.ts
  var STAGE_DRAW = {
    graine(b, k, C) {
      ell(b, k, 16, 46.5, 5, 1.6, 0, sphere(PAL.soil, 0.2));
      stem(b, k, 21, 47, 21, 37, 1, PAL.wood);
      for (let y = 34;y < 39; y++)
        for (let x = 18;x < 25; x++)
          for (let py = Math.floor(y * k);py < Math.floor((y + 1) * k); py++)
            for (let px = Math.floor(x * k);px < Math.floor((x + 1) * k); px++)
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
    bouton(b, k, C) {
      stem(b, k, 16, 47, 16, 21, 1.4, PAL.green, 1);
      leaf(b, k, 16, 40, Math.PI * 0.9, 8, 4.5, PAL.green);
      leaf(b, k, 16, 34, -0.2, 7, 4, PAL.green);
      leaf(b, k, 16, 28, Math.PI * 1.1, 5.5, 3.2, PAL.green);
      const top = sphere(C, 0.05);
      const body = sphere(PAL.green);
      ell(b, k, 16, 19, 2.8, 3.8, 0, (nx, ny, d, edge, px, py, ux, uy) => (ny < -0.25 ? top : body)(nx, ny, d, edge, px, py, ux, uy));
      leaf(b, k, 16, 21, -Math.PI * 0.62, 3.5, 1.4, PAL.green);
      leaf(b, k, 16, 21, -Math.PI * 0.38, 3.5, 1.4, PAL.green);
    }
  };

  // src/garden/sprites/tools.ts
  function inside(p, x, y) {
    let c = false;
    for (let i = 0, j = p.length - 1;i < p.length; j = i++) {
      const [xi, yi] = p[i];
      const [xj, yj] = p[j];
      if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi)
        c = !c;
    }
    return c;
  }
  function poly(b, k, p, shade) {
    const xs = p.map((q) => q[0]);
    const ys = p.map((q) => q[1]);
    const at = (px, py) => inside(p, (px + 0.5) / k, (py + 0.5) / k);
    for (let py = Math.floor(Math.min(...ys) * k);py <= Math.ceil(Math.max(...ys) * k); py++)
      for (let px = Math.floor(Math.min(...xs) * k);px <= Math.ceil(Math.max(...xs) * k); px++) {
        if (!at(px, py))
          continue;
        const edge = !at(px - 1, py) || !at(px + 1, py) || !at(px, py - 1) || !at(px, py + 1);
        put(b, px, py, shade((px + 0.5) / k, (py + 0.5) / k, edge));
      }
  }
  function bar(b, k, x0, y0, x1, y1, w, ramp) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const ang = Math.atan2(y1 - y0, x1 - x0);
    ell(b, k, (x0 + x1) / 2, (y0 + y1) / 2, len / 2 + w / 2, w / 2, ang, (_nx, ny, _d, edge) => edge ? ramp[0] : rampAt(ramp, 0.55 - ny * 0.35));
  }
  var shadeEdge = (ramp, t, edge) => edge ? ramp[0] : rampAt(ramp, t);
  var TOOL_DRAW = {
    main(b, k) {
      poly(b, k, [
        [10.5, 42],
        [21.5, 42],
        [22, 47.5],
        [10, 47.5]
      ], (u, _v, e) => shadeEdge(PAL.green, 0.8 - (u - 10) / 16, e));
      const fingers = [
        [10.6, 19.5, 3.6],
        [14.6, 17.5, 3.7],
        [18.6, 18.5, 3.6],
        [22.2, 22, 3.2]
      ];
      for (const [x, top, w] of fingers) {
        poly(b, k, [
          [x - w / 2, top + w / 2],
          [x + w / 2, top + w / 2],
          [x + w / 2, 30],
          [x - w / 2, 30]
        ], (u, _v, e) => e ? PAL.skin[1] : rampAt(PAL.skin, 0.95 - (u - x + w / 2) / w * 0.5));
        ell(b, k, x, top + w / 2, w / 2, w / 2, 0, (nx, ny, _d, e) => e ? PAL.skin[1] : rampAt(PAL.skin, 0.9 - nx * 0.2 - ny * 0.1));
      }
      const bx = 11.5;
      const by = 40;
      const ax = -0.72;
      const ay = -0.69;
      const thumb = (d, t) => [bx + ax * d - ay * t, by + ay * d + ax * t];
      poly(b, k, [
        thumb(0, -3.6),
        thumb(8, -2.7),
        thumb(11, -1.4),
        thumb(11.6, 0.4),
        thumb(10.4, 2.2),
        thumb(3, 3.4),
        thumb(0, 3.4)
      ], (u, v, e) => {
        if (e)
          return PAL.skin[1];
        const t = -ay * (u - bx) + ax * (v - by);
        return rampAt(PAL.skin, t < 0 ? 0.9 : 0.7);
      });
      const [nx0, ny0] = thumb(9.8, -0.5);
      ell(b, k, nx0, ny0, 1.4, 1.1, Math.atan2(ay, ax), (_x, _y, _d, e) => e ? PAL.skin[2] : PAL.skin[3]);
      poly(b, k, [
        [8.8, 28],
        [24, 28],
        [23.6, 37],
        [21.8, 42.5],
        [11, 42.5],
        [9, 37.5]
      ], (u, v, e) => e ? PAL.skin[1] : rampAt(PAL.skin, 0.95 - (u - 9) / 40 - (v - 28) / 45));
      for (let x = 12;x < 21; x++)
        put(b, Math.round(x * k), Math.round((32.5 + (x - 12) * 0.2) * k), PAL.skin[1]);
    },
    transplantoir(b, k) {
      bar(b, k, 4.5, 45.5, 12.5, 37.5, 3.6, PAL.wood);
      bar(b, k, 12.5, 37.5, 14.5, 35.5, 4.2, PAL.metal);
      const ox = 14.5;
      const oy = 35.5;
      const ax = Math.SQRT1_2;
      const ay = -Math.SQRT1_2;
      const local = [
        [0, -2.6],
        [3, -5.8],
        [10, -6],
        [15.5, -2.5],
        [17, 0],
        [15.5, 2.5],
        [10, 6],
        [3, 5.8],
        [0, 2.6]
      ];
      const pts = local.map(([s, t]) => [ox + ax * s - ay * t, oy + ay * s + ax * t]);
      poly(b, k, pts, (u, v, e) => {
        const du = u - ox;
        const dv = v - oy;
        const t = -ay * du + ax * dv;
        if (e)
          return PAL.metal[0];
        if (Math.abs(t) < 0.55)
          return PAL.metal[1];
        return rampAt(PAL.metal, t < 0 ? 0.95 : 0.55);
      });
    },
    arrosoir(b, k) {
      for (let a = 0;a <= Math.PI; a += 0.06)
        ell(b, k, 13 - Math.cos(a) * 6.5, 33 - Math.sin(a) * 5.5, 1.1, 1.1, 0, (_nx, ny) => ny < 0 ? PAL.can[2] : PAL.can[1]);
      const sx = 21;
      const sy = 44;
      const ex = 29.5;
      const ey = 31;
      const len = Math.hypot(ex - sx, ey - sy);
      const dx = (ex - sx) / len;
      const dy = (ey - sy) / len;
      const n = [-dy, dx];
      poly(b, k, [
        [sx + n[0] * 1.9, sy + n[1] * 1.9],
        [ex + n[0] * 1, ey + n[1] * 1],
        [ex - n[0] * 1, ey - n[1] * 1],
        [sx - n[0] * 1.9, sy - n[1] * 1.9]
      ], (u, v, e) => {
        if (e)
          return PAL.can[0];
        const side = (u - sx) * n[0] + (v - sy) * n[1];
        return side < 0 ? PAL.can[2] : PAL.can[1];
      });
      const rot = Math.atan2(dy, dx) + Math.PI / 2;
      const rx = ex + dx * 1.2;
      const ry = ey + dy * 1.2;
      ell(b, k, rx, ry, 3.4, 1.5, rot, (_nx, ny, _d, e) => e ? PAL.metal[0] : ny < 0 ? PAL.metal[3] : PAL.metal[2]);
      poly(b, k, [
        [4.5, 35],
        [6, 33.2],
        [20, 33.2],
        [21.5, 35],
        [22.5, 46.5],
        [3.5, 46.5]
      ], (u, v, e) => {
        if (e)
          return PAL.can[0];
        if (v < 35)
          return PAL.can[3];
        if (v > 39.2 && v < 40.4)
          return PAL.can[1];
        return rampAt(PAL.can, 0.95 - (u - 3.5) / 19);
      });
    },
    secateur(b, k) {
      const px = 16;
      const py = 31;
      const grip = [PAL.red[1], PAL.red[2], PAL.red[2], PAL.red[3]];
      bar(b, k, 15, 32.5, 7.5, 46, 3.2, grip);
      bar(b, k, 17, 32.5, 24.5, 46, 3.2, grip);
      const zig = [
        [11.4, 42.6],
        [12.9, 40.9],
        [14.4, 42.6],
        [15.9, 40.9],
        [17.4, 42.6],
        [18.9, 40.9],
        [20.6, 42.6]
      ];
      for (let i = 0;i + 1 < zig.length; i++)
        bar(b, k, zig[i][0], zig[i][1], zig[i + 1][0], zig[i + 1][1], 0.8, [
          PAL.metal[1],
          PAL.metal[3],
          PAL.metal[3],
          PAL.metal[3]
        ]);
      const open = 0.5;
      petal(b, k, px, py, -Math.PI / 2 - open, 13, 3.6, PAL.metal, { bias: 0.25 });
      petal(b, k, px, py, -Math.PI / 2 + open, 13, 3.6, PAL.metal, { bias: 0.05 });
      ell(b, k, px, py, 1.7, 1.7, 0, sphere(PAL.yellow, 0.1));
    },
    rateau(b, k) {
      stem(b, k, 8, 47, 21, 33, 1.4, PAL.wood);
      stem(b, k, 17, 28, 27, 38, 1.6, PAL.metal);
      for (let i = 0;i < 4; i++)
        stem(b, k, 18 + i * 3, 29 + i * 3, 21 + i * 3, 26 + i * 3, 0.8, PAL.metal);
    }
  };

  // src/garden/sprites/sprite.ts
  var SPRITE_TILE = 48;
  var K = SPRITE_TILE / 32;
  var spriteKey = (ref) => `${ref.name}:${ref.color ?? ""}`;
  function rampOf(color) {
    if (!color)
      return PAL.green;
    if (color === "cream")
      return PAL.cream;
    return PAL[SPECIES_COLOR[color]];
  }
  function renderSpriteBuf(ref) {
    if (ref.name === "arbre") {
      const b2 = buf(SPRITE_TILE * 3, SPRITE_TILE * 4.5);
      drawTree(b2, K);
      outline(b2);
      return b2;
    }
    const b = buf(SPRITE_TILE, SPRITE_TILE * 1.5);
    const draw = SPECIES_DRAW[ref.name] ?? STAGE_DRAW[ref.name] ?? DECOR_DRAW[ref.name] ?? TOOL_DRAW[ref.name];
    draw(b, K, rampOf(ref.color));
    outline(b);
    return b;
  }
  var cache = new Map;
  function spriteCanvas(ref) {
    const key = spriteKey(ref);
    let cv = cache.get(key);
    if (!cv) {
      cv = toCanvas(renderSpriteBuf(ref));
      cache.set(key, cv);
    }
    return cv;
  }
  var urls = new Map;
  function spriteDataUrl(ref) {
    const key = spriteKey(ref);
    let url = urls.get(key);
    if (!url) {
      url = spriteCanvas(ref).toDataURL();
      urls.set(key, url);
    }
    return url;
  }
  var icons = new Map;
  function iconDataUrl(ref) {
    const key = spriteKey(ref);
    let url = icons.get(key);
    if (!url) {
      url = toCanvas(crop(renderSpriteBuf(ref), 1)).toDataURL();
      icons.set(key, url);
    }
    return url;
  }

  // ../../../../private/tmp/claude-501/-Users-sulyk-Project-c411-debrid-app/b80f2483-b651-4f32-afe8-4f6b097578c6/scratchpad/gs-entry.ts
  window.GS = { iconDataUrl, spriteDataUrl, PAL, R: exports_raster };
})();
