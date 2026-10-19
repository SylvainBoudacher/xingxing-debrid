import { fillEll } from "./duckDraw";
import type { Variant } from "./duckTypes";

// Coiffes des trois canards fleurs, dans l'espace du sprite (tête centrée en
// 82,44, rayon 32). La crinière du Tournesol passe derrière la tête: elle est
// dessinée par drawBehindHead avant la tête, le reste par drawFlowerAccessory.

const HEAD_X = 82;
const HEAD_Y = 44;

// Palettes normale / shiny de chaque coiffe.
const DAISY = {
  normal: {
    petal: "#FFFFFF",
    rim: "rgba(150,135,185,0.55)",
    heart: ["#FFF08A", "#F2B416"],
    cheek: "rgba(255,150,175,0.55)",
  },
  shiny: {
    petal: "#FFB8D0",
    rim: "rgba(205,80,140,0.6)",
    heart: ["#FFE9A0", "#E8A317"],
    cheek: "rgba(240,90,140,0.6)",
  },
};
const MANE = {
  normal: { back: "#E0801A", front: "#FFC928", shine: "rgba(255,245,190,0.7)" },
  shiny: { back: "#5E1830", front: "#B8324A", shine: "rgba(255,180,150,0.6)" },
};
const CACTUS_FLOWER = {
  normal: {
    outer: "#E8327E",
    rim: "rgba(140,20,70,0.35)",
    inner: "#FF7DB6",
    heart: "#FFE066",
    dots: "#F59E0B",
    stem: "#5FA34A",
    bud: "#FF7DB6",
  },
  shiny: {
    outer: "#EEEAFF",
    rim: "rgba(110,100,190,0.45)",
    inner: "#FFFFFF",
    heart: "#FFF3B0",
    dots: "#E8C547",
    stem: "#6FA3B8",
    bud: "#EEEAFF",
  },
};
const paletteOf = <T>(p: { normal: T; shiny: T }, v: Variant) => (v.shiny ? p.shiny : p.normal);

// Pétale en ellipse, posé le long de l'angle a à partir du point (x, y).
function petal(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  a: number,
  len: number,
  width: number,
  style: string,
  stroke?: string,
) {
  c.save();
  c.translate(x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5);
  c.rotate(a);
  c.fillStyle = style;
  c.beginPath();
  c.ellipse(0, 0, len / 2, width / 2, 0, 0, Math.PI * 2);
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 0.8;
    c.stroke();
  }
  c.restore();
}

// Marguerite: pétales cerclés (sinon ils disparaissent sur le corps clair),
// cœur jaune bombé.
function daisy(
  c: CanvasRenderingContext2D,
  pal: (typeof DAISY)["normal"],
  x: number,
  y: number,
  r: number,
  tilt = 0,
) {
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = tilt + (i / n) * Math.PI * 2;
    petal(c, x, y, a, r, r * 0.42, pal.petal, pal.rim);
  }
  const g = c.createRadialGradient(x - r * 0.12, y - r * 0.12, 0, x, y, r * 0.34);
  g.addColorStop(0, pal.heart[0]);
  g.addColorStop(1, pal.heart[1]);
  fillEll(c, x, y, r * 0.34, r * 0.34, g);
}

function leaf(c: CanvasRenderingContext2D, x: number, y: number, a: number, len: number) {
  petal(c, x, y, a, len, len * 0.45, "#5E9E3A");
  c.strokeStyle = "rgba(255,255,255,0.35)";
  c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + Math.cos(a) * len * 0.85, y + Math.sin(a) * len * 0.85);
  c.stroke();
}

function drawDaisyCrown(c: CanvasRenderingContext2D, v: Variant) {
  const pal = paletteOf(DAISY, v);
  // tige tressée qui suit le front, comme la couronne de laurier de Zeus
  c.strokeStyle = "#4F8A30";
  c.lineWidth = 2.6;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(54, 25);
  c.quadraticCurveTo(80, 4, 106, 25);
  c.stroke();
  for (const [x, y, a] of [
    [60, 19, -2.4],
    [74, 12, -1.9],
    [90, 12, -1.2],
    [102, 19, -0.6],
  ] as const)
    leaf(c, x, y, a, 8);

  // quatre petites marguerites le long de la tige, une grande piquée à l'arrière
  daisy(c, pal, 70, 13, 8, 0.3);
  daisy(c, pal, 86, 11, 9, 0.1);
  daisy(c, pal, 100, 17, 7, 0.5);
  daisy(c, pal, 57, 19, 13, 0.2);

  // joues roses, sous l'oeil
  fillEll(c, 92, 51, 5.5, 3.6, pal.cheek);
}

// Tournesol: double rangée de pétales en crinière autour de la tête.
function drawSunflowerMane(c: CanvasRenderingContext2D, v: Variant) {
  const pal = paletteOf(MANE, v);
  const n = 22;
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2;
    petal(c, HEAD_X + Math.cos(a) * 24, HEAD_Y + Math.sin(a) * 24, a, 21, 9, pal.back);
  }
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    petal(c, HEAD_X + Math.cos(a) * 24, HEAD_Y + Math.sin(a) * 24, a, 18, 8.5, pal.front);
    petal(c, HEAD_X + Math.cos(a) * 27, HEAD_Y + Math.sin(a) * 27, a, 9, 2.6, pal.shine);
  }
}

// Cactus: fleur rose en coupe sur le haut de la tête, et un bouton à côté.
function drawCactusFlower(c: CanvasRenderingContext2D, v: Variant) {
  const pal = paletteOf(CACTUS_FLOWER, v);
  const x = 76;
  const y = 14;
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI + 0.1 + (i / 8) * (Math.PI - 0.2);
    petal(c, x, y, a, 23, 10, pal.outer, pal.rim);
  }
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI + 0.4 + (i / 6) * (Math.PI - 0.8);
    petal(c, x, y, a, 16, 8, pal.inner);
  }
  fillEll(c, x, y - 1.5, 6.5, 4, pal.heart);
  for (const [dx, dy] of [
    [-3.4, -3],
    [0, -4.6],
    [3.4, -3],
    [-1.6, -1],
    [1.6, -1],
  ])
    fillEll(c, x + dx, y + dy, 1.2, 1.2, pal.dots);

  // bouton: une petite excroissance verte coiffée de rose
  fillEll(c, 101, 18, 6, 6.5, pal.stem);
  fillEll(c, 101, 12.5, 4.2, 4.6, pal.bud);
  fillEll(c, 100, 11, 1.4, 1.4, "rgba(255,255,255,0.6)");
}

export function drawBehindHead(c: CanvasRenderingContext2D, v: Variant) {
  if (v.acc === "sunflower") drawSunflowerMane(c, v);
}

export function drawFlowerAccessory(c: CanvasRenderingContext2D, v: Variant) {
  if (v.acc === "daisy") drawDaisyCrown(c, v);
  else if (v.acc === "cactusflower") drawCactusFlower(c, v);
}
