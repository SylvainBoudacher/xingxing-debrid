// Les effets des canards de récompense, partagés entre la piscine et les
// vignettes du Canardex: une carte doit montrer exactement ce que le joueur
// verra à l'eau.

export interface EffectFrame {
  ctx: CanvasRenderingContext2D;
  cx: number;
  cy: number;
  dw: number;
  dh: number;
  t: number;
  phase: number;
}

// --- Caméléon -------------------------------------------------------------

export function chameleonShift(t: number, phase: number): number {
  return (t * 0.00035 + phase * 0.1) % 1;
}

// Sa peau est un arc-en-ciel qui défile, une boucle complète toutes les ~48s.
// Le sprite étant cuit une fois pour toutes, on le recolore dans un canvas
// tampon à chaque frame. Le mode "color" garde la luminosité du sprite, donc
// l'ombrage et les écailles restent lisibles; le "destination-in" final
// redécoupe la silhouette que le dégradé a débordée. Chaque appelant garde son
// propre tampon: piscine et vignettes ne dessinent pas à la même taille.
export function createChameleonSkinner() {
  let scratch: HTMLCanvasElement | null = null;

  return function chameleonSkin(
    sprite: HTMLCanvasElement,
    dw: number,
    dh: number,
    t: number,
    phase: number,
  ): HTMLCanvasElement {
    const w = Math.max(1, Math.ceil(dw));
    const h = Math.max(1, Math.ceil(dh));
    if (!scratch) scratch = document.createElement("canvas");
    if (scratch.width !== w || scratch.height !== h) {
      scratch.width = w;
      scratch.height = h;
    }
    const c = scratch.getContext("2d")!;
    c.clearRect(0, 0, w, h);
    c.globalCompositeOperation = "source-over";
    c.drawImage(sprite, 0, 0, w, h);
    c.globalCompositeOperation = "color";
    const shift = chameleonShift(t, phase);
    const g = c.createLinearGradient(0, h, w, 0);
    for (let k = 0; k <= 6; k++) {
      const p = k / 6;
      g.addColorStop(p, `hsl(${((shift + p * 0.85) * 360) % 360},92%,55%)`);
    }
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "destination-in";
    c.drawImage(sprite, 0, 0, w, h);
    c.globalCompositeOperation = "source-over";
    return scratch;
  };
}

