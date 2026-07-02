// Visual dressing for the typhoon minigame: stormy parallax sea, rain,
// lightning, floating score popups, impact sparks and the pixel-text helper.
// Everything draws into the low-res canvas (LW x LH).

import { LH, LW, type RunState } from "./run";

export function pixelText(
  ctx: CanvasRenderingContext2D,
  txt: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = "center",
) {
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillText(txt, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(txt, x, y);
}

// ---- background ----

// per-act mood: sky gradient darkens and the sea gets angrier
const SKY: [string, string][] = [
  ["#14304a", "#0a1c30"],
  ["#0e2236", "#060f1e"],
  ["#0a1424", "#03060e"],
];
const SEA: [string, string][] = [
  ["#0d3a56", "#082a42"],
  ["#0a2e46", "#061f32"],
  ["#08202f", "#041018"],
];

let lightningT = 0; // seconds until next flash
let lightningA = 0; // current flash alpha

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  run: RunState,
  t: number,
  dt: number,
) {
  const act = Math.min(run.act, 2);
  const horizon = LH * 0.32;

  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, SKY[act][0]);
  sky.addColorStop(1, SKY[act][1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, LW, horizon);

  const sea = ctx.createLinearGradient(0, horizon, 0, LH);
  sea.addColorStop(0, SEA[act][0]);
  sea.addColorStop(1, SEA[act][1]);
  ctx.fillStyle = sea;
  ctx.fillRect(0, horizon, LW, LH - horizon);

  // storm clouds drifting slowly
  ctx.fillStyle = act === 0 ? "rgba(30,55,80,0.55)" : "rgba(15,28,45,0.7)";
  for (let i = 0; i < 5; i++) {
    const cx = ((((i * 137 - run.scroll * 0.12) % (LW + 120)) + LW + 120) % (LW + 120)) - 60;
    const cy = 16 + ((i * 53) % 40);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 46, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // parallax wave bands: 3 layers of sine strips, faster in front
  for (let layer = 0; layer < 3; layer++) {
    const speed = 0.4 + layer * 0.45;
    const y0 = horizon + 14 + layer * ((LH - horizon - 30) / 2.4);
    const amp = 2.5 + layer * 2 + act * 1.2;
    ctx.fillStyle = `rgba(120,190,230,${0.1 + layer * 0.07})`;
    ctx.beginPath();
    ctx.moveTo(0, LH);
    for (let x = 0; x <= LW; x += 8) {
      const yy = y0 + Math.sin((x + run.scroll * speed) * 0.03 + layer * 2 + t * 1.5) * amp;
      ctx.lineTo(x, yy);
    }
    ctx.lineTo(LW, LH);
    ctx.closePath();
    ctx.fill();
  }

  // rain from act 2 on
  if (act >= 1) {
    ctx.strokeStyle = "rgba(170,210,240,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const n = act === 1 ? 40 : 70;
    for (let i = 0; i < n; i++) {
      const rx = (i * 97 + ((t * 320) % LW) * (0.7 + (i % 3) * 0.2)) % LW;
      const ry = (i * 61 + t * 340) % LH;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 2, ry + 7);
    }
    ctx.stroke();
  }

  // lightning flashes in acts 2 and 3
  if (act >= 1) {
    lightningT -= dt;
    if (lightningT <= 0) {
      lightningT = 3 + Math.random() * (act === 1 ? 6 : 3.5);
      lightningA = 0.5;
    }
    if (lightningA > 0.01) {
      ctx.fillStyle = `rgba(220,235,255,${lightningA})`;
      ctx.fillRect(0, 0, LW, LH);
      lightningA *= Math.exp(-9 * dt);
    }
  } else {
    lightningA = 0;
  }
}

// ---- popups (+50, +100...) ----

export interface Popup {
  x: number;
  y: number;
  txt: string;
  color: string;
  life: number; // 1 -> 0
}

