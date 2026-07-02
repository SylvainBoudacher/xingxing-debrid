// The Duck King: act 3 boss, in three phases across the act:
//   1. royal court   - aimed fan sprays + ring bursts (holds the right edge)
//   2. royal charge  - lines up with the boat, telegraphs, then rams across
//   3. royal fury    - faster fans and rings together, visibly furious
// There is no way to hurt him - survive the act and he gives up.

import { kingVariant } from "@/components/duckRandom";
import { makeDuckSprite } from "@/components/duckSprite";
import { LH, LW, SEA_TOP } from "./run";
import type { Shot } from "./enemies";

export const BOSS_R = 26;

type BossMode = "enter" | "hold" | "aim" | "charge" | "reenter";

export interface Boss {
  x: number;
  y: number;
  t: number;
  mode: BossMode;
  modeT: number; // seconds in the current mode
  fanT: number;
  ringT: number;
  charges: number; // rams performed in the current phase-2 cycle
  quackT: number; // "COIN." speech bubble timer (fury)
  leaving: boolean;
  sprite: HTMLCanvasElement;
}

const HOLD_X = LW - 75;

export function makeBoss(): Boss {
  return {
    x: LW + 80,
    y: (SEA_TOP + LH) / 2,
    t: 0,
    mode: "enter",
    modeT: 0,
    fanT: 2.5,
    ringT: 8,
    charges: 0,
    quackT: 3,
    leaving: false,
    sprite: makeDuckSprite(kingVariant()),
  };
}

// phase index from progress through the act: 0 court, 1 charge, 2 fury
export function bossPhase(actT: number, actDur: number): number {
  const p = actT / actDur;
  return p < 0.36 ? 0 : p < 0.68 ? 1 : 2;
}

function fan(b: Boss, shots: Shot[], px: number, py: number, n: number, speed: number) {
  const aim = Math.atan2(py - b.y, px - b.x);
  const half = (n - 1) / 2;
  for (let i = -half; i <= half; i++) {
    const a = aim + i * 0.16;
    shots.push({ x: b.x - 20, y: b.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 3 });
  }
}

function ring(b: Boss, shots: Shot[], speed: number) {
  for (let i = 0; i < 12; i++) {
    const a = Math.PI * 0.6 + (i / 12) * Math.PI * 0.8 + Math.PI * 0.2; // left-facing arc
    shots.push({ x: b.x - 10, y: b.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 3 });
  }
}

export function updateBoss(
  b: Boss,
  shots: Shot[],
  dt: number,
  playerX: number,
  playerY: number,
  phase: number,
  shotSpeed: number,
) {
  b.t += dt;
  b.modeT += dt;

  if (b.leaving) {
    b.y += 30 * dt; // sinks below the waves, defeated by boredom
    return;
  }

  const trackY = (rate: number) => {
    b.y += Math.max(-60, Math.min(60, (playerY - b.y) * rate)) * dt;
    b.y = Math.max(SEA_TOP + 24, Math.min(LH - 45, b.y));
  };

  switch (b.mode) {
    case "enter":
    case "reenter":
      if (b.x > HOLD_X) b.x -= (b.mode === "enter" ? 60 : 130) * dt;
      else {
        b.mode = "hold";
        b.modeT = 0;
      }
      break;

    case "hold": {
      trackY(phase === 2 ? 2 : 1.4);

      b.fanT -= dt;
      if (b.fanT <= 0) {
        b.fanT = phase === 2 ? 1.1 : 1.7;
        fan(b, shots, playerX, playerY, phase === 2 ? 7 : 5, 95 * shotSpeed);
      }

      b.ringT -= dt;
      if (b.ringT <= 0) {
        b.ringT = phase === 2 ? 4.5 : 8;
        ring(b, shots, 70 * shotSpeed);
      }

      // phase 2: break off the hold to line up a charge (twice per cycle)
      if (phase === 1 && b.modeT > 2.2 && b.charges < 2) {
        b.mode = "aim";
        b.modeT = 0;
      }
      if (phase !== 1) b.charges = 0;

      if (phase === 2) {
        b.quackT -= dt;
        if (b.quackT <= 0) b.quackT = 4 + Math.random() * 3;
      }
      break;
    }

    case "aim":
      trackY(4); // locks onto the boat's lane fast
      if (b.modeT > 1) {
        b.mode = "charge";
        b.modeT = 0;
        b.charges++;
      }
      break;

    case "charge":
      b.x -= 330 * dt;
      if (b.x < -70) {
        b.x = LW + 60;
        b.mode = "reenter";
        b.modeT = 0;
      }
      break;
  }
}

// the boss body only hurts when he is actually on stage or ramming
export function bossDangerous(b: Boss): boolean {
  return !b.leaving && b.mode !== "reenter";
}

export function bossAiming(b: Boss): boolean {
  return b.mode === "aim";
}

export function drawBoss(ctx: CanvasRenderingContext2D, b: Boss, t: number, phase: number) {
  const dh = 68;
  const dw = dh * (b.sprite.width / b.sprite.height);
  const shiver = b.mode === "aim" ? (Math.random() - 0.5) * 3 : 0;
  const bob = Math.sin(t * 2 + 1) * 2.5 + shiver;
  const sink = b.leaving ? Math.min(1, b.t * 0.1) : 0;

  // royal glow, turning angry in the fury phase
  const glow = ctx.createRadialGradient(b.x, b.y, 6, b.x, b.y, dw * 0.7);
  glow.addColorStop(0, phase === 2 ? "rgba(255,90,60,0.3)" : "rgba(255,215,60,0.28)");
  glow.addColorStop(1, "rgba(255,215,60,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(b.x, b.y, dw * 0.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.globalAlpha = 1 - sink * 0.6;
  ctx.translate(b.x + shiver, b.y + bob + sink * 30);
  if (b.mode === "charge") ctx.rotate(-0.08);
  ctx.scale(-1, 1);
  ctx.drawImage(b.sprite, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
  ctx.globalAlpha = 1;

  // telegraph the ram
  if (b.mode === "aim" && Math.floor(t * 8) % 2 === 0) {
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff4d4d";
    ctx.fillText("!", b.x, b.y - dh * 0.7);
  }
  // charge wake
  if (b.mode === "charge") {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    for (let k = 1; k <= 4; k++) {
      ctx.fillRect(b.x + dw * 0.4 + k * 7, b.y + bob + Math.sin(t * 20 + k) * 4, 3, 3);
    }
  }
  // fury quacking
  if (phase === 2 && !b.leaving && b.quackT > 3.2) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(b.x + 18, b.y - dh * 0.68, 30, 12);
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#111";
    ctx.fillText("COIN.", b.x + 33, b.y - dh * 0.68 + 9);
  }
}
