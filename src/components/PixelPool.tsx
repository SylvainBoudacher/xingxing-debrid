import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  aimCannon,
  type CannonState,
  drawBalls,
  drawCannon,
  fireCannon,
  makeCannon,
  overCannon,
  type TennisBall,
  updateBalls,
  updateCannon,
} from "./cannon";
import { getRarity, randomVariant } from "./duckRandom";
import { makeDuckSprite, SH, SW, type Effect } from "./duckSprite";
import type { Variant } from "./duckTypes";
import {
  bumpLilyPad,
  drawLilyPad,
  layoutLilyPads,
  type LilyPad,
  makeLilyPads,
  updateLilyPads,
} from "./lilyPad";
import {
  type DuckSpec,
  emitDuckDrop,
  emitDucksReserved,
  emitShopOpen,
  registerCounter,
  registerInjector,
  registerReleaser,
  registerRemover,
  registerShopHitTest,
  registerVariantSpawner,
} from "./duckShopBridge";

// Pixel-art pool with smoothly-shaded rubber ducks (3/4 isometric view)
// drifting around. A new duck appears every SPAWN_MS until MAX_DUCKS.

let MAX_DUCKS = 15;
const SPAWN_MS = 40_000;
const FIRST_SPAWN_MS = 5_000;
const BORDER = 0; // no coping — water fills the full canvas
const DUCK_BASE = 92; // on-screen height of a scale-1 duck

interface Duck {
  id: string;
  variant: Variant; // full skin, needed to preview/persist a saved duck
  name?: string;
  saved?: boolean; // part of the persisted collection
  inShop?: boolean; // dropped into the shop: frozen and hidden while the panel is open
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  phase: number;
  sprite: HTMLCanvasElement;
  effect?: Effect; // animated aura rendered at draw time (glow/ghost/sparkle/bubbles)
  lean?: number; // eased pitch toward vertical travel direction
  spin?: number; // angular velocity (rad/s) from flicks / glancing hits
  spinAngle?: number; // accumulated spin rotation, unwound back to upright at rest
  wakeTimer?: number; // seconds until next wake drop
  boostTimer?: number; // remaining seconds of speed boost
  entering: boolean; // swimming in from off-screen; skips wall bounce until inside
  draining?: boolean; // being sucked into the drain
  drainT?: number; // timestamp when drain animation started
  storing?: boolean; // being filed away into the shop crate (moved to reserve)
  storeT?: number; // timestamp when the storing animation started
  exiting?: boolean; // random duck fading out (culled when the limit drops)
  exitT?: number; // timestamp when the fade-out started
}

// A duck mid-exit (drain / reserve / cull) is animating out: excluded from
// physics, hit-testing and the capacity count until the frame loop removes it.
function leaving(d: Duck) {
  return !!(d.draining || d.storing || d.exiting);
}

// Pool state lives at module scope so the ducks persist across page changes
// (MainPage unmounting/remounting) instead of resetting.
const pool: Duck[] = [];
const bounds = { w: 0, h: 0 };
let spawnTimer: number | null = null;

// Passive props that live alongside the ducks at module scope so they persist
// across remounts: lily pads (bumped around) and the tennis-ball cannon.
const pads: LilyPad[] = makeLilyPads();
const cannon: CannonState = makeCannon();
const balls: TennisBall[] = [];

function inner() {
  const m = DUCK_BASE * 0.5;
  return {
    minX: BORDER + m,
    maxX: bounds.w - BORDER - m,
    minY: BORDER + m,
    maxY: bounds.h - BORDER - m,
  };
}

// Push a duck of the given skin/scale, starting off-screen and swimming toward
// a random point inside the pool. `extra` overrides defaults (id/name/saved).
function enterPool(variant: Variant, scale: number, extra: Partial<Duck> = {}) {
  const W = bounds.w;
  const H = bounds.h;
  const sprite = makeDuckSprite(variant);
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

  pool.push({
    id: crypto.randomUUID(),
    variant,
    x,
    y,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    scale,
    phase: Math.random() * Math.PI * 2,
    sprite,
    effect: variant.effect,
    entering: true,
    ...extra,
  });
}

function spawnDuck() {
  if (pool.length >= MAX_DUCKS) return;
  enterPool(randomVariant(), 0.55 + Math.random() * 0.3);
}

// Saved ducks bypass MAX_DUCKS: they were collected on purpose, so they always
// swim back in (at startup, or when released from the collection panel).
function spawnSavedDuck(spec: DuckSpec) {
  if (pool.some((d) => d.id === spec.id)) return; // already swimming
  enterPool(spec.variant, spec.scale, { id: spec.id, name: spec.name, saved: true });
}

// Strip saved/name from a pool duck when released from the collection so it
// swims as an anonymous duck (no name tag, drainable by the syphon).
function unmarkSavedDuck(id: string) {
  const d = pool.find((x) => x.id === id);
  if (!d) return;
  d.saved = false;
  d.name = undefined;
}

