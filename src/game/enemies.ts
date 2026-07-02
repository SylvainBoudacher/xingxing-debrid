// Enemy ducks and their projectiles, mixed by an act-based spawn director:
// - floaters drift left as obstacles
// - snipers hold the right edge and fire eggs
// - wavers cross the screen in sine columns
// - kamikazes lock on, blink, then charge in a straight line
// - bombers fly above the horizon and drop eggs in an arc
// Act 3 only trickles floaters and kamikazes while the Duck King (boss.ts)
// does the heavy lifting. Endless mode uses its own ramping table.

import { makeDuckSprite } from "@/components/duckSprite";
import type { Variant } from "@/components/duckTypes";
import { endlessTier, LH, LW, type RunState, scrollSpeed, SEA_TOP } from "./run";

export type EnemyKind = "floater" | "sniper" | "waver" | "kamikaze" | "bomber";

export interface Enemy {
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseY: number;
  amp: number;
  phase: number;
  t: number; // age in seconds
  life: number; // seconds before a sniper retreats
  fireT: number; // seconds until next shot / bomb
  lockT: number; // kamikaze: seconds of blinking left before the charge
  charging: boolean; // kamikaze: locked in and rushing
  r: number;
  h: number; // draw height
  sprite: HTMLCanvasElement;
}

export interface Shot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  grazed?: boolean;
}

// bomber payload: falls in an arc toward a sea-level target, with a growing
// shadow telegraphing the impact point
export interface Bomb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
}

export const BOMB_BLAST_R = 15; // damage radius at the moment of impact

// small fixed cast of enemy skins, pre-rendered once (needs the DOM)
const ORANGE = "#F5811F";
const FLOATER_VARIANTS: Variant[] = [
  { body: "#FFD21E", beak: ORANGE, acc: "none" },
  { body: "#F4F7FB", beak: ORANGE, acc: "shades" },
  { body: "#FF9A3C", beak: ORANGE, acc: "sunhat", accColor: "#3FD0C8" },
  { body: "#4FB0F0", beak: ORANGE, acc: "none" },
];
const SNIPER_VARIANT: Variant = { body: "#F0584E", beak: ORANGE, acc: "pirate" };
const WAVER_VARIANT: Variant = {
  body: "#7C6B8A",
  beak: ORANGE,
  acc: "beanie",
  accColor: "#5B8DEF",
};
const KAMIKAZE_VARIANT: Variant = { body: "#F0584E", beak: "#2A2A2A", acc: "devil" };
const BOMBER_VARIANT: Variant = {
  body: "#4A5568",
  beak: ORANGE,
  acc: "cowboy",
  accColor: "#8B5A2B",
};

let cast: {
  floaters: HTMLCanvasElement[];
  sniper: HTMLCanvasElement;
  waver: HTMLCanvasElement;
  kamikaze: HTMLCanvasElement;
  bomber: HTMLCanvasElement;
} | null = null;

