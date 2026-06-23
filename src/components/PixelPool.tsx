import { useEffect, useRef } from "react";

// Pixel-art pool with smoothly-shaded rubber ducks (3/4 isometric view)
// drifting around. A new duck appears every SPAWN_MS until MAX_DUCKS.

const MAX_DUCKS = 15;
const SPAWN_MS = 40_000;
const FIRST_SPAWN_MS = 5_000;
const BORDER = 0; // no coping — water fills the full canvas
const DUCK_BASE = 92; // on-screen height of a scale-1 duck

type Accessory =
  | "none"
  | "shades"
  | "pirate"
  | "crown"
  | "party"
  | "tophat"
  | "sunhat"
  | "flower"
  | "snorkel"
  | "bowtie"
  | "headphones";

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
  // accessorized
  { body: "#FFD21E", beak: "#F5811F", acc: "tophat", accColor: "#E0457B" },
  { body: "#F4F7FB", beak: "#F5811F", acc: "sunhat", accColor: "#FF6F61" },
  { body: "#FF9A3C", beak: "#E8620F", acc: "sunhat", accColor: "#3FD0C8" },
  { body: "#FB7AA8", beak: "#F5811F", acc: "flower", accColor: "#FFFFFF" },
  { body: "#7BD850", beak: "#F5811F", acc: "flower", accColor: "#FF5C8A" },
  { body: "#4FB0F0", beak: "#F5811F", acc: "snorkel" },
  { body: "#5EE6C5", beak: "#F5811F", acc: "snorkel" },
  { body: "#F4F7FB", beak: "#F5811F", acc: "bowtie", accColor: "#E0457B" },
  { body: "#A78BFA", beak: "#F5811F", acc: "headphones", accColor: "#FB7185" },
  { body: "#FFD21E", beak: "#F5811F", acc: "headphones", accColor: "#5B8DEF" },
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
  const tri = (_c: CanvasRenderingContext2D, pts: [number, number][], style: string) => {
    _c.fillStyle = style;
    _c.beginPath();
    _c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) _c.lineTo(pts[i][0], pts[i][1]);
    _c.closePath();
    _c.fill();
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
  } else if (v.acc === "tophat") {
    c.fillStyle = "#23272e";
    fillEll(80, 15, 27, 6.5, "#23272e"); // brim
    c.fillRect(67, 0, 28, 15); // cylinder
    c.fillStyle = v.accColor!;
    c.fillRect(67, 5, 28, 4); // band
    c.fillStyle = "rgba(255,255,255,0.12)";
    c.fillRect(70, 1, 3, 13); // sheen
  } else if (v.acc === "sunhat") {
    fillEll(80, 16, 31, 8, "#F2CE7E"); // straw brim
    fillEll(80, 9, 15, 9, "#F2CE7E"); // dome
    c.strokeStyle = "rgba(150,110,40,0.4)";
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(80, 16, 31, 8, 0, 0, Math.PI * 2);
    c.stroke();
    fillEll(80, 13, 14, 3.4, v.accColor!); // ribbon
  } else if (v.acc === "flower") {
    const pc = v.accColor!;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      fillEll(64 + Math.cos(a) * 5.5, 15 + Math.sin(a) * 5.5, 4, 4, pc);
    }
    fillEll(64, 15, 3, 3, "#FFD21E"); // center
  } else if (v.acc === "snorkel") {
    c.fillStyle = "#22303C";
    c.fillRect(70, 32, 22, 3); // strap
    fillEll(95, 37, 12.5, 10, "#22303C"); // mask frame
    fillEll(95, 37, 9.5, 7.5, "rgba(150,225,255,0.7)"); // glass
    c.fillStyle = "#F5811F";
    c.fillRect(110, 6, 4.5, 34); // tube
    c.fillRect(110, 6, 9, 4); // bend
    c.fillStyle = "#1f2937";
    c.fillRect(112.5, 36, 5, 5); // mouthpiece
  } else if (v.acc === "bowtie") {
    const bc = v.accColor!;
    tri(
      c,
      [
        [86, 60],
        [78, 55],
        [78, 65],
      ],
      bc,
    );
    tri(
      c,
      [
        [86, 60],
        [94, 55],
        [94, 65],
      ],
      bc,
    );
    fillEll(86, 60, 2.2, 3, "rgba(0,0,0,0.25)");
    fillEll(86, 60, 1.8, 2.5, bc);
  } else if (v.acc === "headphones") {
    c.strokeStyle = "#22303C";
    c.lineWidth = 4;
    c.beginPath();
    c.ellipse(82, 44, 30, 30, 0, Math.PI * 1.2, Math.PI * 1.8);
    c.stroke();
    c.fillStyle = "#22303C";
    c.fillRect(53, 30, 4, 14); // side bar
    fillEll(56, 46, 6, 8, "#22303C"); // ear cup
    fillEll(56, 46, 3.5, 5, v.accColor!); // cushion
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
  const edge = (Math.random() * 4) | 0;
  const x = edge === 0 ? -dw : edge === 1 ? W + dw : alongW;
  const y = edge === 0 ? alongH : edge === 1 ? alongH : edge === 2 ? -dh : H + dh;

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
// The very first duck arrives after FIRST_SPAWN_MS, then one every SPAWN_MS.
function ensureSpawning() {
  if (spawnTimer !== null) return;
  const firstDelay = pool.length === 0 ? FIRST_SPAWN_MS : SPAWN_MS;
  spawnTimer = window.setTimeout(() => {
    spawnDuck();
    spawnTimer = window.setInterval(spawnDuck, SPAWN_MS);
  }, firstDelay);
}

// Arrete le timer de spawn (timeout ou interval, meme espace d'ids). Le pool
// reste au scope module, donc un remontage (summer reactive) reprend avec les
// memes canards.
function stopSpawning() {
  if (spawnTimer === null) return;
  clearTimeout(spawnTimer);
  clearInterval(spawnTimer);
  spawnTimer = null;
}

export function PixelPool({ active = true, fps = 30 }: { active?: boolean; fps?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const fpsRef = useRef(fps);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    fpsRef.current = fps;
  }, [fps]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let w = 0;
    let h = 0;
    let dpr = 1;

    // pre-rendered static water (gradient + tiles + coping); rebuilt on resize/theme
    let staticLayer: HTMLCanvasElement | null = null;
    let staticDark = false;

    // ripple columns: the per-column sine term is constant across frames/rows,
    // so precompute it on resize to halve the trig work in the hot draw loop.
    let rippleCols: { x: number; s: number }[] = [];

    // drag-to-move state
    let dragging: Duck | null = null;
    let dragDX = 0;
    let dragDY = 0;
    let lastPX = 0;
    let lastPY = 0;
    let lastPT = 0;
    let throwVX = 0;
    let throwVY = 0;
    let appliedCursor = "";

    const setCursor = (cur: string) => {
      if (appliedCursor === cur) return;
      appliedCursor = cur;
      document.body.style.cursor = cur;
    };

    function overUI(e: PointerEvent): boolean {
      const t = e.target as HTMLElement | null;
      return !!t?.closest("button, a, input, textarea, select, [role='button'], [role='menuitem']");
    }

    function updateHoverCursor(e: PointerEvent) {
      if (!activeRef.current) return setCursor("");
      setCursor(!overUI(e) && duckAt(e.clientX, e.clientY) ? "grab" : "");
    }

    function duckAt(px: number, py: number): Duck | null {
      // topmost first (drawn last = highest y after the per-frame sort)
      for (let i = pool.length - 1; i >= 0; i--) {
        const d = pool[i];
        const dh = DUCK_BASE * d.scale;
        const dw = dh * (SW / SH);
        if (px >= d.x - dw / 2 && px <= d.x + dw / 2 && py >= d.y - dh / 2 && py <= d.y + dh / 2)
          return d;
      }
      return null;
    }

    function onPointerDown(e: PointerEvent) {
      if (!activeRef.current || overUI(e)) return;
      const d = duckAt(e.clientX, e.clientY);
      if (!d) return;
      dragging = d;
      dragDX = d.x - e.clientX;
      dragDY = d.y - e.clientY;
      d.vx = 0;
      d.vy = 0;
      d.entering = false;
      lastPX = e.clientX;
      lastPY = e.clientY;
      lastPT = performance.now();
      throwVX = throwVY = 0;
      setCursor("grabbing");
      e.preventDefault();
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging) {
        updateHoverCursor(e);
        return;
      }
      const now = performance.now();
      const dtp = Math.max(8, now - lastPT);
      throwVX = ((e.clientX - lastPX) / dtp) * 1000;
      throwVY = ((e.clientY - lastPY) / dtp) * 1000;
      lastPX = e.clientX;
      lastPY = e.clientY;
      lastPT = now;
      dragging.x = e.clientX + dragDX;
      dragging.y = e.clientY + dragDY;
    }

    function onPointerUp(e: PointerEvent) {
      if (!dragging) return;
      // dropped into the drain: remove it, freeing a slot for a new duck
      if (overDrain(dragging.x, dragging.y)) {
        const i = pool.indexOf(dragging);
        if (i >= 0) pool.splice(i, 1);
        dragging = null;
        updateHoverCursor(e);
        return;
      }
      let vx = throwVX;
      let vy = throwVY;
      const sp = Math.hypot(vx, vy);
      if (sp < 4) {
        // released without a flick: drift off gently
        const a = Math.random() * Math.PI * 2;
        vx = Math.cos(a) * 12;
        vy = Math.sin(a) * 12;
      } else if (sp > 60) {
        vx *= 60 / sp;
        vy *= 60 / sp;
      }
      dragging.vx = vx;
      dragging.vy = vy;
      dragging = null;
      updateHoverCursor(e);
    }

    const isDark = () => document.documentElement.classList.contains("dark");

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      bounds.w = w;
      bounds.h = h;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      staticLayer = null; // size changed: rebuild static layer
      rippleCols = [];
      for (let xx = BORDER; xx < w - BORDER; xx += 16)
        rippleCols.push({ x: xx, s: Math.sin(xx * 0.05) });
    }

    // Pre-render the non-animated water (gradient + glow + tiles + coping) once.
    function buildStatic() {
      const dark = isDark();
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.floor(w * dpr));
      c.height = Math.max(1, Math.floor(h * dpr));
      const x = c.getContext("2d")!;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);

      const wg = x.createLinearGradient(0, 0, 0, h);
      if (dark) {
        wg.addColorStop(0, "#0B3B7A");
        wg.addColorStop(0.5, "#0A2E66");
        wg.addColorStop(1, "#06183F");
      } else {
        wg.addColorStop(0, "#46C2FF");
        wg.addColorStop(0.45, "#2E8FE6");
        wg.addColorStop(1, "#1A5FD0");
      }
      x.fillStyle = wg;
      x.fillRect(0, 0, w, h);

      const glow = x.createRadialGradient(w * 0.5, h * 0.1, 0, w * 0.5, h * 0.1, h * 0.7);
      glow.addColorStop(0, dark ? "rgba(120,190,255,0.16)" : "rgba(190,240,255,0.45)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = glow;
      x.fillRect(0, 0, w, h);

      x.fillStyle = dark ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.05)";
      const tile = 40;
      for (let yy = 0; yy < h; yy += tile) {
        for (let xx = 0; xx < w; xx += tile) {
          if (((xx / tile) | 0) % 2 === ((yy / tile) | 0) % 2) x.fillRect(xx, yy, tile, tile);
        }
      }

      // no coping border — water fills edge to edge

      staticLayer = c;
      staticDark = dark;
    }

    // shimmering caustic ripples (the only animated part of the water)
    function drawRipples(t: number, dark: boolean) {
      ctx.fillStyle = dark ? "rgba(150,215,255,0.22)" : "rgba(225,248,255,0.6)";
      for (let yy = BORDER + 14; yy < h - BORDER; yy += 26) {
        const base = Math.sin(t * 0.0012 + yy * 0.15);
        for (const col of rippleCols) {
          const o = Math.sin(t * 0.0016 + col.x * 0.08 + yy) * 3;
          const s = base + col.s;
          if (s > 0.55) ctx.fillRect(col.x, yy + o, 7, 2);
          else if (s > 0.35) ctx.fillRect(col.x, yy + o, 3, 2);
        }
      }
    }

    function drain() {
      const r = 36;
      return { x: w - BORDER - r - 16, y: h - BORDER - r - 16, r };
    }

    function overDrain(px: number, py: number): boolean {
      const d = drain();
      return Math.hypot(px - d.x, py - d.y) <= d.r;
    }

    function drawDrain(now: number, hot: boolean, dark: boolean) {
      const d = drain();

      // coping ring
      ctx.fillStyle = dark ? "#0c2a40" : "#d4ecf8";
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();

      // dark hole
      const hole = ctx.createRadialGradient(d.x, d.y, 2, d.x, d.y, d.r * 0.82);
      hole.addColorStop(0, dark ? "#01040a" : "#063147");
      hole.addColorStop(1, dark ? "#06223a" : "#0b4a6e");
      ctx.fillStyle = hole;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * 0.82, 0, Math.PI * 2);
      ctx.fill();

      // rotating whirlpool
      ctx.save();
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * 0.82, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = hot ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.28)";
      ctx.lineWidth = 2.5;
      const rot = now * 0.0025;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 1.8; a += 0.2) {
          const rr = d.r * 0.78 * (1 - a / (Math.PI * 2.1));
          const ang = a + rot + (i * Math.PI * 2) / 3;
          const px = d.x + Math.cos(ang) * rr;
          const py = d.y + Math.sin(ang) * rr;
          if (a === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }
      ctx.restore();

      // highlight ring when a duck hovers over it
      ctx.strokeStyle = hot ? "#ffffff" : dark ? "#1B6E94" : "#1E6F94";
      ctx.lineWidth = hot ? 3.5 : 2;
      const pulse = hot ? Math.sin(now * 0.012) * 2 : 0;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r + 1 + pulse, 0, Math.PI * 2);
      ctx.stroke();
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
      raf = requestAnimationFrame(frame);
      // skip all rendering when off-screen (page != main/discover): the canvas
      // is opacity-0 there, so painting it 30-60x/s would just waste CPU/GPU.
      if (!activeRef.current) {
        last = now; // avoid a large dt jump when the page becomes active again
        return;
      }
      // cap the ambient canvas at the configured fps (30 or 60)
      if (now - last < 1000 / fpsRef.current) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const dark = isDark();
      if (!staticLayer || staticDark !== dark) buildStatic();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(staticLayer!, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      drawRipples(now, dark);
      drawDrain(now, !!(dragging && overDrain(dragging.x, dragging.y)), dark);

      const b = inner();
      for (const d of pool) {
        if (d === dragging) continue; // held by the cursor
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.entering) {
          // let it swim in freely until it's fully inside the pool
          if (d.x >= b.minX && d.x <= b.maxX && d.y >= b.minY && d.y <= b.maxY) d.entering = false;
          continue;
        }
        if (d.x < b.minX) {
          d.x = b.minX;
          d.vx = Math.abs(d.vx);
        }
        if (d.x > b.maxX) {
          d.x = b.maxX;
          d.vx = -Math.abs(d.vx);
        }
        if (d.y < b.minY) {
          d.y = b.minY;
          d.vy = Math.abs(d.vy);
        }
        if (d.y > b.maxY) {
          d.y = b.maxY;
          d.vy = -Math.abs(d.vy);
        }
        if (Math.random() < 0.01) {
          d.vx += (Math.random() - 0.5) * 6;
          d.vy += (Math.random() - 0.5) * 6;
          const sp = Math.hypot(d.vx, d.vy);
          const max = 26;
          if (sp > max) {
            d.vx *= max / sp;
            d.vy *= max / sp;
          }
        }
      }
      pool.sort((a, c) => a.y - c.y);
      for (const d of pool) drawDuck(d, now);
    }

    resize();
    ensureSpawning();
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    raf = requestAnimationFrame(frame);

    // Note: the ducks (pool) are intentionally kept alive at module scope so
    // they persist if the component remounts. The spawn timer, however, is
    // stopped here so it does not keep firing while unmounted (summer disabled).
    return () => {
      cancelAnimationFrame(raf);
      stopSpawning();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.body.style.cursor = "";
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
