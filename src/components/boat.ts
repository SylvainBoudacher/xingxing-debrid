import xingxingUrl from "@/assets/xingxingImg.png";

// XingXing's boat: a little wooden dinghy piloted by the app's mascot (the
// chill monkey sipping his banana juice, straight from the logo artwork).
// Driven with ZQSD/WASD or the arrow keys the same way as the typhoon
// minigame: free 2D movement — each key pushes the hull straight in that
// direction with inertia, no tank steering. It keeps a lazy cruise when nobody
// touches the keys. heading/speed are derived from the velocity so the sprite
// still faces its travel direction.

// Sprite canvas dimensions (boat faces right). PixelPool reads BW/BH to keep
// the on-screen boat at the sprite's aspect ratio.
export const BW = 170;
export const BH = 130;
export const BOAT_BASE = 100; // on-screen height
export const BOAT_RADIUS = 42; // collision circle used to shove ducks

const MAX_SPEED = 150; // px/s, matches the minigame's player
const ACCEL = 640; // px/s^2 directional thrust
const DAMP = 7; // exponential velocity decay when an axis is released
const DRIFT = 10; // idle cruise floor, like an unhurried duck

export type BoatControl = "up" | "down" | "left" | "right";

export interface BoatState {
  x: number;
  y: number;
  vx: number; // px/s
  vy: number;
  heading: number; // radians, 0 = right (derived from velocity)
  speed: number; // px/s magnitude (derived from velocity)
  phase: number; // bob phase offset
  keys: Set<BoatControl>;
}

// Sprite cache: built lazily (needs the DOM), then rebuilt once the pilot
// artwork (transparent PNG) finishes loading so XingXing pops into the hull.
let pilot: HTMLImageElement | null = null;
let pilotReady = false;
let sprite: HTMLCanvasElement | null = null;
let spriteHasPilot = false;

// Expose the pre-rendered sprite so the typhoon minigame can draw the same
// boat (BoatGamePage renders it at low resolution for the retro look).
export function getBoatSprite(): HTMLCanvasElement {
  return boatSprite();
}

function boatSprite(): HTMLCanvasElement {
  if (!pilot) {
    pilot = new Image();
    pilot.onload = () => {
      pilotReady = true;
    };
    pilot.src = xingxingUrl;
  }
  if (!sprite || (pilotReady && !spriteHasPilot)) {
    sprite = makeBoatSprite(pilotReady ? pilot : null);
    spriteHasPilot = pilotReady;
  }
  return sprite;
}

export function makeBoat(): BoatState {
  const heading = Math.random() * Math.PI * 2;
  return {
    x: -1, // placed on the first update once the pool size is known
    y: -1,
    vx: Math.cos(heading) * DRIFT,
    vy: Math.sin(heading) * DRIFT,
    heading,
    speed: DRIFT,
    phase: Math.random() * Math.PI * 2,
    keys: new Set(),
  };
}

// Map a physical key to a boat control: WASD codes cover ZQSD on AZERTY and
// WASD on QWERTY (e.code is layout-independent), plus the arrow keys.
export function boatControlOf(code: string): BoatControl | null {
  switch (code) {
    case "KeyW":
    case "ArrowUp":
      return "up";
    case "KeyS":
    case "ArrowDown":
      return "down";
    case "KeyA":
    case "ArrowLeft":
      return "left";
    case "KeyD":
    case "ArrowRight":
      return "right";
    default:
      return null;
  }
}

export function boatVelocity(b: BoatState) {
  return { vx: b.vx, vy: b.vy };
}

// Integrate the minigame-style free 2D movement and keep the boat inside the
// pool. Each axis is thrust independently with inertia, then bled back toward a
// lazy idle cruise. Returns the impact speed when it just hit a wall (0
// otherwise) so the caller can splash.
export function updateBoat(b: BoatState, dt: number, w: number, h: number): number {
  if (w <= 0 || h <= 0) return 0;
  if (b.x < 0) {
    b.x = w * 0.3;
    b.y = h * 0.4;
    b.vx = Math.cos(b.heading) * DRIFT;
    b.vy = Math.sin(b.heading) * DRIFT;
  }

  const ax = (b.keys.has("right") ? 1 : 0) - (b.keys.has("left") ? 1 : 0);
  const ay = (b.keys.has("down") ? 1 : 0) - (b.keys.has("up") ? 1 : 0);

  b.vx += ax * ACCEL * dt;
  b.vy += ay * ACCEL * dt;
  if (!ax) b.vx *= Math.exp(-DAMP * dt);
  if (!ay) b.vy *= Math.exp(-DAMP * dt);

  let sp = Math.hypot(b.vx, b.vy);
  if (sp > MAX_SPEED) {
    b.vx = (b.vx / sp) * MAX_SPEED;
    b.vy = (b.vy / sp) * MAX_SPEED;
    sp = MAX_SPEED;
  }
  // idle: keep at least a lazy cruise along the current heading so the boat
  // ambles instead of sitting dead still like a duck
  if (!ax && !ay && sp > 0.001 && sp < DRIFT) {
    b.vx = (b.vx / sp) * DRIFT;
    b.vy = (b.vy / sp) * DRIFT;
  }

  b.x += b.vx * dt;
  b.y += b.vy * dt;

  // walls: clamp and kill the outward velocity component (the boat noses
  // against the edge instead of bouncing like a duck)
  const m = BOAT_BASE * 0.45;
  let hit = 0;
  if (b.x < m || b.x > w - m) {
    hit = Math.abs(b.vx);
    b.x = Math.max(m, Math.min(w - m, b.x));
    b.vx *= -0.15;
  }
  if (b.y < m || b.y > h - m) {
    hit = Math.max(hit, Math.abs(b.vy));
    b.y = Math.max(m, Math.min(h - m, b.y));
    b.vy *= -0.15;
  }

  b.speed = Math.hypot(b.vx, b.vy);
  if (b.speed > 0.5) b.heading = Math.atan2(b.vy, b.vx);
  return hit > 60 ? hit : 0;
}

