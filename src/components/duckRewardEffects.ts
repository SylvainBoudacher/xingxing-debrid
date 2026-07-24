// Les effets des trois canards de récompense de couleurs, partagés entre la
// piscine et les vignettes du Canardex: une carte doit montrer exactement ce
// que le joueur verra à l'eau.

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
