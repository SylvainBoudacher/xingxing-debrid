import { fillEll } from "./duckDraw";
import type { Variant } from "./duckTypes";

// Motifs du Tournesol et du Cactus. Appelés par paintPattern une fois pour la
// tête (un cercle, rx === ry) et une fois pour le corps, déjà découpés à la
// forme. Tout est à positions fixes: deux canards de la même espèce doivent
// se ressembler.

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

// Palettes normale / shiny (tournesol de lune, cactus bleu agave).
const SEEDS = {
  normal: {
    disk: ["#9A6632", "#6B3F1D", "#43240E"],
    dark: "rgba(40,20,6,0.75)",
    light: "rgba(214,160,80,0.7)",
    leaf: ["#7CC04F", "#3F7A2A"],
  },
  shiny: {
    disk: ["#6A3A4A", "#3E1C2A", "#200C16"],
    dark: "rgba(20,8,16,0.8)",
    light: "rgba(200,210,255,0.75)",
    leaf: ["#6FAF8A", "#2F6A55"],
  },
};
const RIBS = {
  normal: { dark: "rgba(20,70,25,0.4)", light: "rgba(210,255,180,0.28)" },
  shiny: { dark: "rgba(20,50,90,0.42)", light: "rgba(210,240,255,0.32)" },
};
type SeedPalette = (typeof SEEDS)["normal"];

// Cœur de tournesol: graines disposées selon l'angle d'or.
function paintSeedHead(
  c: CanvasRenderingContext2D,
  pal: SeedPalette,
  cx: number,
  cy: number,
  r: number,
) {
  const g = c.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 2, cx, cy, r);
  g.addColorStop(0, pal.disk[0]);
  g.addColorStop(0.7, pal.disk[1]);
  g.addColorStop(1, pal.disk[2]);
  fillEll(c, cx, cy, r, r, g);
  const n = 110;
  for (let i = 1; i < n; i++) {
    const d = r * 0.98 * Math.sqrt(i / n);
    const a = i * GOLDEN_ANGLE;
    const s = 0.9 + (d / r) * 0.9;
    fillEll(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d, s, s, i % 2 ? pal.dark : pal.light);
  }
}

// Aile en feuille de tournesol, sur le flanc, sous la crinière.
function paintLeafWing(c: CanvasRenderingContext2D, pal: SeedPalette) {
  const g = c.createLinearGradient(26, 74, 80, 110);
  g.addColorStop(0, pal.leaf[0]);
  g.addColorStop(1, pal.leaf[1]);
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(24, 74);
  c.quadraticCurveTo(66, 64, 80, 110);
  c.quadraticCurveTo(36, 108, 24, 74);
  c.fill();
  c.strokeStyle = "rgba(230,255,200,0.45)";
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(26, 76);
  c.quadraticCurveTo(56, 84, 78, 108);
  c.stroke();
  c.lineWidth = 0.8;
  for (const [x, y, dx, dy] of [
    [40, 81, 9, -5],
    [52, 88, 10, -4],
    [63, 96, 9, -2],
    [40, 81, -2, 10],
    [52, 88, -4, 10],
  ]) {
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + dx, y + dy);
    c.stroke();
  }
}

// Point d'une courbe de Bézier quadratique.
function quad(p0: number, p1: number, p2: number, t: number) {
  return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
}

// Côtes verticales bombées comme un tonneau, et aréoles à piquants blancs.
function paintCactus(
  c: CanvasRenderingContext2D,
  pal: (typeof RIBS)["normal"],
  cx: number,
  cy: number,
  rx: number,
  ry: number,
) {
  const ribs = rx === ry ? 2 : 3;
  const k = rx / 46;
  for (let i = -ribs; i <= ribs; i++) {
    const x0 = cx + (i / (ribs + 0.6)) * rx * 0.8;
    const x1 = cx + (i / (ribs + 0.6)) * rx * 1.05;
    const trace = (dx: number) => {
      c.beginPath();
      c.moveTo(x0 + dx, cy - ry);
      c.quadraticCurveTo(x1 + dx, cy, x0 + dx, cy + ry);
    };
    c.strokeStyle = pal.dark;
    c.lineWidth = 2.4 * k;
    trace(0);
    c.stroke();
    c.strokeStyle = pal.light;
    c.lineWidth = 1.3 * k;
    trace(2.2 * k);
    c.stroke();

    for (let s = 1; s <= 3; s++) {
      const t = (s + (i & 1 ? 0.5 : 0)) / 4.2;
      const px = quad(x0, x1, x0, t);
      const py = quad(cy - ry, cy, cy + ry, t);
      fillEll(c, px, py, 1.5 * k, 1.5 * k, "#F4F1DC");
      c.strokeStyle = "rgba(255,255,245,0.9)";
      c.lineWidth = 0.7;
      for (const a of [-2.3, -1.57, -0.8]) {
        c.beginPath();
        c.moveTo(px, py);
        c.lineTo(px + Math.cos(a) * 3.6 * k, py + Math.sin(a) * 3.6 * k);
        c.stroke();
      }
    }
  }
}

export function paintFlowerPattern(
  c: CanvasRenderingContext2D,
  v: Variant,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
) {
  const head = rx === ry;
  if (v.pattern === "seeds") {
    const pal = v.shiny ? SEEDS.shiny : SEEDS.normal;
    if (head) paintSeedHead(c, pal, cx, cy, rx);
    else paintLeafWing(c, pal);
  } else if (v.pattern === "cactus") {
    paintCactus(c, v.shiny ? RIBS.shiny : RIBS.normal, cx, cy, rx, ry);
  }
}
