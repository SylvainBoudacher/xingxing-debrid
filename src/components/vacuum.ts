// Pool-cleaning vacuum docked on the right edge, below the app menu. Click the
// robot to switch it on: the suction head detaches and chases the cursor,
// dragging its corrugated hose behind it (verlet rope pinned on the dock and
// the head). Each click sucks every unsaved duck around the head into the
// nozzle; swallowed ducks then travel the hose as a bulge up to the dock.
// Click the robot again (or press Escape) to switch it off; the head floats
// back to its resting spot beside the dock.

export interface RopePt {
  x: number;
  y: number;
  px: number; // previous position (verlet integration)
  py: number;
}

export interface VacuumState {
  loaded: boolean; // switched on, the head follows the cursor and clicks suck
  cooldown: number; // seconds until the next suck is allowed
  headX: number; // suction head position, eases toward its target
  headY: number;
  rope: RopePt[]; // hose points, lazily initialized once the pool width is known
  phase: number; // accumulated time driving the idle hose sway
  bulges: number[]; // swallowed ducks travelling through the hose, 0 (head) -> 1 (dock)
}

const BODY_W = 52;
const BODY_H = 34;
const HEAD_R = 13;
const SEGS = 26; // hose points = SEGS + 1
const SEG_LEN = 16;
const PULSE_MS = 450;
export const SUCK_RADIUS = 70;
export const SUCK_COOLDOWN = 0.45;

export interface SuckPulse {
  x: number;
  y: number;
  start: number; // performance.now() when the suck fired
}

const BULGE_TRAVEL_S = 0.8; // time for a swallowed duck to cross the hose

export function makeVacuum(): VacuumState {
  return { loaded: false, cooldown: 0, headX: 0, headY: 0, rope: [], phase: 0, bulges: [] };
}

export function vacuumAnchor(w: number) {
  return { x: w - 56, y: 140 };
}

// where the hose leaves the dock (bottom-left corner of the body)
export function hosePort(w: number) {
  const a = vacuumAnchor(w);
  return { x: a.x - BODY_W / 2 + 6, y: a.y + BODY_H / 2 - 2 };
}

// where the head floats while the vacuum is off
function headRest(w: number) {
  const a = vacuumAnchor(w);
  return { x: a.x - 46, y: a.y + 34 };
}

export function overVacuum(px: number, py: number, w: number): boolean {
  const a = vacuumAnchor(w);
  return Math.abs(px - a.x) <= BODY_W / 2 + 12 && Math.abs(py - a.y) <= BODY_H / 2 + 14;
}

