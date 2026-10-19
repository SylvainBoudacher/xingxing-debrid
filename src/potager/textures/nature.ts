import { canvasTex, dot, outlineCanvas, range } from "./pixel";

export const TREE_PALETTES = [
  ["#8a2a18", "#c04424", "#e0702e", "#f6a848"],
  ["#9a4a14", "#d07a20", "#eaa230", "#f8d060"],
  ["#2e5a24", "#447a2c", "#5e9a34", "#8cc04a"],
  ["#7a2a2a", "#a83a2a", "#d0583a", "#ee8a50"],
] as const;

function blobs(
  g: CanvasRenderingContext2D,
  rng: () => number,
  w: number,
  h: number,
  shapes: [number, number, number][],
  p: readonly string[],
  jitter: number,
) {
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let shade = -9;
      for (const [cx, cy, r] of shapes) {
        const dx = x - cx,
          dy = y - cy;
        if (dx * dx + dy * dy < r * r) shade = Math.max(shade, (-dx - dy) / r);
      }
      if (shade === -9) continue;
      const k = shade + range(rng, -jitter, jitter);
      dot(g, x, y, k > 0.55 ? p[3] : k > 0.1 ? p[2] : k > -0.4 ? p[1] : p[0]);
    }
}

export function treeTex(palette: number) {
  return canvasTex(
    48,
    64,
    (g, rng) => {
      dot(g, 21, 38, "#6a4426", 6, 26);
      dot(g, 21, 38, "#8a5c34", 2, 26);
      dot(g, 25, 38, "#4a2c18", 2, 26);
      dot(g, 18, 60, "#5a3820", 12, 4);
      blobs(
        g,
        rng,
        48,
        48,
        [
          [24, 22, 15],
          [14, 30, 10],
          [34, 29, 11],
          [24, 12, 10],
          [20, 34, 9],
          [30, 36, 8],
        ],
        TREE_PALETTES[palette],
        0.35,
      );
      outlineCanvas(g, 48, 64);
    },
    { seed: 100 + palette },
  );
}

export function bushTex(palette: number) {
  return canvasTex(
    32,
    20,
    (g, rng) => {
      blobs(
        g,
        rng,
        32,
        20,
        [
          [9, 12, 8],
          [18, 9, 9],
          [25, 13, 7],
        ],
        TREE_PALETTES[palette],
        0.3,
      );
      outlineCanvas(g, 32, 20);
    },
    { seed: 200 + palette },
  );
}

export function tuftTex(dry: boolean) {
  const [tip, mid, base] = dry
    ? ["#d8c070", "#a89a44", "#6a6020"]
    : ["#a6cc5c", "#6a9a36", "#3e6020"];
  const blades: [number, number][] = dry
    ? [
        [1, 4],
        [2, 2],
        [4, 1],
        [5, 3],
        [6, 4],
      ]
    : [
        [1, 3],
        [3, 1],
        [4, 2],
        [6, 3],
        [2, 2],
      ];
  return canvasTex(8, 8, (g) => {
    for (const [x, top] of blades)
      for (let y = top; y < 8; y++) dot(g, x, y, y === top ? tip : y > 5 ? base : mid);
  });
}

const LEAF_COLORS = ["#e0702e", "#c8462a", "#f0a63c"];

export function leafTex(i: number) {
  const c = LEAF_COLORS[i % LEAF_COLORS.length];
  return canvasTex(4, 3, (g) => {
    dot(g, 1, 0, c, 2, 1);
    dot(g, 0, 1, c, 4, 1);
    dot(g, 1, 2, c, 1, 1);
  });
}

export function glowTex() {
  return canvasTex(
    32,
    32,
    (g) => {
      const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, "rgba(255,230,170,1)");
      gr.addColorStop(0.3, "rgba(255,200,110,0.5)");
      gr.addColorStop(1, "rgba(255,180,80,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, 32, 32);
    },
    { linear: true },
  );
}