function sprites() {
  if (!cast) {
    cast = {
      floaters: FLOATER_VARIANTS.map(makeDuckSprite),
      sniper: makeDuckSprite(SNIPER_VARIANT),
      waver: makeDuckSprite(WAVER_VARIANT),
      kamikaze: makeDuckSprite(KAMIKAZE_VARIANT),
      bomber: makeDuckSprite(BOMBER_VARIANT),
    };
  }
  return cast;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function base(kind: EnemyKind, sprite: HTMLCanvasElement, h: number): Enemy {
  return {
    kind,
    x: LW + 30,
    y: 0,
    vx: 0,
    vy: 0,
    baseY: 0,
    amp: 0,
    phase: Math.random() * 6,
    t: 0,
    life: 99,
    fireT: 99,
    lockT: 0,
    charging: false,
    r: h * 0.42,
    h,
    sprite,
  };
}

function spawnFloater(enemies: Enemy[], run: RunState) {
  const h = rand(20, 28);
  const e = base("floater", sprites().floaters[(Math.random() * 4) | 0], h);
  e.y = rand(SEA_TOP + 6, LH - 26);
  e.vx = -(scrollSpeed(run) + rand(5, 40));
  e.amp = rand(0, 6);
  enemies.push(e);
}

function spawnSniper(enemies: Enemy[]) {
  const e = base("sniper", sprites().sniper, 26);
  e.y = rand(SEA_TOP + 10, LH - 36);
  e.vx = -70;
  e.life = rand(6, 8.5);
  e.fireT = rand(0.8, 1.4);
  e.r = 11;
  enemies.push(e);
}

function spawnWaverColumn(enemies: Enemy[], run: RunState) {
  const yBase = rand(SEA_TOP + 10, LH - 110);
  const vx = -(scrollSpeed(run) + 32);
  for (let i = 0; i < 4; i++) {
    const e = base("waver", sprites().waver, 22);
    e.x = LW + 30 + i * 26;
    e.y = yBase + i * 26;
    e.baseY = e.y;
    e.vx = vx;
    e.amp = 26;
    e.phase = i * 0.8;
    e.r = 9;
    enemies.push(e);
  }
}

function spawnKamikaze(enemies: Enemy[]) {
  const e = base("kamikaze", sprites().kamikaze, 24);
  e.y = rand(SEA_TOP + 10, LH - 30);
  e.vx = -85;
  e.lockT = 0.85;
  e.r = 10;
  enemies.push(e);
}

function spawnBomber(enemies: Enemy[]) {
  const e = base("bomber", sprites().bomber, 22);
  e.y = rand(40, SEA_TOP - 26); // flies in the sky band
  e.vx = -52;
  e.fireT = rand(0.7, 1.3);
  e.r = 9;
  enemies.push(e);
}

export interface Director {
  floatT: number;
  snipeT: number;
  waveT: number;
  kamiT: number;
  bombT: number;
}

export function makeDirector(): Director {
  return { floatT: 1.2, snipeT: 6, waveT: 9, kamiT: 12, bombT: 10 };
}

// spawn cadence per act (or endless ramp tier); `density` divides every
// interval, so tempete/ouragan pack the sea tighter
export function updateSpawns(
  dir: Director,
  run: RunState,
  enemies: Enemy[],
  dt: number,
  density: number,
) {
  dir.floatT -= dt;
  dir.snipeT -= dt;
  dir.waveT -= dt;
  dir.kamiT -= dt;
  dir.bombT -= dt;

  // endless: everything is on the menu, ramping with survival time
  const act = run.endless ? endlessTier(run) : run.act;
  const ramp = run.endless ? 1 + run.totalT / 120 : 1;
  const d = density * ramp;
  const bossAct = !run.endless && run.act === 2;

  if (dir.floatT <= 0) {
    spawnFloater(enemies, run);
    dir.floatT =
      (act === 0 ? rand(0.9, 1.6) : act === 1 && !bossAct ? rand(0.55, 1.05) : rand(2.2, 3.2)) / d;
  }
  if (!bossAct && act >= 0 && dir.snipeT <= 0) {
    spawnSniper(enemies);
    dir.snipeT = (act === 0 ? rand(4.5, 6.5) : rand(2.6, 4)) / d;
  }
  if (!bossAct && act >= 1 && dir.waveT <= 0) {
    spawnWaverColumn(enemies, run);
    dir.waveT = rand(4.5, 6.5) / d;
  }
  // kamikazes: rare late in act 1, then a regular menace everywhere
  if (dir.kamiT <= 0 && (act >= 1 || run.actT > 15 || run.endless)) {
    spawnKamikaze(enemies);
    dir.kamiT = (act === 0 ? rand(9, 13) : bossAct ? rand(8, 12) : rand(5.5, 8.5)) / d;
  }
  if (!bossAct && act >= 1 && dir.bombT <= 0) {
    spawnBomber(enemies);
    dir.bombT = rand(7, 10) / d;
  }
}

export function updateEnemies(
  enemies: Enemy[],
  shots: Shot[],
  bombs: Bomb[],
  dt: number,
  playerX: number,
  playerY: number,
  shotSpeed: number,
) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.t += dt;

    if (e.kind === "sniper") {
      // slide in, hold position, track the player vertically, then retreat
      const holdX = LW - 55;
      if (e.t < e.life) {
        if (e.x > holdX) e.x += e.vx * dt;
        e.y += Math.max(-45, Math.min(45, (playerY - e.y) * 1.6)) * dt;
        e.fireT -= dt;
        if (e.fireT <= 0) {
          e.fireT = rand(1.5, 2.2);
          shots.push({ x: e.x - 12, y: e.y, vx: -115 * shotSpeed, vy: 0, r: 3 });
        }
      } else {
        e.x += 55 * dt; // backs away off the right edge
      }
    } else if (e.kind === "kamikaze") {
      if (e.charging) {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      } else if (e.x > LW - 70) {
        e.x += e.vx * dt; // still sliding in
      } else {
        // locked: blink in place, then dive at where the player is right now
        e.lockT -= dt;
        e.y += Math.max(-30, Math.min(30, (playerY - e.y) * 1.2)) * dt;
        if (e.lockT <= 0) {
          const a = Math.atan2(playerY - e.y, playerX - e.x);
          const sp = 250 * shotSpeed;
          e.vx = Math.cos(a) * sp;
          e.vy = Math.sin(a) * sp;
          e.charging = true;
        }
      }
    } else if (e.kind === "bomber") {
      e.x += e.vx * dt;
      e.fireT -= dt;
      if (e.fireT <= 0 && e.x < LW - 20 && e.x > 40) {
        e.fireT = rand(1.4, 2);
        bombs.push({
          x: e.x,
          y: e.y + 8,
          vx: e.vx * 0.4,
          vy: 30,
          targetY: rand(SEA_TOP + 8, LH - 24),
        });
      }
    } else {
      e.x += e.vx * dt;
      if (e.kind === "waver") e.y = e.baseY + Math.sin(e.t * 2.6 + e.phase) * e.amp;
      else e.y += Math.sin(e.t * 2 + e.phase) * e.amp * dt;
    }

    if (e.x < -40 || e.x > LW + 70 || e.y < -30 || e.y > LH + 30) enemies.splice(i, 1);
  }
}

