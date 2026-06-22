import { useEffect, useRef } from "react";

// Pixel-art pool with smoothly-shaded rubber ducks (3/4 isometric view)
// drifting around. A new duck appears every SPAWN_MS until MAX_DUCKS.

const MAX_DUCKS = 15;
const SPAWN_MS = 20_000;
const BORDER = 16; // pool coping width
const DUCK_BASE = 92; // on-screen height of a scale-1 duck

type Accessory = "none" | "shades" | "pirate" | "crown" | "party";

interface Variant {
  body: string;
  beak: string;
  acc: Accessory;
  accColor?: string;
}

const VARIANTS: Variant[] = [
  // classic yellow appears a bit more often
  { body: "#FFD21E", beak: "#F5811F", acc: "none" },
  { body: "#FFD21E", beak: "#F5811F", acc: "none" },
  { body: "#FFD21E", beak: "#F5811F", acc: "shades" },
  { body: "#FFD21E", beak: "#2A2A2A", acc: "pirate" },
  { body: "#FFD21E", beak: "#F5811F", acc: "crown", accColor: "#FFE066" },
  // colors
  { body: "#F4F7FB", beak: "#F5811F", acc: "none" }, // white
  { body: "#FB7AA8", beak: "#F5811F", acc: "none" }, // pink
  { body: "#E0457B", beak: "#F5811F", acc: "none" }, // magenta
  { body: "#FF6F61", beak: "#F5811F", acc: "none" }, // coral
  { body: "#F0584E", beak: "#F5811F", acc: "none" }, // red
  { body: "#FF9A3C", beak: "#E8620F", acc: "none" }, // orange
  { body: "#5EE6C5", beak: "#F5811F", acc: "none" }, // mint
  { body: "#3FD0C8", beak: "#F5811F", acc: "none" }, // teal
  { body: "#7BD850", beak: "#F5811F", acc: "none" }, // lime
  { body: "#4FB0F0", beak: "#F5811F", acc: "none" }, // sky blue
  { body: "#5B8DEF", beak: "#F5811F", acc: "shades" }, // blue
  { body: "#A7D8FF", beak: "#F5811F", acc: "none" }, // baby blue
  { body: "#A78BFA", beak: "#F5811F", acc: "party", accColor: "#FB7185" }, // purple
  { body: "#C9A8FF", beak: "#F5811F", acc: "none" }, // lavender
  { body: "#7C6B8A", beak: "#F5811F", acc: "none" }, // dusk purple
  { body: "#4A5568", beak: "#F5A623", acc: "none" }, // charcoal
  { body: "#F5C518", beak: "#F5811F", acc: "crown", accColor: "#FFF0A0" }, // gold king
];

const SW = 130;
const SH = 120;
const BODY = { cx: 56, cy: 82, rx: 46, ry: 32 };
const HEAD = { cx: 82, cy: 44, r: 32 };

