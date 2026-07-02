// Bananas: the style pickup of the run. They spawn in short arcs, often close
// to enemy lanes so grabbing them is a risk/reward call.

import { LH, LW, type RunState, scrollSpeed, SEA_TOP } from "./run";

export const BANANA_R = 9; // pickup radius

export interface Banana {
  x: number;
  y: number;
  phase: number;
}

export interface BananaDirector {
  t: number;
}

export function makeBananaDirector(): BananaDirector {
  return { t: 3 };
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function updateBananaSpawns(dir: BananaDirector, bananas: Banana[], dt: number) {
  dir.t -= dt;
  if (dir.t > 0) return;
  dir.t = rand(3.5, 6);
  // a short arc of 3-5 bananas
  const n = 3 + ((Math.random() * 3) | 0);
  const baseY = rand(SEA_TOP + 12, LH - 56);
  const arc = rand(-30, 30);
  for (let i = 0; i < n; i++) {
    bananas.push({
      x: LW + 20 + i * 18,
      y: baseY + Math.sin((i / (n - 1)) * Math.PI) * arc,
      phase: i * 0.5,
    });
  }
}

export function updateBananas(bananas: Banana[], run: RunState, dt: number) {
  const v = scrollSpeed(run) + 10;
  for (let i = bananas.length - 1; i >= 0; i--) {
    bananas[i].x -= v * dt;
    if (bananas[i].x < -15) bananas.splice(i, 1);
  }
}

export function drawBananas(ctx: CanvasRenderingContext2D, bananas: Banana[], t: number) {
  for (const b of bananas) {
    const bob = Math.sin(t * 3 + b.phase) * 2;
    ctx.save();
    ctx.translate(b.x, b.y + bob);
    ctx.rotate(Math.sin(t * 2 + b.phase) * 0.3);
    // chunky pixel banana: crescent of yellow squares + brown tip
    ctx.fillStyle = "#ffd21e";
    ctx.fillRect(-4, -1, 3, 3);
    ctx.fillRect(-2, 1, 3, 3);
    ctx.fillRect(1, 2, 3, 3);
    ctx.fillStyle = "#e8b400";
    ctx.fillRect(-3, 2, 2, 2);
    ctx.fillStyle = "#7a4a20";
    ctx.fillRect(-5, -2, 2, 2);
    ctx.restore();
    // twinkle
    if (Math.floor(t * 4 + b.phase) % 3 === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillRect(b.x + 5, b.y - 6 + bob, 1, 1);
    }
  }
}
