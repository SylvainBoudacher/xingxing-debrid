import type { EffectFrame } from "./duckRewardEffects";

// Animations des trois canards fleurs. Chaque espèce a une routine derrière le
// canard (Back) et une devant (Front). flip vaut -1 quand le canard nage vers
// la gauche: les effets accrochés à la tête doivent le suivre. En shiny, chaque
// espèce passe sur sa propre palette (pâquerette rose, tournesol de lune,
// reine de la nuit) au lieu du filtre irisé commun.

export interface FlowerFrame extends EffectFrame {
  flip: number;
  shiny: boolean;
}

const pick = <T>(f: FlowerFrame, p: { normal: T; shiny: T }) => (f.shiny ? p.shiny : p.normal);

// Tailles réglées sur un mythique de la piscine (DUCK_BASE 119, échelle 1.5).
const REF_H = 119 * 1.5;

const headX = (f: FlowerFrame) => f.cx + f.flip * f.dw * 0.13;
const headY = (f: FlowerFrame) => f.cy + f.dh * 0.01;
const waterY = (f: FlowerFrame) => f.cy + f.dh * 0.42;

function glow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rgb: string,
  alpha: number,
) {
  const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function twinkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const w = Math.max(0.8, r * 0.28);
  ctx.fillStyle = color;
  ctx.fillRect(x - r, y - w / 2, r * 2, w);
  ctx.fillRect(x - w / 2, y - r, w, r * 2);
}

function petalShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  a: number,
  len: number,
  width: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.ellipse(0, 0, len / 2, width / 2, 0, 0, Math.PI * 2);
  ctx.restore();
}

// --- Marguerite -----------------------------------------------------------

const DAISY = {
  normal: {
    halo: "255,238,160",
    corolla: ["rgba(255,244,190,0.8)", "rgba(255,255,255,0.72)", "rgba(255,255,255,0.55)"],
    corollaRim: "rgba(190,175,225,0.45)",
    petal: "#FFFFFF",
    petalRim: "rgba(160,140,200,0.7)",
    heart: "#F7C72E",
    ripple: "255,255,255",
    sparkle: "255,248,200",
  },
  shiny: {
    halo: "255,170,205",
    corolla: ["rgba(255,225,160,0.8)", "rgba(255,190,215,0.75)", "rgba(255,170,205,0.6)"],
    corollaRim: "rgba(210,90,150,0.45)",
    petal: "#FFB8D0",
    petalRim: "rgba(205,80,140,0.7)",
    heart: "#F2B416",
    ripple: "255,200,225",
    sparkle: "255,220,235",
  },
};

// Grande corolle qui tourne lentement dans un halo beurre frais.
export function drawDaisyBack(f: FlowerFrame) {
  const { ctx, cx, cy, dw, t, phase } = f;
  const pal = pick(f, DAISY);
  glow(ctx, cx, cy, dw * 1.1, pal.halo, 0.3 + Math.sin(t * 0.003 + phase) * 0.08);

  const n = 16;
  const rot = t * 0.00012 + phase;
  const fill = ctx.createRadialGradient(cx, cy, dw * 0.3, cx, cy, dw * 0.95);
  fill.addColorStop(0, pal.corolla[0]);
  fill.addColorStop(0.45, pal.corolla[1]);
  fill.addColorStop(1, pal.corolla[2]);
  ctx.fillStyle = fill;
  ctx.strokeStyle = pal.corollaRim;
  ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const len = dw * 0.52 * (1 + Math.sin(t * 0.002 + i * 1.7) * 0.05);
    const d = dw * 0.4 + len / 2;
    petalShape(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, a, len, dw * 0.16);
    ctx.fill();
    ctx.stroke();
  }
}

const DAISY_SPOTS: [number, number][] = [
  [-0.68, 0.02],
  [0.62, 0.05],
  [-0.2, 0.1],
];