export function addPopup(popups: Popup[], x: number, y: number, txt: string, color: string) {
  if (popups.length > 30) return;
  popups.push({ x, y, txt, color, life: 1 });
}

export function updatePopups(popups: Popup[], dt: number) {
  for (let i = popups.length - 1; i >= 0; i--) {
    const p = popups[i];
    p.y -= 22 * dt;
    p.life -= dt * 1.2;
    if (p.life <= 0) popups.splice(i, 1);
  }
}

export function drawPopups(ctx: CanvasRenderingContext2D, popups: Popup[]) {
  for (const p of popups) {
    ctx.globalAlpha = Math.min(1, p.life * 2);
    pixelText(ctx, p.txt, p.x, p.y, 8, p.color);
  }
  ctx.globalAlpha = 1;
}

// ---- sparks (grazes, hits, pickups) ----

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export function burstSparks(
  sparks: Spark[],
  x: number,
  y: number,
  color: string,
  n = 6,
  power = 60,
) {
  if (sparks.length > 150) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = power * (0.4 + Math.random() * 0.6);
    sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color });
  }
}

export function updateSparks(sparks: Spark[], dt: number) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += 90 * dt;
    s.life -= dt * 2.2;
    if (s.life <= 0) sparks.splice(i, 1);
  }
}

export function drawSparks(ctx: CanvasRenderingContext2D, sparks: Spark[]) {
  for (const s of sparks) {
    ctx.globalAlpha = Math.max(0, s.life);
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
  }
  ctx.globalAlpha = 1;
}

// flashing arcade WARNING band across the middle of the screen
export function drawWarning(ctx: CanvasRenderingContext2D, t: number, label = "WARNING") {
  const y0 = LH / 2 - 16;
  const on = Math.floor(t * 6) % 2 === 0;
  ctx.fillStyle = on ? "rgba(200,30,30,0.4)" : "rgba(200,30,30,0.25)";
  ctx.fillRect(0, y0, LW, 32);
  ctx.fillStyle = "rgba(255,220,60,0.85)";
  const off = (t * 60) % 24;
  for (let x = -24; x < LW; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x + off, y0);
    ctx.lineTo(x + off + 8, y0);
    ctx.lineTo(x + off + 2, y0 + 3);
    ctx.lineTo(x + off - 6, y0 + 3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + off, y0 + 32);
    ctx.lineTo(x + off + 8, y0 + 32);
    ctx.lineTo(x + off + 2, y0 + 29);
    ctx.lineTo(x + off - 6, y0 + 29);
    ctx.closePath();
    ctx.fill();
  }
  if (on) pixelText(ctx, label, LW / 2, y0 + 16, 14, "#ffdd55");
}

// the arrival buoy line: a checkered pole bobbing on the waves
export function drawFinishLine(ctx: CanvasRenderingContext2D, x: number, t: number) {
  const bob = Math.sin(t * 2.4) * 2;
  ctx.fillStyle = "#e8e8e8";
  ctx.fillRect(x - 1, 40 + bob, 3, LH - 70);
  for (let y = 40; y < LH - 34; y += 8) {
    ctx.fillStyle = ((y / 8) | 0) % 2 === 0 ? "#111" : "#e8e8e8";
    ctx.fillRect(x - 4, y + bob, 9, 4);
  }
  pixelText(ctx, "ARRIVEE", x, 28 + bob, 8, "#ffe066");
}

// scanline + vignette overlay, rebuilt at screen resolution on resize and
// blitted over the upscaled frame for the CRT feel
export function buildScanlines(w: number, h: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const c = cv.getContext("2d")!;
  c.fillStyle = "rgba(0,0,0,0.16)";
  for (let y = 0; y < h; y += 3) c.fillRect(0, y, w, 1);
  const vg = c.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.42,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.72,
  );
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.45)");
  c.fillStyle = vg;
  c.fillRect(0, 0, w, h);
  return cv;
}
