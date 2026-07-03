// Floating power-ups, spawned rarely and drifting left like bananas:
// - shield: absorbs the next hit (bubble around the hull)
// - magnet: bananas fly to the boat for a few seconds
// - hourglass: slows the whole world down for a moment

import { LH, LW, type RunState, scrollSpeed, SEA_TOP } from "./run";

export type PowerupKind = "shield" | "magnet" | "slow";

export const POWERUP_R = 10;
export const MAGNET_DURATION = 5;
export const MAGNET_RANGE = 70;
export const SLOW_DURATION = 2.2;
export const SLOW_FACTOR = 0.45;

export interface Powerup {
  kind: PowerupKind;
  x: number;
  y: number;
  phase: number;
}

export interface PowerupDirector {
  t: number;
}

export function makePowerupDirector(): PowerupDirector {
  return { t: 9 };
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const KINDS: PowerupKind[] = ["shield", "magnet", "slow"];

export function updatePowerupSpawns(dir: PowerupDirector, pows: Powerup[], dt: number) {
  dir.t -= dt;
  if (dir.t > 0) return;
  dir.t = rand(12, 18);
  pows.push({
    kind: KINDS[(Math.random() * KINDS.length) | 0],
    x: LW + 20,
    y: rand(SEA_TOP + 14, LH - 40),
    phase: Math.random() * 6,
  });
}

export function updatePowerups(pows: Powerup[], run: RunState, dt: number) {
  const v = scrollSpeed(run) + 6;
  for (let i = pows.length - 1; i >= 0; i--) {
    pows[i].x -= v * dt;
    if (pows[i].x < -15) pows.splice(i, 1);
  }
}

export function drawPowerups(ctx: CanvasRenderingContext2D, pows: Powerup[], t: number) {
  for (const p of pows) {
    const bob = Math.sin(t * 2.6 + p.phase) * 2.5;
    const y = p.y + bob;

    // pulsing halo so they read as "grab me"
    const pulse = 0.5 + 0.5 * Math.sin(t * 5 + p.phase);
    ctx.strokeStyle = `rgba(255,255,255,${0.25 + pulse * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, y, 8 + pulse * 1.5, 0, Math.PI * 2);
    ctx.stroke();

    if (p.kind === "shield") {
      // heraldic shield: domed shoulders tapering to a point, with a cross
      ctx.fillStyle = "#3f8fd8";
      ctx.beginPath();
      ctx.moveTo(p.x - 4.5, y - 5);
      ctx.quadraticCurveTo(p.x, y - 6.5, p.x + 4.5, y - 5); // domed top
      ctx.lineTo(p.x + 4.5, y - 1);
      ctx.quadraticCurveTo(p.x + 4, y + 4, p.x, y + 6.5); // right flank to tip
      ctx.quadraticCurveTo(p.x - 4, y + 4, p.x - 4.5, y - 1); // left flank
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#bfe3ff";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#eaf6ff";
      ctx.fillRect(p.x - 0.7, y - 3.5, 1.4, 7);
      ctx.fillRect(p.x - 3, y - 1.2, 6, 1.4);
    } else if (p.kind === "magnet") {
      ctx.strokeStyle = "#f0584e";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, y, 4, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#e8e8e8";
      ctx.fillRect(p.x - 5.5, y, 3, 3);
      ctx.fillRect(p.x + 2.5, y, 3, 3);
    } else {
      // hourglass
      ctx.fillStyle = "#ffe066";
      ctx.beginPath();
      ctx.moveTo(p.x - 4, y - 5);
      ctx.lineTo(p.x + 4, y - 5);
      ctx.lineTo(p.x - 4, y + 5);
      ctx.lineTo(p.x + 4, y + 5);
      ctx.closePath();
      ctx.fill();
    }
  }
}