export function updateShots(shots: Shot[], dt: number) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.x < -10 || s.x > LW + 10 || s.y < -10 || s.y > LH + 10) shots.splice(i, 1);
  }
}

// advance bombs; returns the impact points of those that hit the water this
// frame so the caller can splash and damage-check
export function updateBombs(bombs: Bomb[], dt: number): { x: number; y: number }[] {
  const impacts: { x: number; y: number }[] = [];
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i];
    b.vy += 180 * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.y >= b.targetY) {
      impacts.push({ x: b.x, y: b.targetY });
      bombs.splice(i, 1);
    } else if (b.x < -10) {
      bombs.splice(i, 1);
    }
  }
  return impacts;
}

export function drawEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[], t: number) {
  for (const e of enemies) {
    // kamikaze lock-on blink
    const warning = e.kind === "kamikaze" && !e.charging && e.x <= LW - 70;
    if (warning && Math.floor(t * 8) % 2 === 0) continue;

    const dh = e.h;
    const dw = dh * (e.sprite.width / e.sprite.height);
    const bob =
      e.kind === "bomber" ? Math.sin(t * 6 + e.phase) * 3 : Math.sin(t * 3 + e.phase) * 1.5;
    if (e.kind !== "bomber") {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + dh * 0.4, dw * 0.3, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(e.x, e.y + bob);
    if (e.kind === "kamikaze" && e.charging) ctx.rotate(Math.atan2(e.vy, -e.vx) * -0.4);
    ctx.scale(-1, 1); // duck art faces right; enemies come from the right
    ctx.drawImage(e.sprite, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();

    if (warning) {
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff4d4d";
      ctx.fillText("!", e.x, e.y - dh * 0.75);
    }
    // charge trail
    if (e.kind === "kamikaze" && e.charging) {
      ctx.fillStyle = "rgba(255,120,80,0.4)";
      for (let k = 1; k <= 3; k++) ctx.fillRect(e.x + k * 6 - 1, e.y + bob - 1, 2, 2);
    }
  }
}

export function drawShots(ctx: CanvasRenderingContext2D, shots: Shot[]) {
  for (const s of shots) {
    ctx.fillStyle = "#f7f3e8";
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, s.r + 1, s.r, Math.atan2(s.vy, s.vx), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(120,100,60,0.7)";
    ctx.lineWidth = 1;
    ctx.stroke();
    // faint trail
    ctx.fillStyle = "rgba(247,243,232,0.25)";
    ctx.fillRect(s.x - s.vx * 0.03, s.y - s.vy * 0.03 - 1, 2, 2);
  }
}

export function drawBombs(ctx: CanvasRenderingContext2D, bombs: Bomb[]) {
  for (const b of bombs) {
    // impact shadow grows as the bomb falls
    const closeness = Math.max(0, Math.min(1, 1 - (b.targetY - b.y) / 120));
    ctx.fillStyle = `rgba(0,0,0,${0.15 + closeness * 0.25})`;
    ctx.beginPath();
    ctx.ellipse(
      b.x + b.vx * 0.1,
      b.targetY,
      4 + closeness * 8,
      2 + closeness * 2.5,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.fillStyle = "#e8e0c8";
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(90,70,40,0.8)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
