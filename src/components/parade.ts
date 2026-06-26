// Parade mode: a clickable pennant (right of the shop) arranges every duck in
// an evenly-spaced ring that rotates around the pool centre for PARADE_MS, then
// releases them. Ducks steer toward their (moving) slot on the ring.

export interface ParadeState {
  active: boolean;
  start: number; // performance.now() when it began
  count: number; // number of ducks in the ring (for even spacing)
}

export const PARADE_MS = 10_000;
const SPIN = 0.5; // ring rotation speed (rad/s)

export function makeParade(): ParadeState {
  return { active: false, start: 0, count: 0 };
}

// Pennant geometry, anchored to the ground line just right of the shop.
export function paradeButton(h: number) {
  return { x: 112, baseY: h - 22, height: 46 };
}

export function overParade(px: number, py: number, h: number): boolean {
  const b = paradeButton(h);
  return px >= b.x - 14 && px <= b.x + 30 && py >= b.baseY - b.height - 8 && py <= b.baseY + 8;
}

// Target position for the i-th duck on the rotating ring.
export function paradeSlot(p: ParadeState, now: number, i: number, w: number, h: number) {
  const r = Math.min(w, h) * 0.3;
  const rot = ((now - p.start) / 1000) * SPIN;
  const ang = rot + (i / Math.max(1, p.count)) * Math.PI * 2;
  return { x: w / 2 + Math.cos(ang) * r, y: h / 2 + Math.sin(ang) * r };
}

export function drawParade(
  ctx: CanvasRenderingContext2D,
  p: ParadeState,
  now: number,
  hover: boolean,
  h: number,
  dark: boolean,
) {
  const b = paradeButton(h);
  const topY = b.baseY - b.height;
  const lit = p.active || hover;

  if (lit) {
    const col = p.active ? "255,200,60" : "150,205,255";
    const pulse = p.active ? 0.3 + Math.sin(now * 0.008) * 0.12 : 0.2;
    const g = ctx.createRadialGradient(b.x + 8, topY + 8, 2, b.x + 8, topY + 8, 44);
    g.addColorStop(0, `rgba(${col},${pulse})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(b.x - 40, topY - 40, 96, 100);
  }

  // pole + finial
  ctx.fillStyle = dark ? "#8a6b3f" : "#a9824d";
  ctx.fillRect(b.x - 1.5, topY, 3, b.height);
  ctx.fillStyle = lit ? "#ffe066" : dark ? "#c9a256" : "#d9b772";
  ctx.beginPath();
  ctx.arc(b.x, topY - 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // waving triangular pennant
  const wave = Math.sin(now * (p.active ? 0.012 : 0.005));
  const flagLen = 26;
  const flagH = 17;
  ctx.fillStyle = dark ? "#c0395a" : "#E0457B";
  ctx.beginPath();
  ctx.moveTo(b.x + 1.5, topY + 1);
  ctx.quadraticCurveTo(
    b.x + flagLen * 0.5,
    topY + 1 + wave * 3,
    b.x + flagLen,
    topY + flagH * 0.5 + wave * 4,
  );
  ctx.lineTo(b.x + 1.5, topY + flagH);
  ctx.closePath();
  ctx.fill();

  // white star on the pennant
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  const sx = b.x + 9;
  const sy = topY + flagH * 0.5 + wave * 2;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
    const x = sx + Math.cos(a) * 4;
    const y = sy + Math.sin(a) * 4;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // countdown bar while running
  if (p.active) {
    const prog = Math.min(1, (now - p.start) / PARADE_MS);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(b.x - 10, b.baseY + 3, 26, 3);
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(b.x - 10, b.baseY + 3, 26 * (1 - prog), 3);
  }
}
