import { drawAccessory } from "./duckAccessories";
import { fillEll } from "./duckDraw";
import { bodyFill, paintPattern } from "./duckPatterns";
import type { Variant } from "./duckTypes";

export type { Accessory, Effect, Pattern, Variant } from "./duckTypes";

// Sprite canvas dimensions and the base body/head geometry. PixelPool reads
// SW/SH to keep on-screen ducks at the sprite's aspect ratio.
export const SW = 130;
export const SH = 120;
const BODY = { cx: 56, cy: 82, rx: 46, ry: 32 };
const HEAD = { cx: 82, cy: 44, r: 32 };

// Build a smoothly-shaded rubber-duck sprite (facing right): base silhouette,
// then the variant's pattern overlay, beak, eye, and accessory.
export function makeDuckSprite(v: Variant): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = SW;
  cv.height = SH;
  const c = cv.getContext("2d")!;
  c.imageSmoothingEnabled = true;

  const fill = bodyFill(c, v);

  // soft dark rim behind the silhouette for definition
  const rim = "rgba(70,45,0,0.20)";
  fillEll(c, BODY.cx, BODY.cy + 2, BODY.rx + 2.5, BODY.ry + 2.5, rim);
  fillEll(c, HEAD.cx, HEAD.cy + 2, HEAD.r + 2.5, HEAD.r + 2.5, rim);

  // tail (back-left)
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(16, 70);
  c.quadraticCurveTo(0, 60, 14, 54);
  c.quadraticCurveTo(26, 60, 30, 74);
  c.closePath();
  c.fill();

  // ---- BODY ----
  fillEll(c, BODY.cx, BODY.cy, BODY.rx, BODY.ry, fill);
  c.save();
  c.beginPath();
  c.ellipse(BODY.cx, BODY.cy, BODY.rx, BODY.ry, 0, 0, Math.PI * 2);
  c.clip();
  let g = c.createRadialGradient(62, 106, 4, 62, 106, 48);
  g.addColorStop(0, "rgba(0,0,0,0.34)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  fillEll(c, 62, 106, 48, 32, g);
  g = c.createRadialGradient(94, 88, 4, 94, 88, 40);
  g.addColorStop(0, "rgba(0,0,0,0.16)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  fillEll(c, 94, 88, 40, 30, g);
  g = c.createRadialGradient(34, 62, 2, 34, 62, 40);
  g.addColorStop(0, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  fillEll(c, 34, 62, 36, 24, g);
  c.restore();
  paintPattern(c, v, BODY.cx, BODY.cy, BODY.rx, BODY.ry);

  // wing seam
  c.strokeStyle = "rgba(0,0,0,0.15)";
  c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(58, 70);
  c.quadraticCurveTo(88, 74, 84, 100);
  c.stroke();

  // ---- HEAD ----
  fillEll(c, HEAD.cx, HEAD.cy, HEAD.r, HEAD.r, fill);
  c.save();
  c.beginPath();
  c.ellipse(HEAD.cx, HEAD.cy, HEAD.r, HEAD.r, 0, 0, Math.PI * 2);
  c.clip();
  let h = c.createRadialGradient(90, 64, 3, 90, 64, 36);
  h.addColorStop(0, "rgba(0,0,0,0.30)");
  h.addColorStop(1, "rgba(0,0,0,0)");
  fillEll(c, 90, 64, 36, 28, h);
  h = c.createRadialGradient(66, 26, 2, 66, 26, 30);
  h.addColorStop(0, "rgba(255,255,255,0.85)");
  h.addColorStop(1, "rgba(255,255,255,0)");
  fillEll(c, 66, 27, 26, 22, h);
  h = c.createRadialGradient(72, 20, 0, 72, 20, 9);
  h.addColorStop(0, "rgba(255,255,255,0.95)");
  h.addColorStop(1, "rgba(255,255,255,0)");
  fillEll(c, 72, 20, 9, 9, h);
  c.restore();
  paintPattern(c, v, HEAD.cx, HEAD.cy, HEAD.r, HEAD.r);

  // ---- BEAK ----
  const bk = c.createLinearGradient(0, 46, 0, 64);
  bk.addColorStop(0, v.beak === "#2A2A2A" ? "#3a3a3a" : "#FBA94C");
  bk.addColorStop(1, v.beak === "#2A2A2A" ? "#1f1f1f" : v.beak);
  c.fillStyle = bk;
  c.beginPath();
  c.moveTo(103, 48);
  c.quadraticCurveTo(129, 47, 123, 56);
  c.quadraticCurveTo(117, 62, 102, 59);
  c.closePath();
  c.fill();
  c.strokeStyle = "rgba(120,50,0,0.45)";
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(105, 55);
  c.quadraticCurveTo(115, 56, 121, 55);
  c.stroke();

  // ---- EYE ---- (shades hide it; zombie/metal restyle it)
  if (v.acc !== "shades") {
    if (v.pattern === "zombie") {
      c.strokeStyle = "#1a2a14";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(92, 34);
      c.lineTo(100, 42);
      c.moveTo(100, 34);
      c.lineTo(92, 42);
      c.stroke();
    } else if (v.pattern === "metal") {
      fillEll(c, 96, 38, 5.2, 5.2, "#10202a");
      fillEll(c, 96, 38, 2.6, 2.6, "#FF5C5C");
      fillEll(c, 95, 37, 1, 1, "#ffd0d0");
    } else {
      fillEll(c, 96, 38, 4.7, 5.3, "#181818");
      fillEll(c, 94.4, 35.8, 1.7, 1.9, "#ffffff");
    }
  }

  drawAccessory(c, v);

  return cv;
}
