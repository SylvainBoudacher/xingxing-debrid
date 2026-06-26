// Tennis-ball cannon perched in the top-left corner. Click the hub to "climb
// in" (load it): the barrel then tracks the cursor. Right-click fires a ball.
// Click the hub again to climb out.

export interface TennisBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number; // 1 -> 0, removed when it hits 0 or the ball stalls
  angle: number; // visual spin
  spin: number;
}

export interface CannonState {
  loaded: boolean; // player is in the cannon, armed to fire
  angle: number; // barrel angle, follows the cursor while loaded
  recoil: number; // 0..1, decays after each shot
  cooldown: number; // seconds until the next shot is allowed
}

const PIVOT = { x: 54, y: 54 };
const BASE_R = 21;
const BARREL_LEN = 48;
const BARREL_W = 18;
export const BALL_R = 9;

export function makeCannon(): CannonState {
  return { loaded: false, angle: 0.6, recoil: 0, cooldown: 0 };
}

export function cannonPivot() {
  return PIVOT;
}

export function overCannon(px: number, py: number): boolean {
  return Math.hypot(px - PIVOT.x, py - PIVOT.y) <= BASE_R + 14;
}

// Aim the barrel toward a point, clamped so the muzzle always sweeps the pool
// instead of pointing back into the corner.
export function aimCannon(c: CannonState, px: number, py: number) {
  const a = Math.atan2(py - PIVOT.y, px - PIVOT.x);
  c.angle = Math.max(-0.25, Math.min(Math.PI * 0.85, a));
}

export function fireCannon(c: CannonState): TennisBall {
  c.recoil = 1;
  c.cooldown = 0.28;
  const speed = 680;
  const reach = BARREL_LEN + BALL_R;
  return {
    x: PIVOT.x + Math.cos(c.angle) * reach,
    y: PIVOT.y + Math.sin(c.angle) * reach,
    vx: Math.cos(c.angle) * speed,
    vy: Math.sin(c.angle) * speed,
    r: BALL_R,
    life: 1,
    angle: 0,
    spin: (Math.random() - 0.5) * 30,
  };
}

export function updateCannon(c: CannonState, dt: number) {
  c.recoil = Math.max(0, c.recoil - dt * 5);
  c.cooldown = Math.max(0, c.cooldown - dt);
}

export function updateBalls(balls: TennisBall[], dt: number, w: number, h: number) {
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // light drag so a shot carries clear across the screen before it slows
    const drag = Math.pow(0.8, dt);
    b.vx *= drag;
    b.vy *= drag;
    b.angle += b.spin * dt;
    b.spin *= Math.pow(0.4, dt);
    // bounce off the walls, losing a little energy
    if (b.x < b.r) {
      b.x = b.r;
      b.vx = Math.abs(b.vx) * 0.7;
    }
    if (b.x > w - b.r) {
      b.x = w - b.r;
      b.vx = -Math.abs(b.vx) * 0.7;
    }
    if (b.y < b.r) {
      b.y = b.r;
      b.vy = Math.abs(b.vy) * 0.7;
    }
    if (b.y > h - b.r) {
      b.y = h - b.r;
      b.vy = -Math.abs(b.vy) * 0.7;
    }
    b.life -= dt * 0.32;
    if (b.life <= 0 || Math.hypot(b.vx, b.vy) < 6) balls.splice(i, 1);
  }
}

