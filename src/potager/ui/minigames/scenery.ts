import { pick } from "../../textures/pixel";
import { GRASS } from "../../textures/terrain";
import { LH, LW, rect, ring, type Ctx } from "./pixelKit";

// Couleurs communes aux mini-jeux.
export const C = {
  ink: "#2a1c12",
  cream: "#f1e6d2",
  gold: "#f5c52a",
  goldDark: "#a8700c",
  good: "#8fd05a",
  goodDark: "#3e7a2a",
  mid: "#f0c040",
  bad: "#e0604a",
  glass: "#1a2230",
  water: "#4a8ad8",
  waterLight: "#a8d4ff",
  wood: "#8a5a2a",
  woodDark: "#5e3a1a",
  woodLight: "#b07a3a",
};

export const SOIL = ["#5e3a20", "#7a4e2c", "#6a4426", "#8c5c34"];
export const SOIL_DARK = ["#3e2412", "#4a2c18", "#5a3820"];
export const CLODS = ["#8c5c34", "#5e3a20", "#a87444", "#3e2412"];
const TUFT = ["#9cc458", "#486e24"];

export function grass(g: Ctx, rng: () => number, x0 = 0, y0 = 0, w = LW, h = LH) {
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const n = Math.sin(x * 0.18 + Math.sin(y * 0.12) * 2) + Math.sin(y * 0.21 + x * 0.05);
      const r = rng();
      const k = n > 0.7 ? (r < 0.5 ? 2 : 4) : n < -0.8 ? (r < 0.6 ? 3 : 0) : r < 0.55 ? 1 : 0;
      rect(g, x, y, 1, 1, GRASS[k]);
    }
  for (let i = 0; i < (w * h) / 40; i++) {
    const x = x0 + Math.floor(rng() * w),
      y = y0 + Math.floor(rng() * (h - 2));
    rect(g, x, y, 1, 1, TUFT[0]);
    rect(g, x, y + 1, 1, 1, TUFT[1]);
  }
}

// Terre retournée en sillons horizontaux, bord sombre en haut.
export function soil(g: Ctx, rng: () => number, x: number, y: number, w: number, h: number) {
  for (let j = 0; j < h; j++) {
    const ph = j % 6;
    const base = ph < 1 ? SOIL_DARK[1] : ph < 2 ? SOIL[0] : ph < 4 ? SOIL[1] : SOIL[3];
    for (let i = 0; i < w; i++)
      rect(
        g,
        x + i,
        y + j,
        1,
        1,
        rng() < 0.14 ? pick(rng, [SOIL[0], SOIL[3], SOIL_DARK[0]]) : base,
      );
  }
  rect(g, x, y - 1, w, 1, C.ink);
  rect(g, x, y + h, w, 1, SOIL_DARK[0]);
}

// Décor légèrement assombri (les éléments du jeu restent vifs) et bords fondus dans le cadre.
export function vignette(g: Ctx) {
  g.fillStyle = "rgba(18, 16, 30, 0.22)";
  g.fillRect(0, 0, LW, LH);
  for (let i = 0; i < 6; i++) {
    g.fillStyle = `rgba(14, 9, 6, ${0.3 * (1 - i / 6)})`;
    g.fillRect(i, i, LW - 2 * i, 1);
    g.fillRect(i, LH - 1 - i, LW - 2 * i, 1);
    g.fillRect(i, i + 1, 1, LH - 2 * i - 2);
    g.fillRect(LW - 1 - i, i + 1, 1, LH - 2 * i - 2);
  }
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

// intérieur vitré d'une jauge
export const innerOf = (b: Box): Box => ({ x: b.x + 2, y: b.y + 2, w: b.w - 4, h: b.h - 4 });

// Jauge verticale en bois et verre.
export function gauge(g: Ctx, b: Box) {
  rect(g, b.x - 1, b.y - 1, b.w + 2, b.h + 2, C.ink);
  rect(g, b.x, b.y, b.w, b.h, C.wood);
  rect(g, b.x, b.y, b.w, 1, C.woodLight);
  rect(g, b.x, b.y + b.h - 1, b.w, 1, C.woodDark);
  const i = innerOf(b);
  rect(g, i.x - 1, i.y - 1, i.w + 2, i.h + 2, C.ink);
  rect(g, i.x, i.y, i.w, i.h, C.glass);
}

// Fraction 0..1 d'une jauge vers une ordonnée (1 en haut).
export const level = (inner: { y: number; h: number }, k: number) => inner.y + inner.h * (1 - k);

// petit triangle doré pointant vers la gauche (dir -1) ou la droite (dir 1)
export function pointer(g: Ctx, x: number, y: number, dir: 1 | -1, col: string) {
  for (let i = 0; i < 3; i++) rect(g, x - dir * i, y - i, 1, 2 * i + 1, col);
}

const UP = ["...#...", "..###..", ".#####.", "#######", "..###..", "..###..", "..###.."];
const LEFT = UP.map((_, j) => UP.map((row) => row[j]).join(""));
const ARROW = {
  up: UP,
  down: [...UP].reverse(),
  left: LEFT,
  right: LEFT.map((row) => [...row].reverse().join("")),
};

// Touche de clavier en relief ; enfoncée, elle descend d'un pixel et perd son relief.
export function keycap(
  g: Ctx,
  x: number,
  y: number,
  dir: keyof typeof ARROW,
  state: { pressed?: boolean; face?: string; glow?: string } = {},
) {
  const s = 13,
    dy = state.pressed ? 1 : 0;
  if (state.glow) rect(g, x - 2, y - 2 + dy, s + 4, s + 5, state.glow);
  rect(g, x - 1, y - 1 + dy, s + 2, s + 3 - dy, C.ink);
  if (!state.pressed) rect(g, x, y + s - 1, s, 2, "#8a7a62");
  rect(g, x, y + dy, s, s - 1, state.face ?? "#e8dcc4");
  rect(g, x, y + dy, s, 1, "#fff6e4");
  ARROW[dir].forEach((row, j) =>
    [...row].forEach((ch, i) => ch === "#" && rect(g, x + 3 + i, y + 2 + j + dy, 1, 1, C.ink)),
  );
}

const HIT_COL = [C.bad, C.mid, C.good];

// Pastille d'un coup : vide (clignote si c'est le prochain), puis couleur du résultat.
export function pip(
  g: Ctx,
  x: number,
  y: number,
  hit: number | undefined,
  next: boolean,
  now: number,
) {
  ring(g, x, y, 0, 4.5, C.ink);
  if (hit === undefined) {
    ring(g, x, y, 0, 3.5, next && Math.floor(now / 300) % 2 ? "#5a4a36" : "#3a2e22");
    return;
  }
  ring(g, x, y, 0, 3.5, HIT_COL[hit]);
  rect(g, x - 2, y - 2, 1, 1, "#fff6e4");
}