export function drawBoat(ctx: CanvasRenderingContext2D, b: BoatState, t: number, dark: boolean) {
  if (b.x < 0) return;
  const spr = boatSprite();

  const bob = Math.sin(t * 0.0024 + b.phase) * 3;
  const dh = BOAT_BASE;
  const dw = dh * (BW / BH);
  // same convention as the ducks: horizontal flip carries left/right, an eased
  // pitch carries the vertical component of the heading
  const cos = Math.cos(b.heading);
  const sin = Math.sin(b.heading);
  const dir = b.speed >= 0 ? 1 : -1;
  const flip = cos * dir >= 0 ? 1 : -1;
  const tilt = Math.max(-0.35, Math.min(0.35, sin * dir * 0.45)) * flip;
  const sway = Math.sin(t * 0.0031 + b.phase) * 0.04;

  // contact shadow
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath();
  ctx.ellipse(b.x, b.y + dh * 0.34, dw * 0.4, dh * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(b.x, b.y + bob);
  ctx.rotate(tilt + sway);
  ctx.scale(flip, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(spr, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();

  // bow foam when powering forward
  if (Math.abs(b.speed) > 90 && !dark) ctx.fillStyle = "rgba(255,255,255,0.55)";
  else if (Math.abs(b.speed) > 90) ctx.fillStyle = "rgba(190,225,255,0.5)";
  if (Math.abs(b.speed) > 90) {
    const fx = b.x + Math.cos(b.heading) * dw * 0.42 * dir;
    const fy = b.y + Math.sin(b.heading) * dh * 0.2 * dir + dh * 0.28;
    for (let i = 0; i < 3; i++) {
      const jx = Math.sin(t * 0.02 + i * 2.1) * 5;
      ctx.beginPath();
      ctx.arc(fx + jx, fy + Math.cos(t * 0.017 + i) * 2, 2.5 - i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Pre-render the dinghy with XingXing at the tiller: the logo artwork sits in
// the hull (mirrored so he faces the bow). Until the image loads the hull is
// drawn empty; the caller rebuilds the sprite once the pilot is ready.
function makeBoatSprite(img: HTMLImageElement | null): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = BW;
  cv.height = BH;
  const c = cv.getContext("2d")!;
  c.imageSmoothingEnabled = true;

  // ---- XINGXING ---- (behind the hull rim so his lower half sits inside)
  if (img) {
    const ph = 92;
    const pw = ph * (img.width / img.height);
    c.save();
    c.translate(78, 0);
    c.scale(-1, 1); // artwork gazes left; flip him toward the bow
    c.drawImage(img, -pw / 2, 8, pw, ph);
    c.restore();
  }

  // ---- HULL ---- (drawn over the monkey's lower body so he sits inside)
  const hullTop = 78;
  const hullBot = 116;
  const hull = c.createLinearGradient(0, hullTop, 0, hullBot);
  hull.addColorStop(0, "#a8703f");
  hull.addColorStop(0.5, "#8a5527");
  hull.addColorStop(1, "#5e3a1a");
  c.fillStyle = hull;
  c.beginPath();
  c.moveTo(14, hullTop); // stern top
  c.quadraticCurveTo(6, hullTop + 2, 10, hullTop + 14);
  c.quadraticCurveTo(24, hullBot, 62, hullBot); // keel
  c.quadraticCurveTo(120, hullBot, 148, hullTop + 20);
  c.quadraticCurveTo(162, hullTop - 8, 166, hullTop - 16); // raised bow
  c.quadraticCurveTo(150, hullTop - 4, 128, hullTop);
  c.closePath();
  c.fill();

  // plank seams following the hull curve
  c.strokeStyle = "rgba(46,26,8,0.45)";
  c.lineWidth = 1.6;
  for (const off of [10, 20, 30]) {
    c.beginPath();
    c.moveTo(14, hullTop + off * 0.8);
    c.quadraticCurveTo(70, hullTop + off + 14, 150, hullTop + off * 0.55);
    c.stroke();
  }

  // gunwale (light rim along the top edge)
  c.strokeStyle = "#c99a5d";
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(12, hullTop + 2);
  c.quadraticCurveTo(70, hullTop + 10, 128, hullTop + 1);
  c.quadraticCurveTo(152, hullTop - 6, 166, hullTop - 16);
  c.stroke();

  // hull highlight + waterline shading
  c.strokeStyle = "rgba(255,235,200,0.25)";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(20, hullTop + 8);
  c.quadraticCurveTo(70, hullTop + 16, 140, hullTop + 8);
  c.stroke();
  c.fillStyle = "rgba(10,30,50,0.28)";
  c.beginPath();
  c.ellipse(78, hullBot - 2, 66, 7, 0, 0, Math.PI);
  c.fill();

  // little rudder/tiller at the stern
  c.strokeStyle = "#5e3a1a";
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(16, hullTop + 6);
  c.lineTo(8, hullTop + 26);
  c.stroke();

  // pennant on the bow
  c.strokeStyle = "#7a4a20";
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(164, hullTop - 16);
  c.lineTo(164, hullTop - 38);
  c.stroke();
  c.fillStyle = "#e0457b";
  c.beginPath();
  c.moveTo(164, hullTop - 38);
  c.lineTo(150, hullTop - 33);
  c.lineTo(164, hullTop - 28);
  c.closePath();
  c.fill();

  return cv;
}