// Halo doux dans la teinte qui traverse sa peau à cet instant.
export function drawChameleonHalo({ ctx, cx, cy, dw, t, phase }: EffectFrame) {
  const hue = chameleonShift(t, phase) * 360;
  const r = dw * 0.9;
  const gr = ctx.createRadialGradient(cx, cy, dw * 0.1, cx, cy, r);
  gr.addColorStop(0, `hsla(${hue},95%,65%,0.28)`);
  gr.addColorStop(1, `hsla(${hue},95%,65%,0)`);
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

// --- Paon -----------------------------------------------------------------

// Roue de plumes à ocelles qui s'ouvre et se referme lentement au repos.
export function drawPeacockFan({ ctx, cx, cy: y, dh, t, phase }: EffectFrame) {
  const cy = y + dh * 0.12;
  const open = 0.72 + Math.sin(t * 0.0012 + phase) * 0.28;
  const feathers = 11;
  const spread = Math.PI * 0.9 * open;
  for (let i = 0; i < feathers; i++) {
    const a = -Math.PI / 2 + (i / (feathers - 1) - 0.5) * spread;
    const len = dh * (0.95 + Math.sin(i * 1.1) * 0.06);
    const tx = cx + Math.cos(a) * len;
    const ty = cy + Math.sin(a) * len;
    ctx.strokeStyle = `hsla(${170 + i * 9},68%,42%,0.85)`;
    ctx.lineWidth = Math.max(1.2, dh * 0.023);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    const tw = (Math.sin(t * 0.004 + i * 1.3 + phase) + 1) / 2;
    const eye = Math.max(2.2, dh * 0.04);
    ctx.fillStyle = `rgba(232,190,60,${0.6 + tw * 0.4})`;
    ctx.beginPath();
    ctx.arc(tx, ty, eye, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(40,90,180,${0.75 + tw * 0.25})`;
    ctx.beginPath();
    ctx.arc(tx, ty, eye * 0.52, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Phénix ---------------------------------------------------------------

// Cycle de renaissance: 0 la plupart du temps, monte à 1 puis retombe sur les
// derniers 10% du cycle (~20s en tout).
export function phoenixBurn(t: number, phase: number): number {
  const cycle = (t * 0.00005 + phase * 0.1) % 1;
  return cycle > 0.9 ? Math.sin(((cycle - 0.9) / 0.1) * Math.PI) : 0;
}

// Halo de chaleur puis deux ailes de flammes arc-en-ciel qui battent.
export function drawPhoenixWings({ ctx, cx, cy, dw, dh, t, phase }: EffectFrame) {
  const burn = phoenixBurn(t, phase);

  const haloR = dw * (1.1 + burn * 0.5);
  const gr = ctx.createRadialGradient(cx, cy, dw * 0.1, cx, cy, haloR);
  gr.addColorStop(0, `rgba(255,190,90,${0.25 + burn * 0.4})`);
  gr.addColorStop(1, "rgba(255,140,40,0)");
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
  ctx.fill();

  const flap = 0.5 + Math.sin(t * 0.0016 + phase) * 0.5;
  const open = 0.62 + flap * 0.38 + burn * 0.5;
  for (const side of [-1, 1]) {
    for (let f = 0; f < 6; f++) {
      const k = f / 5;
      const a = (-0.26 - k * 1.35) * open;
      const len = dh * (0.62 + k * 0.5) * (0.9 + burn * 0.45);
      const bx = cx - side * dw * 0.06;
      const by = cy + dh * 0.04;
      const tx = bx - side * Math.cos(a) * len;
      const ty = by + Math.sin(a) * len;
      const wob = Math.sin(t * 0.005 + f * 1.4 + phase) * len * 0.09;
      const hue = (t * 0.05 + f * 22 + (side > 0 ? 12 : 0)) % 360;
      const g = ctx.createLinearGradient(bx, by, tx, ty);
      g.addColorStop(0, `hsla(${hue},100%,72%,0.85)`);
      g.addColorStop(0.6, `hsla(${(hue + 28) % 360},100%,58%,0.6)`);
      g.addColorStop(1, `hsla(${(hue + 55) % 360},100%,52%,0)`);
      ctx.fillStyle = g;
      const w = dh * 0.1 * (1 - k * 0.35);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx - side * len * 0.45 + wob, by - len * 0.28 - w, tx, ty);
      ctx.quadraticCurveTo(bx - side * len * 0.4, by - len * 0.1 + w, bx, by);
      ctx.fill();
    }
  }
}

// Braises colorées qui montent devant lui.
export function drawPhoenixEmbers({ ctx, cx, cy, dw, dh, t, phase }: EffectFrame) {
  const burn = phoenixBurn(t, phase);
  for (let i = 0; i < 14; i++) {
    const p = (t * 0.0006 + phase + i * 0.071) % 1;
    const ax = cx + Math.sin(t * 0.0015 + i * 2.3 + phase) * dw * 0.6;
    const ay = cy + dh * 0.3 - p * dh * 1.5;
    const hue = (t * 0.05 + i * 40) % 360;
    const r = (0.9 + (1 - p) * 1.5) * (1 + burn * 0.6);
    ctx.fillStyle = `hsla(${hue},100%,72%,${0.8 * (1 - p)})`;
    ctx.beginPath();
    ctx.arc(ax, ay, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Supernova ------------------------------------------------------------

// Les tailles fixes ci-dessous ont été réglées sur le canard de la piscine:
// on les rapporte à sa hauteur pour que la vignette, plus petite, garde les
// mêmes proportions.
const NOVA_REF_H = 119 * 1.15;
const GODLY_REF_H = 119 * 1.7;

// Aura pulsante qui balaie les teintes, derrière lui.
export function drawNovaAura({ ctx, cx, cy, dw, t, phase }: EffectFrame) {
  const hue = (t * 0.05) % 360;
  const pulse = 0.4 + Math.sin(t * 0.005 + phase) * 0.12;
  const gr = ctx.createRadialGradient(cx, cy, dw * 0.1, cx, cy, dw);
  gr.addColorStop(0, `hsla(${hue},95%,70%,${pulse})`);
  gr.addColorStop(1, `hsla(${hue},95%,70%,0)`);
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(cx, cy, dw, 0, Math.PI * 2);
  ctx.fill();
}

// Anneau d'éclats prismatiques incliné + trois comètes à traînée, devant lui.
export function drawNovaOrbit({ ctx, cx, cy, dw, dh, t, phase }: EffectFrame) {
  const s = dh / NOVA_REF_H;
  const hue = (t * 0.05) % 360;
  const shards = 14;
  for (let i = 0; i < shards; i++) {
    const a = t * 0.0012 + (i / shards) * Math.PI * 2;
    const sx = cx + Math.cos(a) * dw * 0.72;
    const sy = cy + Math.sin(a) * dh * 0.32;
    const tw = (Math.sin(t * 0.006 + i * 1.3) + 1) / 2;
    const r = (1.4 + tw * 2.2) * s;
    ctx.fillStyle = `hsla(${(hue + i * 26) % 360},100%,72%,${0.35 + tw * 0.55})`;
    ctx.fillRect(sx - r, sy - 0.7 * s, r * 2, 1.4 * s);
    ctx.fillRect(sx - 0.7 * s, sy - r, 1.4 * s, r * 2);
  }
  for (let i = 0; i < 3; i++) {
    const a = -t * (0.0018 + i * 0.0004) + i * ((Math.PI * 2) / 3) + phase;
    for (let k = 1; k <= 4; k++) {
      const ta = a + k * 0.09;
      const txx = cx + Math.cos(ta) * dw * 0.95;
      const tyy = cy + Math.sin(ta) * dh * 0.8;
      ctx.fillStyle = `hsla(${(hue + i * 120) % 360},100%,75%,${0.5 * (1 - k / 5)})`;
      ctx.beginPath();
      ctx.arc(txx, tyy, 2.2 * s * (1 - k / 6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * dw * 0.95, cy + Math.sin(a) * dh * 0.8, 2.4 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Zeus -----------------------------------------------------------------

// Rayons blanc-or tournants, anneau de nuages d'orage et halo divin, derrière lui.
export function drawGodlyAura({ ctx, cx, cy, dw, dh, t, phase }: EffectFrame) {
  const s = dh / GODLY_REF_H;

  const rot = -t * 0.0003;
  const rays = 16;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const long = i % 2 === 0;
    const len = (long ? dw * 1.45 : dw * 1.0) * (0.95 + Math.sin(t * 0.004 + i) * 0.05);
    const grad = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
    grad.addColorStop(0, "rgba(255,250,210,0.6)");
    grad.addColorStop(1, "rgba(255,250,210,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = (long ? 3.5 : 1.8) * s;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.restore();

  for (let i = 0; i < 6; i++) {
    const a = t * 0.0005 + i * (Math.PI / 3);
    const sx = cx + Math.cos(a) * dw * 0.92;
    const sy = cy + Math.sin(a) * dh * 0.62;
    const puff = (0.9 + Math.sin(t * 0.002 + i * 2.3) * 0.12) * s;
    ctx.fillStyle = "rgba(70,82,104,0.34)";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 13 * puff, 6.5 * puff, 0, 0, Math.PI * 2);
    ctx.ellipse(sx - 9 * puff, sy + 2 * s, 8 * puff, 4.6 * puff, 0, 0, Math.PI * 2);
    ctx.ellipse(sx + 9 * puff, sy + 2 * s, 8 * puff, 4.6 * puff, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const pulse = 0.45 + Math.sin(t * 0.005 + phase) * 0.15;
  const gr = ctx.createRadialGradient(cx, cy, dw * 0.1, cx, cy, dw * 1.1);
  gr.addColorStop(0, `rgba(255,245,190,${pulse})`);
  gr.addColorStop(1, "rgba(255,245,190,0)");
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(cx, cy, dw * 1.1, 0, Math.PI * 2);
  ctx.fill();
}

// Éclairs jetés par rafales (jitter haché, donc déterministe) et étincelles en
// orbite, devant lui.
export function drawGodlyBolts({ ctx, cx, cy, dw, dh, t, phase }: EffectFrame) {
  const s = dh / GODLY_REF_H;
  const tick = (t * 0.004 + phase * 10) | 0;
  for (let i = 0; i < 3; i++) {
    const h0 = Math.sin(tick * 113.9 + i * 71.3);
    if (h0 < 0.35) continue;
    const h1 = Math.sin(tick * 271.7 + i * 53.9);
    const bx = cx + h1 * dw * 0.85;
    const top = cy - dh * 1.05;
    const bottom = cy + dh * 0.25;
    const seg = (bottom - top) / 4;
    ctx.strokeStyle = `rgba(255,255,220,${0.55 + h0 * 0.4})`;
    ctx.lineWidth = 2.2 * s;
    ctx.beginPath();
    ctx.moveTo(bx, top);
    let px = bx;
    for (let k = 1; k <= 4; k++) {
      px += Math.sin(tick * 197.3 + i * 31.7 + k * 87.1) * 9 * s;
      ctx.lineTo(px, top + seg * k);
    }
    ctx.stroke();
    const flash = 10 * s;
    const fg = ctx.createRadialGradient(px, bottom, 0, px, bottom, flash);
    fg.addColorStop(0, `rgba(255,255,240,${0.6 * h0})`);
    fg.addColorStop(1, "rgba(255,255,240,0)");
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(px, bottom, flash, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 10; i++) {
    const a = t * 0.0016 + i * ((Math.PI * 2) / 10) + phase;
    const tw = (Math.sin(t * 0.007 + i * 1.9) + 1) / 2;
    const sx = cx + Math.cos(a) * dw * 0.6;
    const sy = cy + Math.sin(a) * dh * 0.52;
    const r = (1.4 + tw * 3.2) * s;
    ctx.fillStyle = `rgba(255,250,200,${0.35 + tw * 0.6})`;
    ctx.fillRect(sx - r, sy - 0.7 * s, r * 2, 1.4 * s);
    ctx.fillRect(sx - 0.7 * s, sy - r, 1.4 * s, r * 2);
  }
}