// Build a smoothly-shaded rubber-duck sprite (facing right).
function makeDuckSprite(v: Variant): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = SW;
  cv.height = SH;
  const c = cv.getContext("2d")!;
  c.imageSmoothingEnabled = true;

  const fillEll = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    style: string | CanvasGradient,
  ) => {
    c.fillStyle = style;
    c.beginPath();
    c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  };

  // soft dark rim behind the silhouette for definition
  const rim = "rgba(70,45,0,0.20)";
  fillEll(BODY.cx, BODY.cy + 2, BODY.rx + 2.5, BODY.ry + 2.5, rim);
  fillEll(HEAD.cx, HEAD.cy + 2, HEAD.r + 2.5, HEAD.r + 2.5, rim);

  // tail (back-left)
  c.fillStyle = v.body;
  c.beginPath();
  c.moveTo(16, 70);
  c.quadraticCurveTo(0, 60, 14, 54);
  c.quadraticCurveTo(26, 60, 30, 74);
  c.closePath();
  c.fill();

  // ---- BODY ----
  fillEll(BODY.cx, BODY.cy, BODY.rx, BODY.ry, v.body);
  c.save();
  c.beginPath();
  c.ellipse(BODY.cx, BODY.cy, BODY.rx, BODY.ry, 0, 0, Math.PI * 2);
  c.clip();
  let g = c.createRadialGradient(62, 106, 4, 62, 106, 48);
  g.addColorStop(0, "rgba(0,0,0,0.34)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  fillEll(62, 106, 48, 32, g);
  g = c.createRadialGradient(94, 88, 4, 94, 88, 40);
  g.addColorStop(0, "rgba(0,0,0,0.16)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  fillEll(94, 88, 40, 30, g);
  g = c.createRadialGradient(34, 62, 2, 34, 62, 40);
  g.addColorStop(0, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  fillEll(34, 62, 36, 24, g);
  c.restore();

  // wing seam
  c.strokeStyle = "rgba(0,0,0,0.15)";
  c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(58, 70);
  c.quadraticCurveTo(88, 74, 84, 100);
  c.stroke();

  // ---- HEAD ----
  fillEll(HEAD.cx, HEAD.cy, HEAD.r, HEAD.r, v.body);
  c.save();
  c.beginPath();
  c.ellipse(HEAD.cx, HEAD.cy, HEAD.r, HEAD.r, 0, 0, Math.PI * 2);
  c.clip();
  let h = c.createRadialGradient(90, 64, 3, 90, 64, 36);
  h.addColorStop(0, "rgba(0,0,0,0.30)");
  h.addColorStop(1, "rgba(0,0,0,0)");
  fillEll(90, 64, 36, 28, h);
  h = c.createRadialGradient(66, 26, 2, 66, 26, 30);
  h.addColorStop(0, "rgba(255,255,255,0.85)");
  h.addColorStop(1, "rgba(255,255,255,0)");
  fillEll(66, 27, 26, 22, h);
  h = c.createRadialGradient(72, 20, 0, 72, 20, 9);
  h.addColorStop(0, "rgba(255,255,255,0.95)");
  h.addColorStop(1, "rgba(255,255,255,0)");
  fillEll(72, 20, 9, 9, h);
  c.restore();

  // ---- BEAK ----
  const bk = c.createLinearGradient(0, 46, 0, 64);
  bk.addColorStop(0, v.beak === "#2A2A2A" ? "#3a3a3a" : "#FBA94C");
  bk.addColorStop(1, v.beak === "#2A2A2A" ? "#1f1f1f" : v.beak);
  c.fillStyle = bk;
  c.beginPath();
  c.moveTo(103, 48);
  c.quadraticCurveTo(129, 47, 123, 56);
  c.quadraticCurveTo(117, 62, 102, 59);
  c.closePath();
  c.fill();
  c.strokeStyle = "rgba(120,50,0,0.45)";
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(105, 55);
  c.quadraticCurveTo(115, 56, 121, 55);
  c.stroke();

  // ---- EYE ----
  if (v.acc !== "shades") {
    fillEll(96, 38, 4.7, 5.3, "#181818");
    fillEll(94.4, 35.8, 1.7, 1.9, "#ffffff");
  }

  // ---- ACCESSORIES ----
  if (v.acc === "shades") {
    c.fillStyle = "#1f2937";
    fillEll(90, 35, 9.5, 7.5, "#1f2937");
    fillEll(73, 35, 8.5, 6.5, "#1f2937");
    c.fillRect(80, 32, 4, 3); // bridge
    c.fillRect(55, 33, 16, 3); // temple arm
    c.fillStyle = "rgba(120,180,255,0.7)";
    fillEll(92, 32, 3.5, 2.5, "rgba(120,180,255,0.7)");
    fillEll(75, 32, 3, 2.2, "rgba(120,180,255,0.7)");
  } else if (v.acc === "pirate") {
    c.fillStyle = "#1f2937";
    fillEll(80, 18, 31, 8, "#1f2937"); // brim
    c.beginPath();
    c.moveTo(56, 18);
    c.quadraticCurveTo(80, -14, 104, 18);
    c.closePath();
    c.fill();
    fillEll(80, 11, 5.5, 5.5, "#f4f7fb"); // skull
    c.fillStyle = "#1f2937";
    fillEll(78, 10, 1.2, 1.5, "#1f2937");
    fillEll(82, 10, 1.2, 1.5, "#1f2937");
    c.fillRect(78.5, 13, 3, 1.4);
  } else if (v.acc === "crown") {
    c.fillStyle = v.accColor!;
    c.beginPath();
    c.moveTo(58, 16);
    c.lineTo(63, 2);
    c.lineTo(70, 11);
    c.lineTo(80, -1);
    c.lineTo(90, 11);
    c.lineTo(97, 2);
    c.lineTo(102, 16);
    c.closePath();
    c.fill();
    fillEll(63, 4, 2, 2, "#FF5C8A");
    fillEll(80, 1, 2.2, 2.2, "#5CC8FF");
    fillEll(97, 4, 2, 2, "#FF5C8A");
  } else if (v.acc === "party") {
    c.fillStyle = v.accColor!;
    c.beginPath();
    c.moveTo(60, 14);
    c.lineTo(80, -18);
    c.lineTo(100, 14);
    c.closePath();
    c.fill();
    c.fillStyle = "#ffffff";
    c.fillRect(74, 2, 3, 3);
    c.fillRect(84, 6, 3, 3);
    c.fillRect(79, -6, 3, 3);
    fillEll(80, -18, 3.2, 3.2, "#FACC15"); // pom-pom
  }

  return cv;
}

interface Duck {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  phase: number;
  sprite: HTMLCanvasElement;
  entering: boolean; // swimming in from off-screen; skips wall bounce until inside
}

// Pool state lives at module scope so the ducks persist across page changes
// (MainPage unmounting/remounting) instead of resetting.
const pool: Duck[] = [];
const bounds = { w: 0, h: 0 };
let spawnTimer: number | null = null;

function inner() {
  const m = DUCK_BASE * 0.5;
  return {
    minX: BORDER + m,
    maxX: bounds.w - BORDER - m,
    minY: BORDER + m,
    maxY: bounds.h - BORDER - m,
  };
}

function spawnDuck() {
  if (pool.length >= MAX_DUCKS) return;
  const W = bounds.w;
  const H = bounds.h;
  const scale = 0.55 + Math.random() * 0.3;
  const sprite = makeDuckSprite(VARIANTS[(Math.random() * VARIANTS.length) | 0]);
  const dh = DUCK_BASE * scale;
  const dw = dh * (SW / SH);
  const speed = 12 + Math.random() * 12;
  const alongW = BORDER + Math.random() * Math.max(1, W - 2 * BORDER);
  const alongH = BORDER + Math.random() * Math.max(1, H - 2 * BORDER);

  // start fully off-screen on a random edge
  let x = 0;
  let y = 0;
  switch ((Math.random() * 4) | 0) {
    case 0: // from left
      (x = -dw), (y = alongH);
      break;
    case 1: // from right
      (x = W + dw), (y = alongH);
      break;
    case 2: // from top
      (x = alongW), (y = -dh);
      break;
    default: // from bottom
      (x = alongW), (y = H + dh);
  }

  // head toward a random point inside the pool so it always swims in
  const b = inner();
  const tx = b.minX + Math.random() * Math.max(1, b.maxX - b.minX);
  const ty = b.minY + Math.random() * Math.max(1, b.maxY - b.minY);
  const ang = Math.atan2(ty - y, tx - x);
  const vx = Math.cos(ang) * speed;
  const vy = Math.sin(ang) * speed;

  pool.push({
    x,
    y,
    vx,
    vy,
    scale,
    phase: Math.random() * Math.PI * 2,
    sprite,
    entering: true,
  });
}

// Started once; keeps spawning (up to MAX_DUCKS) even while off the page.
function ensureSpawning() {
  if (spawnTimer !== null) return;
  if (pool.length === 0) spawnDuck();
  spawnTimer = window.setInterval(spawnDuck, SPAWN_MS);
}

export function PixelPool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const isDark = () => document.documentElement.classList.contains("dark");

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      bounds.w = w;
      bounds.h = h;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }

    function drawWater(t: number) {
      const dark = isDark();

      // dreamy vertical blue gradient
      const wg = ctx.createLinearGradient(0, 0, 0, h);
      if (dark) {
        wg.addColorStop(0, "#0B3B7A");
        wg.addColorStop(0.5, "#0A2E66");
        wg.addColorStop(1, "#06183F");
      } else {
        wg.addColorStop(0, "#46C2FF");
        wg.addColorStop(0.45, "#2E8FE6");
        wg.addColorStop(1, "#1A5FD0");
      }
      ctx.fillStyle = wg;
      ctx.fillRect(0, 0, w, h);

      // soft glow near the top for a luminous, oneiric feel
      const glow = ctx.createRadialGradient(w * 0.5, h * 0.1, 0, w * 0.5, h * 0.1, h * 0.7);
      glow.addColorStop(0, dark ? "rgba(120,190,255,0.16)" : "rgba(190,240,255,0.45)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = dark ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.05)";
      const tile = 40;
      for (let yy = 0; yy < h; yy += tile) {
        for (let xx = 0; xx < w; xx += tile) {
          if (((xx / tile) | 0) % 2 === ((yy / tile) | 0) % 2)
            ctx.fillRect(xx, yy, tile, tile);
        }
      }

      // shimmering caustic ripples
      ctx.fillStyle = dark ? "rgba(150,215,255,0.22)" : "rgba(225,248,255,0.6)";
      for (let yy = BORDER + 14; yy < h - BORDER; yy += 24) {
        const base = Math.sin(t * 0.0012 + yy * 0.15);
        for (let xx = BORDER; xx < w - BORDER; xx += 13) {
          const o = Math.sin(t * 0.0016 + xx * 0.08 + yy) * 3;
          const s = base + Math.sin(xx * 0.05);
          if (s > 0.55) ctx.fillRect(xx, yy + o, 7, 2);
          else if (s > 0.35) ctx.fillRect(xx, yy + o, 3, 2);
        }
      }

      ctx.fillStyle = dark ? "#13334A" : "#E8F4FA";
      ctx.fillRect(0, 0, w, BORDER);
      ctx.fillRect(0, h - BORDER, w, BORDER);
      ctx.fillRect(0, 0, BORDER, h);
      ctx.fillRect(w - BORDER, 0, BORDER, h);
      ctx.fillStyle = dark ? "#1B6E94" : "#1E6F94";
      ctx.fillRect(BORDER - 3, BORDER - 3, w - 2 * (BORDER - 3), 3);
      ctx.fillRect(BORDER - 3, h - BORDER, w - 2 * (BORDER - 3), 3);
      ctx.fillRect(BORDER - 3, BORDER - 3, 3, h - 2 * (BORDER - 3));
      ctx.fillRect(w - BORDER, BORDER - 3, 3, h - 2 * (BORDER - 3));
    }

    function drawDuck(d: Duck, t: number) {
      const bob = Math.sin(t * 0.003 + d.phase) * 3;
      const tilt = Math.sin(t * 0.003 + d.phase + 1) * 0.05;
      const dh = DUCK_BASE * d.scale;
      const dw = dh * (d.sprite.width / d.sprite.height);
      const flip = d.vx < 0 ? -1 : 1;

      // contact shadow
      ctx.fillStyle = "rgba(0,0,0,0.14)";
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + dh * 0.42, dw * 0.36, dh * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // duck
      ctx.save();
      ctx.translate(d.x, d.y + bob);
      ctx.rotate(tilt);
      ctx.scale(flip, 1);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(d.sprite, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    }

    let last = performance.now();
    let raf = 0;
    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      drawWater(now);

      const b = inner();
      for (const d of pool) {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.entering) {
          // let it swim in freely until it's fully inside the pool
          if (
            d.x >= b.minX &&
            d.x <= b.maxX &&
            d.y >= b.minY &&
            d.y <= b.maxY
          )
            d.entering = false;
          continue;
        }
        if (d.x < b.minX) (d.x = b.minX), (d.vx = Math.abs(d.vx));
        if (d.x > b.maxX) (d.x = b.maxX), (d.vx = -Math.abs(d.vx));
        if (d.y < b.minY) (d.y = b.minY), (d.vy = Math.abs(d.vy));
        if (d.y > b.maxY) (d.y = b.maxY), (d.vy = -Math.abs(d.vy));
        if (Math.random() < 0.01) {
          d.vx += (Math.random() - 0.5) * 6;
          d.vy += (Math.random() - 0.5) * 6;
          const sp = Math.hypot(d.vx, d.vy);
          const max = 26;
          if (sp > max) (d.vx *= max / sp), (d.vy *= max / sp);
        }
      }
      pool.sort((a, c) => a.y - c.y);
      for (const d of pool) drawDuck(d, now);

      raf = requestAnimationFrame(frame);
    }

    resize();
    ensureSpawning();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);

    // Note: the ducks (pool) and spawn timer are intentionally kept alive on
    // unmount so they persist across page navigation.
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
