// The player: XingXing's dinghy, free 2D movement confined to the left part of
// the screen. Reuses the pool's pre-rendered boat sprite, drawn small on the
// low-res canvas so it pixelates naturally.

import { BH, type BoatControl, BW, getBoatSprite } from "@/components/boat";
import { LH, PLAY_MAX_X, SEA_TOP } from "./run";

export const PLAYER_R = 8; // collision circle around the hull
// near-miss band beyond any hitbox that scores a graze (frisson). Sized so it
// reaches past the visible hull (~22px half-width), not just the tiny 8px
// collision circle, so skimming a bullet or an enemy actually rewards you.
export const GRAZE_MARGIN = 16;

const MAX_SPEED = 150;
const ACCEL = 640;
const DAMP = 7; // exponential decay when the axis is released

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  inv: number; // invincibility seconds left after a hit
  phase: number;
  // power-up state
  shield: boolean; // absorbs the next hit
  magnetT: number; // banana magnet seconds left
  slowT: number; // world slow-motion seconds left
}

export function makePlayer(): Player {
  return {
    x: 70,
    y: (SEA_TOP + LH) / 2,
    vx: 0,
    vy: 0,
    inv: 0,
    phase: Math.random() * 6,
    shield: false,
    magnetT: 0,
    slowT: 0,
  };
}

export function updatePlayer(
  p: Player,
  keys: Set<BoatControl>,
  dt: number,
  pull?: { fx: number; fy: number } | null,
) {
  const ax = (keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0);
  const ay = (keys.has("down") ? 1 : 0) - (keys.has("up") ? 1 : 0);

  p.vx += ax * ACCEL * dt;
  p.vy += ay * ACCEL * dt;
  if (!ax) p.vx *= Math.exp(-DAMP * dt);
  if (!ay) p.vy *= Math.exp(-DAMP * dt);

  const sp = Math.hypot(p.vx, p.vy);
  if (sp > MAX_SPEED) {
    p.vx = (p.vx / sp) * MAX_SPEED;
    p.vy = (p.vy / sp) * MAX_SPEED;
  }

  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // external drag (whirlpool) applies after the clamp-to-max so it can
  // genuinely overpower the throttle
  if (pull) {
    p.x += pull.fx * dt;
    p.y += pull.fy * dt;
  }

  if (p.x < 20) {
    p.x = 20;
    p.vx = Math.max(0, p.vx);
  }
  if (p.x > PLAY_MAX_X) {
    p.x = PLAY_MAX_X;
    p.vx = Math.min(0, p.vx);
  }
  if (p.y < SEA_TOP) {
    p.y = SEA_TOP;
    p.vy = Math.max(0, p.vy);
  }
  if (p.y > LH - 22) {
    p.y = LH - 22;
    p.vy = Math.min(0, p.vy);
  }

  p.inv = Math.max(0, p.inv - dt);
  p.magnetT = Math.max(0, p.magnetT - dt);
  p.slowT = Math.max(0, p.slowT - dt);
}

export function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, t: number) {
  if (p.inv > 0 && Math.floor(t * 14) % 2 === 0) return; // hit blink

  const spr = getBoatSprite();
  const dh = 34;
  const dw = dh * (BW / BH);
  const bob = Math.sin(t * 4 + p.phase) * 1.5;
  const tilt = Math.max(-0.25, Math.min(0.25, p.vy * 0.0022));

  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + dh * 0.36, dw * 0.34, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(p.x, p.y + bob);
  ctx.rotate(tilt);
  ctx.drawImage(spr, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();

  // shield bubble
  if (p.shield) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 6);
    ctx.strokeStyle = `rgba(110,190,255,${0.5 + pulse * 0.35})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + bob - 2, dw * 0.52, dh * 0.62, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // magnet aura
  if (p.magnetT > 0) {
    ctx.strokeStyle = "rgba(240,90,80,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 20 + Math.sin(t * 8) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // stern foam when pushing against the current
  if (p.vx > 40) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(p.x - dw / 2 - 3 - i * 3, p.y + 8 + Math.sin(t * 12 + i * 2) * 2, 2, 2);
    }
  }
}