// Move the head toward its target (cursor while on, rest spot otherwise) and
// run the hose simulation. px/py may be -1 when the pointer left the window.
// Returns how many swallowed ducks reached the dock this tick.
export function updateVacuum(
  v: VacuumState,
  dt: number,
  w: number,
  px: number,
  py: number,
): number {
  v.cooldown = Math.max(0, v.cooldown - dt);
  v.phase += dt;

  let arrived = 0;
  for (let i = v.bulges.length - 1; i >= 0; i--) {
    v.bulges[i] += dt / BULGE_TRAVEL_S;
    if (v.bulges[i] >= 1) {
      v.bulges.splice(i, 1);
      arrived++;
    }
  }

  const port = hosePort(w);
  if (v.rope.length === 0) {
    const rest = headRest(w);
    v.headX = rest.x;
    v.headY = rest.y;
    for (let i = 0; i <= SEGS; i++) {
      const x = port.x + (rest.x - port.x) * (i / SEGS);
      const y = port.y + (rest.y - port.y) * (i / SEGS);
      v.rope.push({ x, y, px: x, py: y });
    }
  }

  const rest = headRest(w);
  const tx = v.loaded ? (px >= 0 ? px : v.headX) : rest.x;
  const ty = v.loaded ? (px >= 0 ? py : v.headY) : rest.y;
  const k = Math.min(1, dt * (v.loaded ? 14 : 5));
  v.headX += (tx - v.headX) * k;
  v.headY += (ty - v.headY) * k;

  // verlet: carry momentum with water drag, plus a lazy sway while switched on
  const damp = Math.exp(-dt * 3);
  for (const p of v.rope) {
    const vx = (p.x - p.px) * damp;
    const vy = (p.y - p.py) * damp;
    p.px = p.x;
    p.py = p.y;
    p.x += vx;
    p.y += vy;
  }
  if (v.loaded) {
    for (let i = 1; i < SEGS; i++) {
      v.rope[i].x += Math.sin(v.phase * 3 + i * 0.6) * 0.3;
      v.rope[i].y += Math.cos(v.phase * 2.3 + i * 0.6) * 0.2;
    }
  }

  // distance constraints, both ends pinned (dock port and head)
  for (let it = 0; it < 4; it++) {
    v.rope[0].x = port.x;
    v.rope[0].y = port.y;
    v.rope[SEGS].x = v.headX;
    v.rope[SEGS].y = v.headY;
    for (let i = 0; i < SEGS; i++) {
      const a = v.rope[i];
      const b = v.rope[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const diff = (dist - SEG_LEN) / dist / 2;
      a.x += dx * diff;
      a.y += dy * diff;
      b.x -= dx * diff;
      b.y -= dy * diff;
    }
  }
  v.rope[0].x = port.x;
  v.rope[0].y = port.y;
  v.rope[SEGS].x = v.headX;
  v.rope[SEGS].y = v.headY;
  return arrived;
}

// dashed suction-zone preview around the head while the vacuum is on
export function drawSuckGuide(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save();
  ctx.setLineDash([6, 9]);
  ctx.lineDashOffset = -t * 0.03;
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, SUCK_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// converging rings marking a suck; expired pulses are pruned in place
export function drawSuckPulses(ctx: CanvasRenderingContext2D, pulses: SuckPulse[], now: number) {
  for (let i = pulses.length - 1; i >= 0; i--) {
    const p = (now - pulses[i].start) / PULSE_MS;
    if (p >= 1) {
      pulses.splice(i, 1);
      continue;
    }
    const { x, y } = pulses[i];
    ctx.strokeStyle = `rgba(190,235,255,${0.75 * (1 - p)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, SUCK_RADIUS * (1 - p), 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, SUCK_RADIUS * 0.55 * (1 - p), 0, Math.PI * 2);
    ctx.stroke();
  }
}

// point on the hose at progress p (0 = head end, 1 = dock end)
function hoseAt(rope: RopePt[], p: number) {
  const f = (1 - p) * (rope.length - 1);
  const i = Math.min(rope.length - 2, Math.max(0, Math.floor(f)));
  const frac = f - i;
  return {
    x: rope[i].x + (rope[i + 1].x - rope[i].x) * frac,
    y: rope[i].y + (rope[i + 1].y - rope[i].y) * frac,
  };
}

// corrugated hose following the rope points, with swallowed-duck bulges
function drawHose(ctx: CanvasRenderingContext2D, v: VacuumState, dark: boolean) {
  const rope = v.rope;
  if (rope.length === 0) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(rope[0].x, rope[0].y);
  for (let i = 1; i < rope.length - 1; i++) {
    ctx.quadraticCurveTo(
      rope[i].x,
      rope[i].y,
      (rope[i].x + rope[i + 1].x) / 2,
      (rope[i].y + rope[i + 1].y) / 2,
    );
  }
  ctx.lineTo(rope[rope.length - 1].x, rope[rope.length - 1].y);
  ctx.strokeStyle = dark ? "#3f5b66" : "#7fb6c9";
  ctx.lineWidth = 9;
  ctx.stroke();
  // corrugation ribs
  ctx.setLineDash([2.5, 5]);
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.stroke();
  ctx.setLineDash([]);

  // ducks travelling through the hose: a stretched bulge sliding to the dock
  for (const p of v.bulges) {
    const { x, y } = hoseAt(rope, p);
    const ahead = hoseAt(rope, Math.min(1, p + 0.04));
    const ang = Math.atan2(ahead.y - y, ahead.x - x);
    // squash-and-stretch pinched at both ends of the travel
    const squeeze = 0.75 + Math.sin(p * Math.PI) * 0.35;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.fillStyle = dark ? "#4c6d79" : "#93c6d8";
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11 * squeeze, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // hint of the duck inside: a small warm glow
    ctx.fillStyle = dark ? "rgba(255,214,90,0.35)" : "rgba(255,214,90,0.5)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 6 * squeeze, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// round suction head at the end of the hose
function drawHead(ctx: CanvasRenderingContext2D, v: VacuumState, dark: boolean) {
  const hx = v.headX;
  const hy = v.headY;

  // contact shadow
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath();
  ctx.ellipse(hx, hy + HEAD_R * 0.8, HEAD_R, HEAD_R * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  // suck feedback glow
  if (v.cooldown > 0) {
    const g = ctx.createRadialGradient(hx, hy, 1, hx, hy, HEAD_R * 2);
    g.addColorStop(0, `rgba(255,217,77,${(v.cooldown / SUCK_COOLDOWN) * 0.55})`);
    g.addColorStop(1, "rgba(255,217,77,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(hx, hy, HEAD_R * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // brush disc
  const g = ctx.createRadialGradient(hx - 4, hy - 5, 2, hx, hy, HEAD_R);
  if (dark) {
    g.addColorStop(0, "#67a8bd");
    g.addColorStop(0.6, "#2d6478");
    g.addColorStop(1, "#123240");
  } else {
    g.addColorStop(0, "#c8f0fb");
    g.addColorStop(0.6, "#5fb2cf");
    g.addColorStop(1, "#22637f");
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(hx, hy, HEAD_R, 0, Math.PI * 2);
  ctx.fill();

  // dark intake
  ctx.fillStyle = dark ? "#0a0c10" : "#1c2830";
  ctx.beginPath();
  ctx.arc(hx, hy, HEAD_R * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // rim: gold while on
  ctx.strokeStyle = v.loaded ? "#fbbf24" : dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.25)";
  ctx.lineWidth = v.loaded ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.arc(hx, hy, HEAD_R - 0.5, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawVacuum(
  ctx: CanvasRenderingContext2D,
  v: VacuumState,
  t: number,
  w: number,
  dark: boolean,
) {
  const a = vacuumAnchor(w);
  const x0 = a.x - BODY_W / 2;
  const y0 = a.y - BODY_H / 2;

  // soft halo while on
  if (v.loaded) {
    const pulse = 0.26 + Math.sin(t * 0.006) * 0.12;
    const g = ctx.createRadialGradient(a.x, a.y, 4, a.x, a.y, BODY_W * 1.2);
    g.addColorStop(0, `rgba(99,220,237,${pulse})`);
    g.addColorStop(1, "rgba(99,220,237,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(a.x, a.y, BODY_W * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHose(ctx, v, dark);

  // hose collar on the dock
  const port = hosePort(w);
  ctx.fillStyle = dark ? "#0a0c10" : "#1c2830";
  ctx.beginPath();
  ctx.arc(port.x, port.y, 6, 0, Math.PI * 2);
  ctx.fill();

  // drop shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.roundRect(x0 + 2, y0 + 3, BODY_W, BODY_H, 12);
  ctx.fill();

  // body: aqua plastic shell
  const body = ctx.createLinearGradient(0, y0, 0, y0 + BODY_H);
  if (dark) {
    body.addColorStop(0, "#67a8bd");
    body.addColorStop(0.45, "#2d6478");
    body.addColorStop(1, "#123240");
  } else {
    body.addColorStop(0, "#c8f0fb");
    body.addColorStop(0.45, "#5fb2cf");
    body.addColorStop(1, "#22637f");
  }
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(x0, y0, BODY_W, BODY_H, 12);
  ctx.fill();

  // glossy top highlight
  ctx.fillStyle = dark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.roundRect(x0 + 6, y0 + 3, BODY_W - 16, 3, 2);
  ctx.fill();

  // glass dome on top
  ctx.fillStyle = dark ? "rgba(190,230,245,0.3)" : "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.arc(a.x - 6, y0 + 2, 8, Math.PI, 0);
  ctx.fill();

  // LED eyes: gold while on, calm cyan otherwise
  ctx.fillStyle = v.loaded ? "#ffd94d" : dark ? "#9fe8ff" : "#125d7e";
  for (const ex of [a.x - 10, a.x + 4]) {
    ctx.beginPath();
    ctx.arc(ex, a.y - 1, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // grill vents
  ctx.fillStyle = dark ? "rgba(190,230,245,0.25)" : "rgba(255,255,255,0.35)";
  for (const tx of [a.x + 12, a.x + 17]) ctx.fillRect(tx - 0.8, a.y - 6, 1.6, 12);

  // rim: gold while on
  ctx.strokeStyle = v.loaded ? "#fbbf24" : dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.25)";
  ctx.lineWidth = v.loaded ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.roundRect(x0, y0, BODY_W, BODY_H, 12);
  ctx.stroke();

  drawHead(ctx, v, dark);
}
