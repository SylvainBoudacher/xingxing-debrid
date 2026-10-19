import { canvasTex, dot, pick, range } from "./pixel";

const GRASS = ["#5e8a30", "#6a9636", "#76a23c", "#527c2a", "#82ac44"];

export function grassTop(w: number, h: number, seed?: number) {
  return canvasTex(
    w,
    h,
    (g, rng) => {
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const n = Math.sin(x * 0.07 + Math.sin(y * 0.05) * 2) + Math.sin(y * 0.09 + x * 0.02);
          const r = rng();
          dot(
            g,
            x,
            y,
            n > 0.6
              ? r < 0.5
                ? GRASS[2]
                : GRASS[4]
              : n < -0.8
                ? r < 0.6
                  ? GRASS[3]
                  : GRASS[0]
                : r < 0.55
                  ? GRASS[1]
                  : r < 0.8
                    ? GRASS[0]
                    : GRASS[2],
          );
        }
      for (let i = 0; i < (w * h) / 22; i++) {
        const x = Math.floor(range(rng, 0, w)),
          y = Math.floor(range(rng, 0, h));
        dot(g, x, y, "#9cc458");
        dot(g, x, y + 1, "#486e24");
      }
    },
    { seed },
  );
}

export function cliffFace(w: number, h: number, seed?: number) {
  return canvasTex(
    w,
    h,
    (g, rng) => {
      const cols = ["#6b4a2c", "#5a3c22", "#7a5634", "#4a3018", "#664428"];
      for (let x = 0; x < w; x++) {
        let y = 0;
        while (y < h) {
          const len = Math.floor(range(rng, 2, 9));
          dot(g, x, y, pick(rng, cols), 1, len);
          y += len;
        }
      }
      for (let i = 0; i < w / 3; i++) {
        const x = Math.floor(range(rng, 0, w)),
          y = Math.floor(range(rng, 6, h));
        const len = Math.floor(range(rng, 2, 5));
        dot(g, x, y, "#8a6a44", len, 1);
        dot(g, x, y + 1, "#3a2410", len, 1);
      }
      for (let y = h - 6; y < h; y++) {
        g.fillStyle = `rgba(20,10,0,${(y - h + 7) * 0.07})`;
        g.fillRect(0, y, w, 1);
      }
      let len = 4;
      for (let x = 0; x < w; x++) {
        len = Math.max(2, Math.min(9, len + Math.floor(range(rng, -2, 3))));
        for (let y = 0; y < len; y++)
          dot(
            g,
            x,
            y,
            y === 0
              ? "#9cc458"
              : y === len - 1
                ? "#3e6020"
                : y < 2
                  ? GRASS[2]
                  : pick(rng, [GRASS[0], GRASS[1], GRASS[3]]),
          );
      }
    },
    { seed },
  );
}

export function stoneTex(w: number, h: number, seed?: number) {
  return canvasTex(
    w,
    h,
    (g, rng) => {
      dot(g, 0, 0, "#8a8478", w, h);
      for (let y = 0; y < h; y += 5) {
        const off = (y / 5) % 2 ? 4 : 0;
        for (let x = -off; x < w; x += 8) {
          dot(g, x + 1, y + 1, pick(rng, ["#a8a090", "#9a9284", "#b4ac9a"]), 6, 3);
          dot(g, x + 1, y + 1, "#c8c0ac", 6, 1);
        }
        dot(g, 0, y, "#5a5448", w, 1);
      }
    },
    { seed },
  );
}

export function soilTex(w: number, h: number, seed?: number) {
  return canvasTex(
    w,
    h,
    (g, rng) => {
      for (let y = 0; y < h; y++) {
        const ph = y % 16;
        const base =
          ph < 3
            ? "#4a2c18"
            : ph < 5
              ? "#5e3a20"
              : ph < 11
                ? "#7a4e2c"
                : ph < 13
                  ? "#8c5c34"
                  : "#6a4426";
        for (let x = 0; x < w; x++)
          dot(g, x, y, rng() < 0.12 ? pick(rng, ["#5a3820", "#946438", "#3e2412"]) : base);
      }
    },
    { seed },
  );
}

export const PATH_DIRT = ["#9a7448", "#8a6640", "#a88054", "#7e5a38"];
export const PATH_GHOST = ["#a88a60", "#9a7c54", "#b49468"];

// Bande à bords irréguliers, transparente au-dehors.
export function pathTex(
  w: number,
  h: number,
  palette = PATH_DIRT,
  edge = "#5e4228",
  seed?: number,
) {
  return canvasTex(
    w,
    h,
    (g, rng) => {
      const m: boolean[] = [];
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const ex = Math.min(x, w - 1 - x),
            ey = Math.min(y, h - 1 - y);
          const v =
            Math.min(ex, ey) +
            Math.sin(x * 0.4 + y * 0.13) * 1.6 +
            Math.sin(y * 0.5 - x * 0.2) * 1.4 +
            range(rng, -0.8, 0.8);
          m[y * w + x] = v > 2.5;
        }
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (!m[y * w + x]) continue;
          const border =
            !m[y * w + x + 1] || !m[y * w + x - 1] || !m[(y + 1) * w + x] || !m[(y - 1) * w + x];
          dot(g, x, y, border ? edge : rng() < 0.08 ? "#c49c6c" : pick(rng, palette));
        }
    },
    { seed },
  );
}

export function shimmerTex() {
  return canvasTex(
    64,
    64,
    (g, rng) => {
      for (let i = 0; i < 40; i++)
        dot(
          g,
          Math.floor(range(rng, 0, 60)),
          Math.floor(range(rng, 0, 64)),
          pick(rng, ["rgba(190,230,240,0.7)", "rgba(140,200,215,0.6)"]),
          Math.floor(range(rng, 2, 6)),
          1,
        );
    },
    { repeat: true, seed: 3 },
  );
}

export function wetTex() {
  return canvasTex(
    16,
    10,
    (g, rng) => {
      for (let y = 0; y < 10; y++)
        for (let x = 0; x < 16; x++) {
          const d = ((x - 7.5) / 7.5) ** 2 + ((y - 4.5) / 4.5) ** 2;
          if (d < 1 - rng() * 0.25) dot(g, x, y, "#2a1608");
        }
    },
    { seed: 5 },
  );
}
