// Passive floating lily pads. They rest at fixed spots and only move when a
// duck (or a tennis ball) bumps into them, then spring back. No real physics —
// just an impulse on contact plus a spring pulling them home.

export interface LilyPad {
  fx: number; // resting position as a fraction of pool width/height
  fy: number;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  vr: number; // angular velocity
  rot: number; // notch orientation
  r: number; // radius
  flower: boolean;
}

const LAYOUT: { fx: number; fy: number; r: number; flower: boolean }[] = [
  { fx: 0.2, fy: 0.8, r: 40, flower: true },
  { fx: 0.66, fy: 0.3, r: 32, flower: false },
];

export function makeLilyPads(): LilyPad[] {
  return LAYOUT.map((l) => ({
    ...l,
    baseX: 0,
    baseY: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    vr: 0,
    rot: Math.random() * Math.PI * 2,
  }));
}

// Re-anchor pads when the pool resizes, keeping their relative spot and carrying
// any current offset from base along to the new base.
export function layoutLilyPads(pads: LilyPad[], w: number, h: number) {
  for (const p of pads) {
    const ox = p.x - p.baseX;
    const oy = p.y - p.baseY;
    p.baseX = p.fx * w;
    p.baseY = p.fy * h;
    p.x = p.baseX + ox;
    p.y = p.baseY + oy;
  }
}

export function updateLilyPads(pads: LilyPad[], dt: number) {
  for (const p of pads) {
    // spring back toward the resting spot under heavy water drag
    p.vx += (p.baseX - p.x) * 7 * dt;
    p.vy += (p.baseY - p.y) * 7 * dt;
    const drag = Math.pow(0.06, dt);
    p.vx *= drag;
    p.vy *= drag;
    p.vr *= Math.pow(0.2, dt);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
  }
}

// Push the pad if a mover (duck/ball at mx,my, radius mr, velocity mvx,mvy)
// overlaps it. Returns the contact normal so the caller can also nudge the
// mover, or null when there is no contact.
export function bumpLilyPad(
  p: LilyPad,
  mx: number,
  my: number,
  mvx: number,
  mvy: number,
  mr: number,
): { nx: number; ny: number } | null {
  const dx = p.x - mx;
  const dy = p.y - my;
  const dist = Math.hypot(dx, dy) || 0.001;
  const min = p.r * 0.72 + mr;
  if (dist >= min) return null;
  const nx = dx / dist;
  const ny = dy / dist;
  const speed = Math.hypot(mvx, mvy);
  const push = Math.min(140, 30 + speed * 0.5);
  p.vx += nx * push + mvx * 0.12;
  p.vy += ny * push + mvy * 0.12;
  p.vr += (mvx * ny - mvy * nx) * 0.004 + (Math.random() - 0.5) * 0.6;
  p.x += nx * (min - dist) * 0.4;
  p.y += ny * (min - dist) * 0.4;
  return { nx, ny };
}

function drawFlower(ctx: CanvasRenderingContext2D, r: number, dark: boolean) {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.fillStyle = dark ? "#e7a8c8" : "#ffd0e6";
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, r * 0.5, r * 0.28, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = dark ? "#d9a534" : "#ffd84d";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
}

export function drawLilyPad(ctx: CanvasRenderingContext2D, p: LilyPad, t: number, dark: boolean) {
  const wob = Math.sin(t * 0.0018 + p.fx * 9) * 0.04;
  const r = p.r;

  // contact shadow on the water
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.16, r * 0.96, r * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(p.rot + wob);
  const notch = 0.55; // radians of the wedge gap

  // pad body: green radial with a wedge notch cut out
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
  if (dark) {
    g.addColorStop(0, "#2f7d4f");
    g.addColorStop(1, "#16432a");
  } else {
    g.addColorStop(0, "#5cc878");
    g.addColorStop(1, "#2f8f4e");
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, notch / 2, Math.PI * 2 - notch / 2);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  // rim highlight
  ctx.strokeStyle = dark ? "rgba(150,230,170,0.25)" : "rgba(220,255,225,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r - 1.5, notch / 2, Math.PI * 2 - notch / 2);
  ctx.stroke();

  // radial veins
  ctx.strokeStyle = dark ? "rgba(10,40,20,0.5)" : "rgba(30,110,55,0.45)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 7; i++) {
    const a = notch / 2 + (i + 0.5) * ((Math.PI * 2 - notch) / 7);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86);
    ctx.stroke();
  }

  if (p.flower) drawFlower(ctx, r * 0.3, dark);
  ctx.restore();
}