function waterDaisy(
  ctx: CanvasRenderingContext2D,
  pal: (typeof DAISY)["normal"],
  x: number,
  y: number,
  r: number,
) {
  ctx.fillStyle = pal.petal;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(
      x + Math.cos(a) * r * 0.55,
      y + Math.sin(a) * r * 0.27,
      r * 0.5,
      r * 0.2,
      a * 0.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.fillStyle = pal.heart;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.28, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Il s'effeuille: des pétales quittent sa couronne et tombent en virevoltant,
// pendant que de petites marguerites éclosent sur l'eau autour de lui.
export function drawDaisyFront(f: FlowerFrame) {
  const { ctx, cx, cy, dw, dh, t, phase, flip } = f;
  const pal = pick(f, DAISY);
  const s = dh / REF_H;
  const sx = cx + flip * dw * 0.05;
  const sy = cy - dh * 0.3;
  const wy = waterY(f);

  for (let i = 0; i < 6; i++) {
    const p = (t * 0.00018 + phase + i / 6) % 1;
    const side = i % 2 ? -1 : 1;
    const x = sx + side * p * dw * 0.42 + Math.sin(p * 7 + i) * dw * 0.12;
    const y = sy + p * (wy - sy);
    ctx.globalAlpha = Math.min(1, p * 8) * (p > 0.85 ? (1 - p) / 0.15 : 1);
    ctx.fillStyle = pal.petal;
    ctx.strokeStyle = pal.petalRim;
    ctx.lineWidth = 0.8;
    // l'ellipse s'aplatit au rythme de la rotation: le pétale tourne sur lui-même
    const spin = Math.abs(Math.cos(t * 0.006 + i * 2));
    petalShape(ctx, x, y, p * 8 + i, 19 * s, 7 * s * (0.35 + spin * 0.65));
    ctx.fill();
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (let j = 0; j < DAISY_SPOTS.length; j++) {
    const [ox, oy] = DAISY_SPOTS[j];
    const q = (t * 0.00022 + phase * 0.3 + j / DAISY_SPOTS.length) % 1;
    const x = cx + ox * dw;
    const y = wy + oy * dh;
    // éclosion avec un léger dépassement, puis fonte dans l'eau
    const grow = q < 0.18 ? Math.sin((q / 0.18) * Math.PI * 0.62) / 0.93 : 1;
    const scale = q > 0.8 ? (1 - q) / 0.2 : grow;
    if (q < 0.3) {
      const rq = q / 0.3;
      ctx.strokeStyle = `rgba(${pal.ripple},${0.5 * (1 - rq)})`;
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.ellipse(x, y, dw * 0.2 * rq, dw * 0.07 * rq, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    waterDaisy(ctx, pal, x, y, dw * 0.1 * scale);
  }

  for (let i = 0; i < 5; i++) {
    const a = t * 0.0009 + i * ((Math.PI * 2) / 5) + phase;
    const tw = (Math.sin(t * 0.006 + i * 2.2) + 1) / 2;
    twinkle(
      ctx,
      cx + Math.cos(a) * dw * 0.62,
      cy + Math.sin(a) * dh * 0.48,
      (1.2 + tw * 2.6) * s,
      `rgba(${pal.sparkle},${0.3 + tw * 0.6})`,
    );
  }
}

// --- Tournesol ------------------------------------------------------------

// Position du petit soleil: il traverse le ciel au-dessus du canard, d'un
// horizon à l'autre, puis repart en sens inverse.
function sunPos(f: FlowerFrame) {
  const a = -Math.PI / 2 + Math.sin(f.t * 0.00035 + f.phase) * 1.2;
  return { x: f.cx + Math.cos(a) * f.dw * 0.95, y: f.cy - f.dh * 0.05 + Math.sin(a) * f.dh * 0.8 };
}

const SUNFLOWER = {
  normal: {
    halo: "255,196,60",
    beam: "255,214,90",
    seed: "#5A3515",
    pollen: ["#FFF3A8", "#FFD84A"],
    mote: "255,220,90",
  },
  shiny: {
    halo: "140,160,255",
    beam: "200,215,255",
    seed: "#2A1020",
    pollen: ["#EEF2FF", "#B8C8FF"],
    mote: "210,222,255",
  },
};

function drawSun(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number) {
  glow(ctx, x, y, 24 * s, "255,210,80", 0.55);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 0.001);
  ctx.fillStyle = "#FFB627";
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(-2.4 * s, -9 * s);
    ctx.lineTo(0, -15 * s);
    ctx.lineTo(2.4 * s, -9 * s);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = "#FFE45C";
  ctx.beginPath();
  ctx.arc(x, y, 8 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.arc(x - 2.4 * s, y - 2.4 * s, 2.6 * s, 0, Math.PI * 2);
  ctx.fill();
}

// Croissant de lune argenté, entouré de petites étoiles qui clignotent.
function drawMoon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number) {
  glow(ctx, x, y, 26 * s, "200,215,255", 0.5);
  const r = 10 * s;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(x - r, y - r, r * 2, r * 2);
  ctx.arc(x + r * 0.5, y - r * 0.3, r * 0.82, 0, Math.PI * 2);
  ctx.fillStyle = "#EEF2FB";
  ctx.fill("evenodd");
  ctx.restore();
  for (let i = 0; i < 4; i++) {
    const a = i * 1.7 + 0.6;
    const tw = (Math.sin(t * 0.005 + i * 2.3) + 1) / 2;
    twinkle(
      ctx,
      x + Math.cos(a) * r * 2.3,
      y + Math.sin(a) * r * 1.9,
      (0.8 + tw * 1.8) * s,
      `rgba(230,236,255,${0.3 + tw * 0.6})`,
    );
  }
}

// Le soleil qui tourne autour de lui, et le faisceau doré qu'il renvoie vers
// ce soleil: comme un vrai tournesol, sa tête le suit. En shiny, c'est une
// lune, et le faisceau passe au bleu argent.
export function drawSunflowerBack(f: FlowerFrame) {
  const { ctx, dw, dh, t, phase } = f;
  const pal = pick(f, SUNFLOWER);
  const s = dh / REF_H;
  const hx = headX(f);
  const hy = headY(f);
  const sun = sunPos(f);

  glow(ctx, hx, hy, dw * 0.95, pal.halo, 0.32 + Math.sin(t * 0.004 + phase) * 0.08);

  const dir = Math.atan2(sun.y - hy, sun.x - hx);
  const reach = Math.hypot(sun.x - hx, sun.y - hy);
  for (let i = -4; i <= 4; i++) {
    const a = dir + i * 0.11;
    const len = reach * (0.8 + Math.sin(t * 0.005 + i * 1.3) * 0.12);
    const half = (2.6 - Math.abs(i) * 0.35) * s;
    const g = ctx.createLinearGradient(hx, hy, hx + Math.cos(a) * len, hy + Math.sin(a) * len);
    g.addColorStop(0, `rgba(${pal.beam},0.5)`);
    g.addColorStop(1, `rgba(${pal.beam},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(hx - Math.sin(a) * half, hy + Math.cos(a) * half);
    ctx.lineTo(hx + Math.cos(a) * len, hy + Math.sin(a) * len);
    ctx.lineTo(hx + Math.sin(a) * half, hy - Math.cos(a) * half);
    ctx.fill();
  }

  if (f.shiny) drawMoon(ctx, sun.x, sun.y, s, t);
  else drawSun(ctx, sun.x, sun.y, s, t);
}

// Une spirale de graines et de pollen s'ouvre en tourbillon depuis son cœur,
// puis se referme; du pollen doré monte doucement (de la poussière d'étoiles
// en shiny).
export function drawSunflowerFront(f: FlowerFrame) {
  const { ctx, dw, dh, t, phase } = f;
  const pal = pick(f, SUNFLOWER);
  const s = dh / REF_H;
  const hx = headX(f);
  const hy = headY(f);

  const q = (t * 0.00012 + phase * 0.1) % 1;
  const open = Math.sin(q * Math.PI) ** 2;
  if (open > 0.02) {
    const arms = 5;
    const beads = 11;
    const rot = t * 0.0007;
    for (let k = 0; k < arms; k++) {
      for (let j = 0; j < beads; j++) {
        const u = j / (beads - 1);
        const d = dw * (0.26 + u * 0.55) * open;
        const a = rot + (k / arms) * Math.PI * 2 + u * 2.2;
        const x = hx + Math.cos(a) * d;
        const y = hy + Math.sin(a) * d * 0.85;
        const r = (3 - u * 1.6) * s;
        ctx.globalAlpha = open * (1 - u * 0.5);
        if (j % 2) {
          ctx.fillStyle = pal.seed;
          ctx.beginPath();
          ctx.ellipse(x, y, r * 1.25, r * 0.75, a, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = pal.pollen[j % 4 ? 0 : 1];
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  for (let i = 0; i < 9; i++) {
    const p = (t * 0.0004 + phase + i * 0.113) % 1;
    const x = hx + Math.sin(t * 0.0012 + i * 2.1 + phase) * dw * 0.5;
    const y = hy + dh * 0.1 - p * dh * 1.1;
    ctx.fillStyle = `rgba(${pal.mote},${0.85 * (1 - p) * Math.min(1, p * 6)})`;
    ctx.beginPath();
    ctx.arc(x, y, (1 + (1 - p) * 1.6) * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Cactus ---------------------------------------------------------------

const CACTUS = {
  normal: {
    halo: "255,120,90",
    disc: ["rgba(255,226,110,0.85)", "rgba(255,140,90,0.75)", "rgba(255,79,139,0.65)"],
    haze: "255,236,200",
    flash: "255,110,180",
    burst: ["#E8327E", "#FF7DB6", "#FFB3D4"],
  },
  shiny: {
    halo: "120,90,230",
    disc: ["rgba(235,230,255,0.85)", "rgba(150,120,235,0.75)", "rgba(40,50,140,0.7)"],
    haze: "210,220,255",
    flash: "230,235,255",
    burst: ["#FFFFFF", "#E6E0FF", "#BFD4FF"],
  },
};

// Étoiles de la nuit du désert, autour de la lune du shiny.
const NIGHT_STARS: [number, number][] = [
  [-0.95, -0.55],
  [0.9, -0.7],
  [-0.7, -1.05],
  [0.55, -1.1],
  [1.05, 0.05],
  [-1.1, -0.1],
];

// Soleil couchant du désert, rayé façon rétro, et chaleur qui fait onduler
// l'air derrière lui. En shiny, la reine de la nuit fleurit sous une lune
// rayée de violet, au milieu des étoiles.
export function drawCactusBack(f: FlowerFrame) {
  const { ctx, cx, cy, dw, dh, t, phase } = f;
  const pal = pick(f, CACTUS);
  const s = dh / REF_H;
  const sy = cy - dh * 0.08;
  const r = dw * 0.74;

  glow(ctx, cx, sy, r * 1.35, pal.halo, 0.28 + Math.sin(t * 0.0025 + phase) * 0.06);

  // les bandes vides descendent lentement et s'épaississent vers le bas
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - r, sy - r, r * 2, r);
  let y = sy;
  const drift = (t * 0.00006 + phase * 0.1) % 1;
  for (let i = 0; i < 6; i++) {
    const g = sy + ((i + drift) / 6) * r;
    const gap = (1 + ((g - sy) / r) * 5) * s;
    if (g - gap / 2 > y) ctx.rect(cx - r, y, r * 2, g - gap / 2 - y);
    y = g + gap / 2;
  }
  if (y < sy + r) ctx.rect(cx - r, y, r * 2, sy + r - y);
  ctx.clip();
  const g = ctx.createLinearGradient(0, sy - r, 0, sy + r);
  g.addColorStop(0, pal.disc[0]);
  g.addColorStop(0.5, pal.disc[1]);
  g.addColorStop(1, pal.disc[2]);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, sy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (f.shiny) {
    for (let i = 0; i < NIGHT_STARS.length; i++) {
      const [ox, oy] = NIGHT_STARS[i];
      const tw = (Math.sin(t * 0.004 + i * 1.9 + phase) + 1) / 2;
      twinkle(
        ctx,
        cx + ox * r,
        sy + oy * r,
        (1 + tw * 2.4) * s,
        `rgba(235,238,255,${0.25 + tw * 0.7})`,
      );
    }
  }

  ctx.lineWidth = 1.4 * s;
  for (let i = 0; i < 4; i++) {
    const p = (t * 0.00015 + phase + i / 4) % 1;
    const ly = waterY(f) - p * dh * 1.15;
    const a = 0.45 * Math.sin(p * Math.PI);
    const haze = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
    haze.addColorStop(0, `rgba(${pal.haze},0)`);
    haze.addColorStop(0.5, `rgba(${pal.haze},${a})`);
    haze.addColorStop(1, `rgba(${pal.haze},0)`);
    ctx.strokeStyle = haze;
    ctx.beginPath();
    for (let k = 0; k <= 16; k++) {
      const x = cx - r + (k / 16) * r * 2;
      const wy = ly + Math.sin(k * 0.9 + t * 0.006 + i) * 2.2 * s;
      if (k === 0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }
}

// Reflets fixes sur les piquants, en fractions de la taille du canard.
const SPINE_GLINTS: [number, number][] = [
  [-0.3, 0.12],
  [-0.05, 0.28],
  [0.18, 0.08],
  [0.1, -0.12],
  [-0.4, 0.3],
  [0.3, -0.02],
];

// La fleur de sa tête éclot par cycles: un flash, puis une gerbe de
// pétales qui s'envole et retombe. Les piquants scintillent entre-temps.
export function drawCactusFront(f: FlowerFrame) {
  const { ctx, cx, cy, dw, dh, t, phase, flip } = f;
  const pal = pick(f, CACTUS);
  const s = dh / REF_H;
  const fx = cx + flip * dw * 0.085;
  const fy = cy - dh * 0.24;

  const q = (t * 0.00014 + phase * 0.1) % 1;
  if (q < 0.14) glow(ctx, fx, fy, dw * 0.35, pal.flash, 0.7 * (1 - q / 0.14));
  if (q < 0.45) {
    const b = q / 0.45;
    const ease = 1 - (1 - b) ** 3;
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI + (i / 11) * Math.PI + Math.sin(i * 7.3) * 0.2;
      const d = dw * (0.35 + (i % 3) * 0.08) * ease;
      const x = fx + Math.cos(a) * d;
      const y = fy + Math.sin(a) * d * 0.8 + b * b * dh * 0.35;
      ctx.globalAlpha = 1 - b;
      ctx.fillStyle = pal.burst[i % pal.burst.length];
      petalShape(ctx, x, y, a + b * 6, 10 * s, 4.5 * s);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  for (let i = 0; i < SPINE_GLINTS.length; i++) {
    const [ox, oy] = SPINE_GLINTS[i];
    const tw = Math.max(0, Math.sin(t * 0.004 + i * 2.7 + phase));
    if (tw < 0.2) continue;
    twinkle(
      ctx,
      cx + flip * ox * dw,
      cy + oy * dh,
      (1 + tw * 3) * s,
      `rgba(255,255,240,${tw * 0.9})`,
    );
  }
}