// Put a saved duck in reserve from the shop panel: play the "file into the
// crate" animation, then the frame loop removes it once it finishes.
function removePoolDuck(id: string) {
  const d = pool.find((x) => x.id === id);
  if (!d || d.storing) return;
  d.storing = true;
  d.storeT = performance.now();
  d.vx = 0;
  d.vy = 0;
}

// Trim the pool down to MAX_DUCKS when the display limit drops: random ducks
// fade out first, then saved ducks are filed into reserve until at the limit.
// Reserved ids are emitted so the shop can persist them.
function enforceLimit() {
  const now = performance.now();
  const visible = pool.filter((d) => !leaving(d) && !d.inShop);
  let over = visible.length - MAX_DUCKS;
  if (over <= 0) return;

  for (const d of visible) {
    if (over <= 0) break;
    if (d.saved) continue; // saved ducks are spared in this first pass
    d.exiting = true;
    d.exitT = now;
    d.vx = 0;
    d.vy = 0;
    over--;
  }
  if (over <= 0) return;

  const reserved: string[] = [];
  for (const d of visible) {
    if (over <= 0) break;
    if (!d.saved || d.exiting || d.storing) continue;
    d.storing = true;
    d.storeT = now;
    d.vx = 0;
    d.vy = 0;
    reserved.push(d.id);
    over--;
  }
  if (reserved.length) emitDucksReserved(reserved);
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

export function PixelPool({
  active = true,
  fps = 30,
  maxDucks = 15,
}: {
  active?: boolean;
  fps?: number;
  maxDucks?: number;
}) {
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
    MAX_DUCKS = maxDucks;
    enforceLimit();
  }, [maxDucks]);

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

    // last pointer position (any move, not just drags) to find the hovered duck
    // each frame and float its name above it
    let pointerX = -1;
    let pointerY = -1;

    // transient water droplets thrown up by impacts (throws, wall hits, collisions)
    interface Splash {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      r: number;
    }
    const splashes: Splash[] = [];

    interface Wake {
      x: number;
      y: number;
      life: number; // 1 → 0
      r: number;
    }
    const wakes: Wake[] = [];
    const WAKE_SPEED = 28; // px/s threshold to emit wake (just above cruise)
    const WAKE_INTERVAL = 0.06; // seconds between wake drops per duck

    function spawnSplash(x: number, y: number, power: number) {
      if (splashes.length > 220) return;
      const n = 5 + Math.min(12, (power / 24) | 0);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 60 + Math.random() * power * 0.7;
        splashes.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
          r: 1.5 + Math.random() * 2.5,
        });
      }
    }

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
      if (!activeRef.current || overUI(e)) return setCursor("");
      if (cannon.loaded) return setCursor("crosshair");
      if (overCannon(e.clientX, e.clientY)) return setCursor("pointer");
      if (duckAt(e.clientX, e.clientY)) return setCursor("grab");
      if (overShop(e.clientX, e.clientY)) return setCursor("pointer");
      setCursor("");
    }

    function duckAt(px: number, py: number): Duck | null {
      // topmost first (drawn last = highest y after the per-frame sort)
      for (let i = pool.length - 1; i >= 0; i--) {
        const d = pool[i];
        if (d.inShop || leaving(d)) continue;
        const dh = DUCK_BASE * d.scale;
        const dw = dh * (SW / SH);
        if (px >= d.x - dw / 2 && px <= d.x + dw / 2 && py >= d.y - dh / 2 && py <= d.y + dh / 2)
          return d;
      }
      return null;
    }

    // clicking bare water shoves nearby ducks radially and throws up a splash
    function pokeWater(px: number, py: number) {
      spawnSplash(px, py, 150);
      const R = 150;
      for (const d of pool) {
        if (d.draining || d === dragging) continue;
        const dx = d.x - px;
        const dy = d.y - py;
        const dist = Math.hypot(dx, dy) || 0.001;
        if (dist > R) continue;
        const f = (1 - dist / R) * 160;
        d.vx += (dx / dist) * f;
        d.vy += (dy / dist) * f;
        d.spin = (d.spin ?? 0) + (Math.random() - 0.5) * 6;
        d.entering = false;
      }
    }

    function onPointerDown(e: PointerEvent) {
      if (!activeRef.current || overUI(e)) return;
      // clicking the cannon hub climbs in/out (loaded toggles the aim mode)
      if (e.button === 0 && overCannon(e.clientX, e.clientY)) {
        cannon.loaded = !cannon.loaded;
        if (cannon.loaded) aimCannon(cannon, e.clientX, e.clientY);
        updateHoverCursor(e);
        e.preventDefault();
        return;
      }
      // while loaded, a left-click fires a ball — no water/duck interaction
      if (e.button === 0 && cannon.loaded) {
        if (cannon.cooldown <= 0) {
          aimCannon(cannon, e.clientX, e.clientY);
          const ball = fireCannon(cannon);
          balls.push(ball);
          spawnSplash(ball.x, ball.y, 80);
        }
        e.preventDefault();
        return;
      }
      const d = duckAt(e.clientX, e.clientY);
      if (!d) {
        // clicking the shop (without a duck) opens the collection panel
        if (overShop(e.clientX, e.clientY)) {
          emitShopOpen();
          e.preventDefault();
          return;
        }
        pokeWater(e.clientX, e.clientY);
        return;
      }
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
      pointerX = e.clientX;
      pointerY = e.clientY;
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
      // dropped into the drain: start the drain animation. Saved ducks are
      // protected — they bounce off and keep swimming instead of being flushed.
      if (overDrain(dragging.x, dragging.y)) {
        if (dragging.saved) {
          const d = dragging;
          const a = Math.random() * Math.PI * 2;
          d.vx = Math.cos(a) * 60;
          d.vy = Math.sin(a) * 60;
          d.entering = false;
          dragging = null;
          updateHoverCursor(e);
          toast.info(`${d.name || "Ce canard"} est enregistré et ne peut pas être jeté`);
          return;
        }
        dragging.draining = true;
        dragging.drainT = performance.now();
        dragging.vx = 0;
        dragging.vy = 0;
        dragging = null;
        updateHoverCursor(e);
        return;
      }
      // dropped into the shop: freeze + hide the duck and open the panel. It
      // stays in the pool so it can swim again when the panel closes.
      if (overShop(dragging.x, dragging.y)) {
        const d = dragging;
        d.inShop = true;
        d.vx = 0;
        d.vy = 0;
        dragging = null;
        emitDuckDrop({
          id: d.id,
          variant: d.variant,
          scale: d.scale,
          saved: d.saved ?? false,
          name: d.name ?? "",
          release: () => {
            d.inShop = false;
            const a = Math.random() * Math.PI * 2;
            d.vx = Math.cos(a) * 14;
            d.vy = Math.sin(a) * 14;
            d.entering = false;
          },
          markSaved: (name: string) => {
            d.name = name;
            d.saved = true;
          },
        });
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
      } else if (sp > 220) {
        vx *= 220 / sp;
        vy *= 220 / sp;
      }
      dragging.vx = vx;
      dragging.vy = vy;
      if (Math.hypot(vx, vy) > 90) spawnSplash(dragging.x, dragging.y, Math.hypot(vx, vy));
      dragging = null;
      updateHoverCursor(e);
    }

    // Escape climbs back out of the cannon
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && cannon.loaded) {
        cannon.loaded = false;
        setCursor("");
      }
    }

    const isDark = () => document.documentElement.classList.contains("dark");

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      bounds.w = w;
      bounds.h = h;
      layoutLilyPads(pads, w, h);
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

    // little market stall in the bottom-left corner — the duck shop / collection
    function shopBox() {
      const sw = 64;
      const sh = 58;
      return { x: BORDER + 18, y: h - BORDER - sh - 18, w: sw, h: sh };
    }

    function overShop(px: number, py: number): boolean {
      const s = shopBox();
      const pad = 8;
      return px >= s.x - pad && px <= s.x + s.w + pad && py >= s.y - pad && py <= s.y + s.h + pad;
    }

    function drawShop(now: number, carrying: boolean, hot: boolean, hover: boolean, dark: boolean) {
      const s = shopBox();
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      const roofH = 16;
      const lit = hot || hover;

      ctx.save();
      // hover (no duck carried): gentle bounce + slight scale-up, pivoting at base
      if (hover) {
        const bob = Math.sin(now * 0.008) * 2;
        ctx.translate(cx, s.y + s.h);
        ctx.scale(1.06, 1.06);
        ctx.translate(-cx, -(s.y + s.h) - bob);
      }

      // glow: pulsing gold while carrying a duck, soft blue on plain hover
      if (carrying || hover) {
        const pulse = carrying
          ? 0.35 + Math.sin(now * 0.006) * 0.22 + (hot ? 0.3 : 0)
          : 0.26 + Math.sin(now * 0.008) * 0.12;
        const col = carrying ? "255,224,110" : "150,205,255";
        const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, s.w);
        g.addColorStop(0, `rgba(${col},${Math.max(0, pulse)})`);
        g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(s.x - s.w, s.y - s.h, s.w * 3, s.h * 3);
      }

      // crate body (wood)
      ctx.fillStyle = dark ? "#5b4326" : "#caa46a";
      ctx.beginPath();
      ctx.roundRect(s.x, s.y + roofH, s.w, s.h - roofH, 5);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x + s.w / 2, s.y + roofH + 4);
      ctx.lineTo(s.x + s.w / 2, s.y + s.h - 4);
      ctx.stroke();

      // striped awning roof
      const stripeW = s.w / 6;
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 === 0 ? (dark ? "#c0395a" : "#E0457B") : dark ? "#e4e4ea" : "#FFF7FA";
        ctx.beginPath();
        ctx.moveTo(s.x + i * stripeW, s.y);
        ctx.lineTo(s.x + (i + 1) * stripeW, s.y);
        ctx.lineTo(s.x + (i + 1) * stripeW, s.y + roofH - 5);
        // scalloped lower edge
        ctx.lineTo(s.x + (i + 0.5) * stripeW, s.y + roofH);
        ctx.lineTo(s.x + i * stripeW, s.y + roofH - 5);
        ctx.closePath();
        ctx.fill();
      }

      // small duck silhouette on the crate front
      ctx.fillStyle = lit ? "#FFE066" : dark ? "#f0d9a0" : "#7a5c2e";
      const dx = cx;
      const dy = s.y + roofH + (s.h - roofH) / 2 + 3;
      ctx.beginPath();
      ctx.ellipse(dx - 2, dy + 2, 9, 6, 0, 0, Math.PI * 2); // body
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dx + 6, dy - 4, 5, 0, Math.PI * 2); // head
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(dx + 10, dy - 4); // beak
      ctx.lineTo(dx + 15, dy - 3);
      ctx.lineTo(dx + 10, dy - 1);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
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
      if (d.exiting && d.exitT !== undefined) {
        const progress = Math.min(1, (t - d.exitT) / EXIT_MS);
        const bob = Math.sin(t * 0.003 + d.phase) * 3;
        const dh = DUCK_BASE * d.scale * (1 - progress * 0.25);
        const dw = dh * (d.sprite.width / d.sprite.height);
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.translate(d.x, d.y + bob);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(d.sprite, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
        ctx.globalAlpha = 1;
        return;
      }

      if (d.storing && d.storeT !== undefined) {
        const progress = Math.min(1, (t - d.storeT) / STORE_MS);
        const s = shopBox();
        const tx = s.x + s.w / 2;
        const ty = s.y + s.h / 2;
        // ease-in toward the crate; a small hop up at the start before diving in
        const ease = progress * progress;
        const hop = Math.sin(progress * Math.PI) * 18;
        const drawX = d.x + (tx - d.x) * ease;
        const drawY = d.y + (ty - d.y) * ease - hop;
        const shrink = 1 - ease;
        const dh = DUCK_BASE * d.scale * shrink;
        const dw = dh * (d.sprite.width / d.sprite.height);

        ctx.save();
        ctx.globalAlpha = 1 - ease * ease;
        ctx.translate(drawX, drawY);
        ctx.rotate(progress * 0.7); // tips over as it files away
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(d.sprite, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
        ctx.globalAlpha = 1;
        return;
      }

      if (d.draining && d.drainT !== undefined) {
        const progress = Math.min(1, (t - d.drainT) / DRAIN_MS);
        const dr = drain();
        // ease-in: slow start then accelerate toward the hole
        const ease = progress * progress;
        const drawX = d.x + (dr.x - d.x) * ease;
        const drawY = d.y + (dr.y - d.y) * ease;
        const shrink = 1 - ease;
        const dh = DUCK_BASE * d.scale * shrink;
        const dw = dh * (d.sprite.width / d.sprite.height);
        const spin = ease * Math.PI * 4; // 2 full rotations

        ctx.save();
        ctx.globalAlpha = 1 - ease * ease;
        ctx.translate(drawX, drawY);
        ctx.rotate(spin);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(d.sprite, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
        ctx.globalAlpha = 1;
        return;
      }

      const bob = Math.sin(t * 0.003 + d.phase) * 3;
      const idle = Math.sin(t * 0.003 + d.phase + 1) * 0.05;
      const dh = DUCK_BASE * d.scale;
      const dw = dh * (d.sprite.width / d.sprite.height);
      const flip = d.vx < 0 ? -1 : 1;
      // lean follows the flip so the leading edge dips either way; spin is added flat
      const tilt = (idle + (d.lean ?? 0)) * flip + (d.spinAngle ?? 0);

      // contact shadow
      ctx.fillStyle = "rgba(0,0,0,0.14)";
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + dh * 0.42, dw * 0.36, dh * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // glowing aura behind the duck — cyan for glow, amber for golden, cold blue for ghost
      if (d.effect === "glow" || d.effect === "golden" || d.effect === "ghost") {
        const pulse =
          d.effect === "ghost"
            ? 0.18 + Math.sin(t * 0.0022 + d.phase) * 0.1
            : 0.35 + Math.sin(t * 0.004 + d.phase) * 0.1;
        const col =
          d.effect === "golden"
            ? "255,210,50"
            : d.effect === "ghost"
              ? "190,215,255"
              : "140,235,255";
        const radius = d.effect === "ghost" ? dw * 1.1 : dw * 0.9;
        const gr = ctx.createRadialGradient(d.x, d.y + bob, dw * 0.1, d.x, d.y + bob, radius);
        gr.addColorStop(0, `rgba(${col},${pulse})`);
        gr.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(d.x, d.y + bob, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // duck
      ctx.save();
      ctx.globalAlpha = d.effect === "ghost" ? 0.5 : 1;
      ctx.translate(d.x, d.y + bob);
      ctx.rotate(tilt);
      ctx.scale(flip, 1);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(d.sprite, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();

      // sparkles orbiting: gold for galaxy/magic, rainbow-cycling for prismatic (rainbow duck)
      if (d.effect === "sparkle" || d.effect === "prismatic") {
        const count = d.effect === "prismatic" ? 6 : 4;
        for (let i = 0; i < count; i++) {
          const a = t * 0.001 + i * ((Math.PI * 2) / count) + d.phase;
          const tw = (Math.sin(t * 0.006 + i * 2) + 1) / 2;
          const sx = d.x + Math.cos(a) * dw * 0.52;
          const sy = d.y + bob + Math.sin(a) * dh * 0.47;
          const r = 1 + tw * 2.5;
          const color =
            d.effect === "prismatic"
              ? `hsla(${(t * 0.08 + i * 60) % 360},100%,70%,${0.35 + tw * 0.6})`
              : `rgba(255,240,150,${0.3 + tw * 0.6})`;
          ctx.fillStyle = color;
          ctx.fillRect(sx - r, sy - 0.6, r * 2, 1.2);
          ctx.fillRect(sx - 0.6, sy - r, 1.2, r * 2);
        }
      }

      // bubbles rising off the duck (snorkel)
      if (d.effect === "bubbles") {
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const p = (t * 0.0006 + d.phase + i * 0.37) % 1;
          const bx = d.x + dw * 0.28 + Math.sin(t * 0.002 + i * 2 + d.phase) * 8;
          const by = d.y + bob - dh * 0.15 - p * dh * 0.9;
          ctx.beginPath();
          ctx.arc(bx, by, (1.4 + i * 0.7) * (1 - p * 0.4), 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // green ooze dripping downward (zombie duck)
      if (d.effect === "ooze") {
        for (let i = 0; i < 3; i++) {
          const p = (t * 0.0005 + d.phase + i * 0.38) % 1;
          const bx = d.x - dw * 0.12 + Math.sin(t * 0.0015 + i * 1.9 + d.phase) * 9;
          const by = d.y + bob + dh * 0.25 + p * dh * 0.65;
          const r = (2.2 + i * 0.9) * (1 - p * 0.25);
          ctx.beginPath();
          ctx.arc(bx, by, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(80,190,55,${0.18 * (1 - p * 0.7)})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(60,160,40,${0.55 * (1 - p)})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // electric arcs around the metal duck — deterministic hash, no Math.random()
      if (d.effect === "electric") {
        const tick = (t * 0.007 + d.phase * 10) | 0;
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const h0 = Math.sin(tick * 127.1 + i * 43.7);
          if (h0 < 0) continue; // ~50% of arcs visible per tick
          const h1 = Math.sin(tick * 311.7 + i * 89.3);
          const h2 = Math.sin(tick * 157.3 + i * 61.1);
          const h3 = Math.sin(tick * 293.9 + i * 37.7);
          const a1 = h1 * Math.PI * 2;
          const sx = d.x + Math.cos(a1) * dw * 0.46;
          const sy = d.y + bob + Math.sin(a1) * dh * 0.42;
          const ex = sx + h2 * 13;
          const ey = sy + h3 * 13;
          const mx = (sx + ex) / 2 + h3 * 5;
          const my = (sy + ey) / 2 + h2 * 5;
          const alpha = 0.55 + Math.abs(h0) * 0.4;
          ctx.strokeStyle = `rgba(190,230,255,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(mx, my, ex, ey);
          ctx.stroke();
        }
      }
    }

    const RARITY_STARS: Record<string, string> = {
      legendary: "★★★",
      rare: "★★",
      uncommon: "★",
      common: "☆",
    };
    const RARITY_COLOR: Record<string, string> = {
      legendary: "#fbbf24",
      rare: "#60a5fa",
      uncommon: "#4ade80",
      common: "rgba(140,140,160,0.85)",
    };

    // floating star pill above a hovered unnamed duck
    function drawRarityPill(d: Duck, t: number) {
      const bob = Math.sin(t * 0.003 + d.phase) * 3;
      const dh = DUCK_BASE * d.scale;
      const rarity = getRarity(d.variant);
      const starsText = RARITY_STARS[rarity];
      const starsColor = RARITY_COLOR[rarity];

      ctx.font = "bold 12px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const sw = ctx.measureText(starsText).width;
      const padX = 7;
      const bw = sw + padX * 2;
      const bh = 20;
      const cx = d.x;
      const by = d.y + bob - dh * 0.5 - bh - 4;

      ctx.fillStyle = "rgba(15,23,42,0.85)";
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - bw / 2, by, bw, bh, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = starsColor;
      ctx.fillText(starsText, cx, by + bh / 2 + 0.5);
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";
    }

    // floating name tag with rarity stars above a hovered named duck
    function drawNameLabel(d: Duck, t: number) {
      const bob = Math.sin(t * 0.003 + d.phase) * 3;
      const dh = DUCK_BASE * d.scale;
      const rarity = getRarity(d.variant);
      const starsText = RARITY_STARS[rarity];
      const starsColor = RARITY_COLOR[rarity];

      ctx.textBaseline = "middle";
      ctx.font = "600 13px ui-sans-serif, system-ui, sans-serif";
      const nameW = ctx.measureText(d.name!).width;
      ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
      const starsW = ctx.measureText(starsText).width;

      const gap = 7;
      const totalW = nameW + gap + starsW;
      const padX = 9;
      const bw = totalW + padX * 2;
      const bh = 22;
      const cx = d.x;
      const by = d.y + bob - dh * 0.5 - bh - 4;
      const tip = 5;

      ctx.fillStyle = "rgba(15,23,42,0.9)";
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - bw / 2, by, bw, bh, 6);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - tip, by + bh - 0.5);
      ctx.lineTo(cx + tip, by + bh - 0.5);
      ctx.lineTo(cx, by + bh + tip);
      ctx.closePath();
      ctx.fillStyle = "rgba(15,23,42,0.9)";
      ctx.fill();

      const labelMid = by + bh / 2 + 0.5;
      const nameStartX = cx - totalW / 2;
      ctx.font = "600 13px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(d.name!, nameStartX, labelMid);

      ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = starsColor;
      ctx.fillText(starsText, nameStartX + nameW + gap, labelMid);

      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";
    }

    function updateWakes(dt: number) {
      for (let i = wakes.length - 1; i >= 0; i--) {
        wakes[i].life -= dt * 3.5; // ~0.28s lifetime
        if (wakes[i].life <= 0) wakes.splice(i, 1);
      }
    }

    function drawWakes(dark: boolean) {
      ctx.fillStyle = dark ? "rgba(180,220,255,0.7)" : "rgba(255,255,255,0.8)";
      for (const w of wakes) {
        ctx.globalAlpha = Math.max(0, w.life) * 0.8;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r * w.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function updateSplashes(dt: number) {
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const drag = Math.pow(0.04, dt); // droplets brake fast as they land
        s.vx *= drag;
        s.vy *= drag;
        s.life -= dt * 2.4; // ~0.4s lifetime
        if (s.life <= 0) splashes.splice(i, 1);
      }
    }

    function drawSplashes(dark: boolean) {
      ctx.fillStyle = dark ? "rgba(200,235,255,0.9)" : "#ffffff";
      for (const s of splashes) {
        ctx.globalAlpha = Math.max(0, s.life) * 0.85;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * (0.4 + s.life * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    const DRAIN_MS = 900;
    const STORE_MS = 600;
    const EXIT_MS = 450;
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
      drawDrain(now, !!(dragging && !dragging.saved && overDrain(dragging.x, dragging.y)), dark);
      drawShop(
        now,
        dragging !== null,
        !!(dragging && overShop(dragging.x, dragging.y)),
        !dragging && overShop(pointerX, pointerY),
        dark,
      );
      if (cannon.loaded && pointerX >= 0) aimCannon(cannon, pointerX, pointerY);
      drawCannon(ctx, cannon, now, dark);

      // remove ducks whose exit animation (drain / reserve / cull) has finished
      for (let i = pool.length - 1; i >= 0; i--) {
        const d = pool[i];
        if (d.draining && d.drainT !== undefined && now - d.drainT >= DRAIN_MS) {
          pool.splice(i, 1);
        } else if (d.storing && d.storeT !== undefined && now - d.storeT >= STORE_MS) {
          pool.splice(i, 1);
        } else if (d.exiting && d.exitT !== undefined && now - d.exitT >= EXIT_MS) {
          pool.splice(i, 1);
        }
      }

      const b = inner();
      for (const d of pool) {
        if (d === dragging || leaving(d) || d.inShop) continue; // held, leaving, or in the shop
        d.x += d.vx * dt;
        d.y += d.vy * dt;

        // wake trail when moving fast
        const spd = Math.hypot(d.vx, d.vy);
        if (spd > WAKE_SPEED && wakes.length < 400) {
          d.wakeTimer = (d.wakeTimer ?? 0) - dt;
          if (d.wakeTimer <= 0) {
            d.wakeTimer = WAKE_INTERVAL;
            const nx = -d.vx / spd;
            const ny = -d.vy / spd;
            const dh = DUCK_BASE * (d.scale ?? 1);
            const waterY = d.y + dh * 0.2;
            const tail = dh * 0.28;
            const spread = tail * 0.5;
            wakes.push({
              x: d.x + nx * tail + (Math.random() - 0.5) * 6,
              y: waterY + ny * tail + (Math.random() - 0.5) * 6,
              life: 1,
              r: 3 + Math.random() * 2,
            });
            wakes.push({
              x: d.x + nx * tail + ny * spread + (Math.random() - 0.5) * 4,
              y: waterY + ny * tail - nx * spread + (Math.random() - 0.5) * 4,
              life: 1,
              r: 2 + Math.random() * 2,
            });
            wakes.push({
              x: d.x + nx * tail - ny * spread + (Math.random() - 0.5) * 4,
              y: waterY + ny * tail + nx * spread + (Math.random() - 0.5) * 4,
              life: 1,
              r: 2 + Math.random() * 2,
            });
          }
        } else {
          d.wakeTimer = 0;
        }

        // heading: ease a pitch toward vertical travel (left/right is the flip)
        const targetLean = Math.max(-0.4, Math.min(0.4, d.vy / 140));
        d.lean = (d.lean ?? 0) + (targetLean - (d.lean ?? 0)) * Math.min(1, dt * 5);

        // spin: integrate angular velocity, then unwind back to upright at rest
        if (d.spin) {
          d.spinAngle = (d.spinAngle ?? 0) + d.spin * dt;
          d.spin *= Math.pow(0.25, dt);
          if (Math.abs(d.spin) < 0.05) d.spin = 0;
        } else if (d.spinAngle) {
          let a = d.spinAngle % (Math.PI * 2);
          if (a > Math.PI) a -= Math.PI * 2;
          if (a < -Math.PI) a += Math.PI * 2;
          d.spinAngle = Math.abs(a) < 0.01 ? 0 : a * Math.pow(0.08, dt);
        }

        if (d.entering) {
          // let it swim in freely until it's fully inside the pool
          if (d.x >= b.minX && d.x <= b.maxX && d.y >= b.minY && d.y <= b.maxY) d.entering = false;
          continue;
        }
        const WALL_SPLASH = 80;
        if (d.x < b.minX) {
          d.x = b.minX;
          if (d.vx < -WALL_SPLASH) spawnSplash(d.x, d.y, -d.vx);
          d.vx = Math.abs(d.vx);
        }
        if (d.x > b.maxX) {
          d.x = b.maxX;
          if (d.vx > WALL_SPLASH) spawnSplash(d.x, d.y, d.vx);
          d.vx = -Math.abs(d.vx);
        }
        if (d.y < b.minY) {
          d.y = b.minY;
          if (d.vy < -WALL_SPLASH) spawnSplash(d.x, d.y, -d.vy);
          d.vy = Math.abs(d.vy);
        }
        if (d.y > b.maxY) {
          d.y = b.maxY;
          if (d.vy > WALL_SPLASH) spawnSplash(d.x, d.y, d.vy);
          d.vy = -Math.abs(d.vy);
        }
        // random boost: 5% chance per second to charge at high speed for 3s
        if (!d.boostTimer && !d.entering && Math.random() < 0.005 * dt) {
          d.boostTimer = 3;
          const a = Math.random() * Math.PI * 2;
          const boostSpd = 90 + Math.random() * 40;
          d.vx = Math.cos(a) * boostSpd;
          d.vy = Math.sin(a) * boostSpd;
        }
        if (d.boostTimer) d.boostTimer = Math.max(0, d.boostTimer - dt);

        // thrown momentum bleeds off: any speed above the gentle cruise decays
        // back toward it, so a hard fling glides and slows like it's in water.
        const sp0 = Math.hypot(d.vx, d.vy);
        const CRUISE = d.boostTimer ? 95 : 22;
        if (sp0 > CRUISE) {
          const decay = d.boostTimer ? 0.98 : 0.6;
          const target = CRUISE + (sp0 - CRUISE) * Math.pow(decay, dt);
          d.vx *= target / sp0;
          d.vy *= target / sp0;
        }
        // only wander once the duck has settled to cruise speed, otherwise the
        // 26 px/s clamp would instantly kill an in-flight throw.
        if (!d.boostTimer && sp0 <= CRUISE && Math.random() < 0.01) {
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

      // duck-duck collisions: separate overlapping pairs (lighter duck yields
      // more) and resolve the bounce with mass taken from each duck's scale.
      for (let i = 0; i < pool.length; i++) {
        const a = pool[i];
        if (a === dragging || leaving(a) || a.entering || a.inShop) continue;
        const ar = DUCK_BASE * a.scale * 0.32;
        for (let j = i + 1; j < pool.length; j++) {
          const c = pool[j];
          if (c === dragging || leaving(c) || c.entering || c.inShop) continue;
          const cr = DUCK_BASE * c.scale * 0.32;
          const dx = c.x - a.x;
          const dy = c.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const min = ar + cr;
          if (dist >= min) continue;
          const nx = dx / dist;
          const ny = dy / dist;
          const ma = a.scale;
          const mb = c.scale;
          const sum = ma + mb;
          const pen = min - dist;
          a.x -= nx * pen * (mb / sum);
          a.y -= ny * pen * (mb / sum);
          c.x += nx * pen * (ma / sum);
          c.y += ny * pen * (ma / sum);
          const vn = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
          if (vn < 0) {
            const e = 0.92; // restitution: bouncy but bleeds a little energy
            const jimp = (-(1 + e) * vn) / (1 / ma + 1 / mb);
            a.vx -= (jimp / ma) * nx;
            a.vy -= (jimp / ma) * ny;
            c.vx += (jimp / mb) * nx;
            c.vy += (jimp / mb) * ny;
            // glancing hits spin the ducks (tangential relative velocity)
            const vt = (c.vx - a.vx) * -ny + (c.vy - a.vy) * nx;
            a.spin = Math.max(-12, Math.min(12, (a.spin ?? 0) + vt * 0.03));
            c.spin = Math.max(-12, Math.min(12, (c.spin ?? 0) - vt * 0.03));
            if (-vn > 70) spawnSplash((a.x + c.x) / 2, (a.y + c.y) / 2, -vn);
          }
        }
      }

      // tennis balls in flight: move them, then shove any duck they strike
      updateCannon(cannon, dt);
      updateBalls(balls, dt, w, h);
      for (const ball of balls) {
        for (const d of pool) {
          if (d === dragging || leaving(d) || d.inShop) continue;
          const dr = DUCK_BASE * d.scale * 0.32;
          const dx = d.x - ball.x;
          const dy = d.y - ball.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          if (dist >= dr + ball.r) continue;
          const nx = dx / dist;
          const ny = dy / dist;
          const bs = Math.hypot(ball.vx, ball.vy);
          d.vx += nx * (70 + bs * 0.5);
          d.vy += ny * (70 + bs * 0.5);
          d.spin = Math.max(-12, Math.min(12, (d.spin ?? 0) + (Math.random() - 0.5) * 9));
          d.entering = false;
          const vn = ball.vx * nx + ball.vy * ny;
          if (vn > 0) {
            ball.vx -= 2 * vn * nx;
            ball.vy -= 2 * vn * ny;
          }
          ball.vx *= 0.45;
          ball.vy *= 0.45;
          spawnSplash(ball.x, ball.y, 130);
        }
      }

      // lily pads: bumped by ducks and balls, then spring back to rest
      for (const p of pads) {
        for (const d of pool) {
          if (d === dragging || leaving(d) || d.inShop || d.entering) continue;
          const dr = DUCK_BASE * d.scale * 0.32;
          const hit = bumpLilyPad(p, d.x, d.y, d.vx, d.vy, dr);
          if (hit) {
            d.vx -= hit.nx * 9;
            d.vy -= hit.ny * 9;
          }
        }
        for (const ball of balls) bumpLilyPad(p, ball.x, ball.y, ball.vx, ball.vy, ball.r);
      }
      updateLilyPads(pads, dt);

      updateSplashes(dt);
      updateWakes(dt);
      pool.sort((a, c) => a.y - c.y);
      drawWakes(dark);
      for (const p of pads) drawLilyPad(ctx, p, now, dark);
      for (const d of pool) if (!d.inShop) drawDuck(d, now);
      drawBalls(ctx, balls);
      drawSplashes(dark);

      // name tag and rarity stars of the duck currently under the cursor (not while dragging)
      if (!dragging) {
        const hovered = duckAt(pointerX, pointerY);
        if (hovered) {
          if (hovered.name) drawNameLabel(hovered, now);
          else drawRarityPill(hovered, now);
        }
      }
    }

    resize();
    ensureSpawning();
    registerInjector(spawnSavedDuck); // flush any saved ducks queued before mount
    registerRemover(removePoolDuck);
    registerReleaser(unmarkSavedDuck);
    registerCounter(() => pool.filter((d) => !leaving(d) && !d.inShop).length);
    registerShopHitTest((x, y) => overShop(x, y));
    registerVariantSpawner((v) => enterPool(v, 0.55 + Math.random() * 0.3));
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    const clearPointer = () => {
      pointerX = -1;
      pointerY = -1;
    };
    window.addEventListener("blur", clearPointer);
    raf = requestAnimationFrame(frame);

    // Note: the ducks (pool) are intentionally kept alive at module scope so
    // they persist if the component remounts. The spawn timer, however, is
    // stopped here so it does not keep firing while unmounted (summer disabled).
    return () => {
      cancelAnimationFrame(raf);
      stopSpawning();
      registerInjector(null);
      registerRemover(null);
      registerReleaser(null);
      registerCounter(null);
      registerShopHitTest(null);
      registerVariantSpawner(null);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", clearPointer);
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