export function drawCannon(
  ctx: CanvasRenderingContext2D,
  c: CannonState,
  t: number,
  dark: boolean,
) {
  const p = PIVOT;

  // dashed aim guide while loaded
  if (c.loaded) {
    ctx.save();
    ctx.setLineDash([3, 7]);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(
      p.x + Math.cos(c.angle) * (BARREL_LEN + 8),
      p.y + Math.sin(c.angle) * (BARREL_LEN + 8),
    );
    ctx.lineTo(p.x + Math.cos(c.angle) * 380, p.y + Math.sin(c.angle) * 380);
    ctx.stroke();
    ctx.restore();
  }

  // soft halo while loaded
  if (c.loaded) {
    const pulse = 0.26 + Math.sin(t * 0.006) * 0.12;
    const g = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, BASE_R * 2.3);
    g.addColorStop(0, `rgba(99,179,237,${pulse})`);
    g.addColorStop(1, "rgba(99,179,237,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, BASE_R * 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // ----- barrel (recoils back along its own axis after a shot) -----
  const back = c.recoil * 9;
  ctx.save();
  ctx.translate(p.x - Math.cos(c.angle) * back, p.y - Math.sin(c.angle) * back);
  ctx.rotate(c.angle);

  // drop shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.roundRect(2, -BARREL_W / 2 + 3, BARREL_LEN, BARREL_W, 7);
  ctx.fill();

  // body: vertical metallic gradient (light crown -> dark belly)
  const body = ctx.createLinearGradient(0, -BARREL_W / 2, 0, BARREL_W / 2);
  if (dark) {
    body.addColorStop(0, "#7c8595");
    body.addColorStop(0.45, "#3b414c");
    body.addColorStop(1, "#11141a");
  } else {
    body.addColorStop(0, "#dfe6ef");
    body.addColorStop(0.45, "#8b95a4");
    body.addColorStop(1, "#3c4350");
  }
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(0, -BARREL_W / 2, BARREL_LEN, BARREL_W, 7);
  ctx.fill();

  // glossy top highlight
  ctx.fillStyle = dark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.roundRect(4, -BARREL_W / 2 + 2.5, BARREL_LEN - 10, 2.4, 1.5);
  ctx.fill();

  // reinforcement bands
  ctx.fillStyle = dark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.2)";
  for (const bx of [BARREL_LEN * 0.42, BARREL_LEN * 0.7])
    ctx.fillRect(bx, -BARREL_W / 2, 2, BARREL_W);

  // muzzle ring + dark bore
  ctx.fillStyle = dark ? "#0a0c10" : "#2a2f38";
  ctx.beginPath();
  ctx.roundRect(BARREL_LEN - 7, -BARREL_W / 2 - 2, 7, BARREL_W + 4, 3);
  ctx.fill();
  ctx.fillStyle = dark ? "#05070a" : "#15181d";
  ctx.beginPath();
  ctx.ellipse(BARREL_LEN - 3, 0, 2.6, BARREL_W * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // ----- hub / carriage on top of the barrel root -----
  const ring = ctx.createRadialGradient(p.x - 5, p.y - 5, 3, p.x, p.y, BASE_R);
  ring.addColorStop(0, dark ? "#8b95a4" : "#eef2f7");
  ring.addColorStop(0.6, dark ? "#3b414c" : "#9aa4b2");
  ring.addColorStop(1, dark ? "#171a20" : "#4a5260");
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(p.x, p.y, BASE_R, 0, Math.PI * 2);
  ctx.fill();

  // bolt ring
  ctx.fillStyle = dark ? "#0b0d12" : "#2c313b";
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(
      p.x + Math.cos(a) * (BASE_R - 5),
      p.y + Math.sin(a) * (BASE_R - 5),
      1.6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // inner cap
  const cap = ctx.createRadialGradient(p.x - 3, p.y - 3, 1, p.x, p.y, BASE_R * 0.55);
  cap.addColorStop(0, dark ? "#5b6470" : "#cbd5e1");
  cap.addColorStop(1, dark ? "#21262e" : "#5b6470");
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.arc(p.x, p.y, BASE_R * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // rim — gold while loaded
  ctx.strokeStyle = c.loaded ? "#fbbf24" : dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.25)";
  ctx.lineWidth = c.loaded ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, BASE_R - 0.5, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawBalls(ctx: CanvasRenderingContext2D, balls: TennisBall[]) {
  for (const b of balls) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, b.life * 2);
    ctx.translate(b.x, b.y);
    const g = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.3, b.r * 0.2, 0, 0, b.r);
    g.addColorStop(0, "#e6ff5a");
    g.addColorStop(1, "#b6d800");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fill();
    // curved seams
    ctx.rotate(b.angle);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(-b.r * 0.7, 0, b.r * 1.1, -0.9, 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(b.r * 0.7, 0, b.r * 1.1, Math.PI - 0.9, Math.PI + 0.9);
    ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
