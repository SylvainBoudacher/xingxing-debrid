// Terrain events: scripted hazards announced by a WARNING banner.
// - wave: a wall of water crossing the screen with one safe gap
// - whirl: a whirlpool that drags the boat toward its centre
// - fog: a drifting bank that hides part of the sea (act 2 flavour)
// One event at a time, none during the boss act (he is enough trouble).

import { endlessTier, LH, LW, type RunState, scrollSpeed, SEA_TOP } from "./run";

export const WAVE_GAP_H = 58;
export const WHIRL_R = 55;

export interface GameEvent {
  kind: "wave" | "whirl" | "fog";
  x: number;
  y: number; // whirl centre / wave gap centre
  t: number;
  warnT: number; // seconds of WARNING banner left before the hazard is live
}

export interface EventDirector {
  t: number;
  active: GameEvent | null;
}

export function makeEventDirector(): EventDirector {
  return { t: 12, active: null };
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function pickKind(run: RunState): GameEvent["kind"] {
  const tier = run.endless ? endlessTier(run) : run.act;
  if (tier === 0) return "wave";
  const roll = Math.random();
  return roll < 0.45 ? "wave" : roll < 0.75 ? "whirl" : "fog";
}

export function updateEvents(dir: EventDirector, run: RunState, dt: number) {
  const bossAct = !run.endless && run.act === 2;

  if (!dir.active) {
    if (bossAct) return;
    dir.t -= dt;
    if (dir.t > 0) return;
    const kind = pickKind(run);
    dir.active = {
      kind,
      x: LW + 30,
      y: rand(SEA_TOP + WAVE_GAP_H / 2 + 8, LH - WAVE_GAP_H / 2 - 14),
      t: 0,
      warnT: kind === "fog" ? 0 : 1.3, // fog needs no siren
    };
    return;
  }

  const e = dir.active;
  e.t += dt;
  if (e.warnT > 0) {
    e.warnT -= dt;
    return; // hazard frozen off-screen while the banner flashes
  }

  const v =
    e.kind === "wave" ? scrollSpeed(run) + 95 : e.kind === "whirl" ? 42 : scrollSpeed(run) * 0.55;
  e.x -= v * dt;

  const width = e.kind === "fog" ? 240 : e.kind === "whirl" ? WHIRL_R : 20;
  if (e.x < -width) {
    dir.active = null;
    dir.t = rand(13, 20);
  }
}

// wave collision: touching the wall outside the gap
export function waveHits(e: GameEvent, px: number, py: number): boolean {
  if (e.kind !== "wave" || e.warnT > 0) return false;
  if (Math.abs(e.x - px) > 9) return false;
  return Math.abs(py - e.y) > WAVE_GAP_H / 2 - 6;
}

// whirl pull: returns the drag force to apply to the boat this frame
export function whirlPull(e: GameEvent, px: number, py: number): { fx: number; fy: number } | null {
  if (e.kind !== "whirl" || e.warnT > 0) return null;
  const dx = e.x - px;
  const dy = e.y - py;
  const d = Math.hypot(dx, dy);
  if (d > WHIRL_R || d < 4) return null;
  const pull = 150 * (1 - d / WHIRL_R);
  return { fx: (dx / d) * pull, fy: (dy / d) * pull };
}

export function drawEvent(ctx: CanvasRenderingContext2D, e: GameEvent, t: number) {
  if (e.warnT > 0) return;

  if (e.kind === "wave") {
    const gapTop = e.y - WAVE_GAP_H / 2;
    const gapBot = e.y + WAVE_GAP_H / 2;
    const sway = Math.sin(t * 10) * 1.5;
    for (const [y0, y1] of [
      [SEA_TOP - 14, gapTop],
      [gapBot, LH],
    ]) {
      const g = ctx.createLinearGradient(e.x - 8, 0, e.x + 8, 0);
      g.addColorStop(0, "rgba(90,160,210,0.35)");
      g.addColorStop(0.5, "rgba(150,215,255,0.9)");
      g.addColorStop(1, "rgba(90,160,210,0.35)");
      ctx.fillStyle = g;
      ctx.fillRect(e.x - 8 + sway, y0, 16, y1 - y0);
      // foam edge
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (let y = y0 + 2; y < y1 - 2; y += 6) {
        ctx.fillRect(e.x - 9 + sway + Math.sin(y + t * 14) * 2, y, 3, 3);
      }
    }
  } else if (e.kind === "whirl") {
    ctx.strokeStyle = "rgba(180,225,255,0.6)";
    ctx.lineWidth = 1.5;
    for (let arm = 0; arm < 3; arm++) {
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 1.7; a += 0.25) {
        const r = WHIRL_R * 0.85 * (1 - a / (Math.PI * 2));
        const ang = a + t * 2.4 + (arm * Math.PI * 2) / 3;
        const px = e.x + Math.cos(ang) * r;
        const py = e.y + Math.sin(ang) * r * 0.6; // squashed, seen from the side
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(8,30,50,0.55)";
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// fog is drawn above the entities, so it gets its own pass
export function drawFog(ctx: CanvasRenderingContext2D, e: GameEvent, t: number) {
  if (e.kind !== "fog") return;
  for (let i = 0; i < 5; i++) {
    const fx = e.x + i * 46 + Math.sin(t * 0.7 + i * 2) * 8;
    const fy = SEA_TOP + 14 + ((i * 53) % (LH - SEA_TOP - 40));
    ctx.fillStyle = "rgba(190,205,220,0.34)";
    ctx.beginPath();
    ctx.ellipse(fx, fy, 60, 26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
