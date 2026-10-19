(() => {
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
    blue: ["#1c2a6e", "#3456b8", "#5a8ae6", "#a8ccff"],
    burgundy: ["#3a0a1a", "#6e1430", "#9e2a48", "#cc5a74"],
    apricot: ["#7a3a1a", "#c8703c", "#f0a070", "#ffd4b0"],
    black: ["#140a1a", "#2a1630", "#44284e", "#6e4a7a"],
    lime: ["#3a5010", "#6e9420", "#a8cc3a", "#dcf07a"],
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
  function curveAt(x0, y0, x1, y1, bend, s) {
    const mx = (x0 + x1) / 2 + bend;
    const my = (y0 + y1) / 2;
    const a = (1 - s) * (1 - s);
    const c = 2 * s * (1 - s);
    const e = s * s;
    return [a * x0 + c * mx + e * x1, a * y0 + c * my + e * y1];
  }
  function stem(b, k, x0, y0, x1, y1, w, ramp, bend = 0) {
    const pw = Math.max(1, Math.round(w * k));
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * k * 1.6) + 1;
    for (let i = 0;i <= n; i++) {
      const [x, y] = curveAt(x0, y0, x1, y1, bend, i / n);
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

  // src/garden/core/hash.ts
  function hash(a, b = 0, c = 0) {
    let h = a * 374761393 + b * 668265263 + c * 1442695041 | 0;
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }

  // src/garden/sprites/decor.ts
  var TAU = Math.PI * 2;
  var AUTUMN = [PAL.orange, PAL.yellow, PAL.bronze, PAL.red];

  // src/garden/sprites/species/aster.ts
  var TAU2 = Math.PI * 2;

  // src/garden/sprites/species/chrysantheme.ts
  var TAU3 = Math.PI * 2;

  // src/garden/sprites/species/cosmos.ts
  var TAU4 = Math.PI * 2;
  var cosmos = (b, k, C) => {
    stem(b, k, 16, 47, 17, 16, 1.1, PAL.green, -2.5);
    for (let y = 42;y > 22; y -= 5) {
      const dir = y % 10 ? 1 : -1;
      stem(b, k, 16, y, 16 + dir * 7, y - 5, 0.8, PAL.green, dir);
      stem(b, k, 16 + dir * 3, y - 1, 16 + dir * 4, y - 6, 0.7, PAL.green);
    }
    for (let j = 0;j < 8; j++)
      petal(b, k, 17, 13, j / 8 * TAU4 + 0.2, 8.2, 4.8, C, { notch: true });
    const heart = sphere(PAL.yellow);
    ell(b, k, 17, 13, 2.4, 2.4, 0, (nx, ny, d, edge, px, py) => (px * 3 + py) % 4 === 0 ? PAL.yellow[0] : heart(nx, ny, d, edge, px, py, nx, ny));
  };

  // src/garden/sprites/species/dahlia.ts
  var TAU5 = Math.PI * 2;

  // src/garden/sprites/species/rosetremiere.ts
  var TAU6 = Math.PI * 2;

  // src/garden/sprites/species/tournesol.ts
  var TAU7 = Math.PI * 2;
  var tournesol = (b, k, C) => {
    stem(b, k, 16, 47, 16, 13, 2.2, PAL.green, 1.5);
    leaf(b, k, 16, 38, Math.PI * 0.95, 10, 6, PAL.green);
    leaf(b, k, 17, 31, -0.15, 9, 5.5, PAL.green);
    leaf(b, k, 16, 23, Math.PI * 1.08, 7, 4.5, PAL.green);
    for (let j = 0;j < 20; j++)
      petal(b, k, 16, 12, j / 20 * TAU7 + 0.1, 8.5, 3, C);
    ell(b, k, 16, 12, 5.6, 5.6, 0, (nx, ny, d, _edge, px, py) => {
      if (d > 0.78)
        return PAL.brown[0];
      const lit = -(nx * 0.6 + ny * 0.8);
      return PAL.brown[(lit > 0.3 ? 1 : 0) + (px + py) % 2];
    });
  };

  // src/garden/sprites/sprite.ts
  var SPRITE_TILE = 48;
  var K = SPRITE_TILE / 32;
  function drawBuf(draw, ramp) {
    const b = buf(SPRITE_TILE, SPRITE_TILE * 1.5);
    draw(b, K, ramp);
    outline(b);
    return b;
  }
  var cache = new Map;
  var urls = new Map;
  var icons = new Map;

  // src/garden/sprites/species/amarante.ts
  var TASSELS = [
    [15, 14, -9, 24],
    [17, 14, 9, 22],
    [16, 13, -4, 28],
    [16, 13, 4, 26]
  ];
  var amarante = (b, k, C) => {
    stem(b, k, 16, 47, 16, 13, 1.8, PAL.green, 1);
    leaf(b, k, 16, 42, Math.PI * 0.88, 11, 6.5, PAL.green);
    leaf(b, k, 16, 37, -0.25, 11, 6.5, PAL.green);
    leaf(b, k, 16, 20, Math.PI * 1.15, 7, 4, PAL.green);
    leaf(b, k, 16, 19, -0.45, 7, 4, PAL.green);
    TASSELS.forEach(([sx, sy, side, len], t) => {
      for (let s = 0;s <= 1; s += 0.05) {
        const x = sx + side * Math.sin(Math.min(1, s * 1.6) * Math.PI * 0.5);
        const y = sy - 4 * Math.sin(Math.min(1, s * 2.5) * Math.PI) * (1 - s) + s * len;
        const r = 1.6 * (1 - s * 0.35);
        ell(b, k, x, y, r, r, 0, sphere(C, -0.05 + (hash(t, Math.round(s * 20)) - 0.5) * 0.3));
      }
    });
    ell(b, k, 16, 12, 2.4, 2, 0, sphere(C, 0.15));
  };

  // src/garden/sprites/species/anemone.ts
  var TAU8 = Math.PI * 2;
  var HEADS = [
    [6, 21],
    [26, 17],
    [16, 8]
  ];
  var anemone = (b, k, C) => {
    [
      [16, 46, 3.4],
      [16, 46, -0.3],
      [15, 45, 4.2],
      [17, 45, 5.3]
    ].forEach(([x, y, a]) => leaf(b, k, x, y, a, 8, 5, PAL.darkLeaf));
    for (const [x, y] of HEADS)
      stem(b, k, 16, 43, x, y, 0.8, PAL.green, (x - 16) * 0.35);
    for (const [x, y] of HEADS) {
      for (let j = 0;j < 6; j++)
        petal(b, k, x, y, j / 6 * TAU8 + 0.3, 5.6, 4.2, C, { bias: 0.05 });
      ell(b, k, x, y, 2.1, 2.1, 0, sphere(PAL.yellow, 0.1));
      ell(b, k, x, y, 1.2, 1.2, 0, sphere(PAL.green, 0.15));
    }
  };

  // src/garden/sprites/species/heliopsis.ts
  var TAU9 = Math.PI * 2;
  var HEADS2 = [
    [9, 21, 5],
    [23, 18, 5],
    [16, 11, 5.8]
  ];
  var heliopsis = (b, k, C) => {
    stem(b, k, 16, 47, 16, 11, 1.4, PAL.green, 0.6);
    stem(b, k, 16, 33, 9, 21, 1, PAL.green, -1);
    stem(b, k, 16, 30, 23, 18, 1, PAL.green, 1);
    for (const y of [41, 35]) {
      leaf(b, k, 16, y, Math.PI * 0.95, 8, 4.5, PAL.green);
      leaf(b, k, 16, y, -0.1, 8, 4.5, PAL.green);
    }
    for (const [x, y, r] of HEADS2) {
      for (let j = 0;j < 14; j++)
        petal(b, k, x, y, j / 14 * TAU9, r, 2.4, C, { bias: 0.05 });
      ell(b, k, x, y, r * 0.38, r * 0.38, 0, sphere(PAL.bronze, -0.25));
    }
  };

  // src/garden/sprites/species/lanternelune.ts
  var LANTERN_BELLS = [
    [23, 16, 4],
    [17.5, 24, 3.3],
    [26, 28, 2.9]
  ];
  var ANCHORS = [8.5, 16.5, 7.5];
  var lanternelune = (b, k, C) => {
    stem(b, k, 12, 47, 12, 8, 1.4, PAL.darkLeaf, 2.5);
    stem(b, k, 12, 9, 26, 7, 1.1, PAL.darkLeaf, -3);
    stem(b, k, 12, 17, 18, 16, 0.8, PAL.darkLeaf, -1);
    leaf(b, k, 12, 40, Math.PI * 0.92, 8, 3.5, PAL.darkLeaf);
    leaf(b, k, 13, 32, -0.25, 7, 3, PAL.darkLeaf);
    LANTERN_BELLS.forEach(([x, y, r], i) => {
      stem(b, k, x, ANCHORS[i], x, y - r, 0.5, PAL.darkLeaf);
      ell(b, k, x, y, r, r * 1.2, 0, sphere(C, 0.25));
      ell(b, k, x, y + r * 0.9, r * 0.9, r * 0.35, 0, () => C[1]);
      put(b, Math.round(x * k), Math.round((y + r * 1.1) * k), PAL.glow[3]);
    });
  };

  // src/garden/sprites/species/sedum.ts
  var STEMS = [11, 16, 21];
  var DOME_Y = 25;
  var sedum = (b, k, C) => {
    for (const x of STEMS) {
      const bend = (x - 16) * 0.15;
      stem(b, k, 16, 47, x, DOME_Y, 1.7, PAL.green, bend);
      for (let s = 0.2;s < 0.8; s += 0.3) {
        const [lx, ly] = curveAt(16, 47, x, DOME_Y, bend, s);
        for (const side of [-1, 1])
          ell(b, k, lx + side * 2, ly, 2.2, 1.4, side * 0.5, sphere(PAL.green, 0.25));
      }
    }
    for (let row = 4;row >= 0; row--) {
      const half = 11 - (4 - row) * 1.2 - (row === 0 ? 2 : 0);
      for (let dx = -half;dx <= half; dx += 1.6) {
        const jitter = (hash(Math.round(dx * 10), row) - 0.5) * 0.8;
        const y = DOME_Y - 1 - (4 - row) * 1.5 - (1 - (dx / 11) ** 2) * 2 + jitter;
        ell(b, k, 16 + dx, y, 1.2, 1.1, 0, sphere(C, 0.1 - row * 0.08));
      }
    }
  };

  // src/garden/sprites/species/vergedor.ts
  var BRANCHES = [
    [4, 15, -3],
    [28, 14, 3],
    [9, 7, -2],
    [23, 6, 2],
    [16, 2, 0.5]
  ];
  var vergedor = (b, k, C) => {
    stem(b, k, 16, 47, 16, 20, 1.2, PAL.green, 0.5);
    for (let y = 43;y > 21; y -= 4.5)
      leaf(b, k, 16, y, Math.round(y) % 2 ? -0.35 : Math.PI + 0.35, 7, 2, PAL.green);
    BRANCHES.forEach(([ex, ey, bend], i) => {
      stem(b, k, 16, 21, ex, ey, 0.7, PAL.green, bend);
      for (let s = 0.3;s <= 1; s += 0.07) {
        const [x, y] = curveAt(16, 21, ex, ey, bend, s);
        const jx = (hash(i, Math.round(s * 100)) - 0.5) * 1.4;
        ell(b, k, x + jx, y - 1.1, 1.1, 1.1, 0, sphere(C, 0.1));
        ell(b, k, x - jx, y - 0.2, 0.9, 0.9, 0, sphere(C, -0.1));
      }
    });
  };

  // ../../../../private/tmp/claude-501/-Users-sulyk-Project-c411-debrid-app/b80f2483-b651-4f32-afe8-4f6b097578c6/scratchpad/planche-entry.ts
  var ROWS = [
    ["Références existantes : Tournesol, Cosmos", null, []],
    ["Anémone du Japon", anemone, ["pink", "white", "lilac", "burgundy"]],
    ["Sedum", sedum, ["pink", "burgundy", "white", "lime"]],
    ["Amarante", amarante, ["red", "burgundy", "lime", "orange", "yellow"]],
    ["Verge d'or", vergedor, ["yellow", "orange", "apricot", "white"]],
    ["Héliopsis", heliopsis, ["yellow", "orange", "bronze", "red"]],
    ["Lanterne-de-lune", lanternelune, ["blue", "white", "violet"]]
  ];
  var FR = { pink: "rose", white: "blanc", lilac: "lilas", burgundy: "bordeaux", lime: "vert", red: "rouge", orange: "orange", yellow: "jaune", apricot: "abricot", bronze: "bronze", blue: "bleu", violet: "violet" };
  var root = document.getElementById("planche");
  var cell = (cv, label) => {
    const d = document.createElement("div");
    d.style.cssText = "display:inline-block;text-align:center;margin:4px;color:#f1e6d2;font-size:12px";
    cv.style.cssText = "width:96px;image-rendering:pixelated;background:#3a2c30;border-radius:6px;display:block";
    d.append(cv, label);
    return d;
  };
  for (const [name, draw, colors] of ROWS) {
    const row = document.createElement("div");
    row.innerHTML = `<h3 style="color:#f3dca0;font-family:Georgia,serif;margin:10px 0 2px">${name}</h3>`;
    if (!draw) {
      row.append(cell(toCanvas(drawBuf(tournesol, PAL.yellow)), "tournesol"), cell(toCanvas(drawBuf(cosmos, PAL.pink)), "cosmos"));
    } else
      for (const c of colors)
        row.append(cell(toCanvas(drawBuf(draw, PAL[c])), FR[c]));
    root.appendChild(row);
  }
})();
