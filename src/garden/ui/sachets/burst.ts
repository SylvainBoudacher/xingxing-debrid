import type { Rng } from "../../core/rolls";

export type BurstKind = "paper" | "sparks" | "rays" | "gold";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  star: boolean;
  life: number;
  max: number;
}

export interface Ray {
  x: number;
  y: number;
  color: string;
  life: number;
  max: number;
}

export interface Burst {
  parts: Particle[];
  rays: Ray[];
  flash: number;
}

interface Recipe {
  count: number;
  colors: string[];
  speed: [number, number];
  life: [number, number];
  size: [number, number];
  star: boolean;
  gravity: number;
  ray?: { color: string; life: number };
  flash?: number;
}

export const MAX_PARTICLES = 160;
const DRAG = 1.8;
const FLASH_FADE = 2.5;

// Vitesses en px/s, gravité en px/s².
const RECIPES: Record<BurstKind, Recipe> = {
  paper: {
    count: 36,
    colors: ["#caa46a", "#a9804a", "#e8d3a8"],
    speed: [180, 420],
    life: [0.8, 1.4],
    size: [4, 8],
    star: false,
    gravity: 900,
  },
  sparks: {
    count: 24,
    colors: ["#6db6f0", "#dff2ff"],
    speed: [120, 300],
    life: [0.5, 0.9],
    size: [6, 10],
    star: true,
    gravity: 0,
  },
  rays: {
    count: 28,
    colors: ["#be8cf0", "#e0c8ff"],
    speed: [80, 240],
    life: [0.9, 1.5],
    size: [3, 6],
    star: false,
    gravity: -60,
    ray: { color: "#be8cf0", life: 1.4 },
  },
  gold: {
    count: 90,
    colors: ["#f3c34a", "#fff1b0", "#ffe38a"],
    speed: [150, 520],
    life: [1.4, 2.4],
    size: [4, 10],
    star: true,
    gravity: 220,
    ray: { color: "#f3c34a", life: 2.6 },
    flash: 1,
  },
};

const between = (rng: Rng, [a, b]: [number, number]) => a + rng() * (b - a);

export const newBurst = (): Burst => ({ parts: [], rays: [], flash: 0 });

// calm : mouvement réduit, les particules restent mais ni rayons tournants ni flash.
export function emit(
  b: Burst,
  kind: BurstKind,
  x: number,
  y: number,
  rng: Rng = Math.random,
  calm = false,
) {
  const r = RECIPES[kind];
  const n = Math.min(r.count, Math.max(0, MAX_PARTICLES - b.parts.length));
  for (let i = 0; i < n; i++) {
    const ang = rng() * Math.PI * 2;
    const speed = between(rng, r.speed);
    const life = between(rng, r.life);
    b.parts.push({
      x,
      y,
      vx: Math.cos(ang) * speed,
      // ce qui retombe part d'abord vers le haut
      vy: Math.sin(ang) * speed - (r.gravity > 0 ? speed * 0.4 : 0),
      g: r.gravity,
      rot: rng() * Math.PI * 2,
      vr: (rng() - 0.5) * 12,
      size: between(rng, r.size),
      color: r.colors[Math.min(r.colors.length - 1, Math.floor(rng() * r.colors.length))],
      star: r.star,
      life,
      max: life,
    });
  }
  if (calm) return;
  if (r.ray) b.rays.push({ x, y, color: r.ray.color, life: r.ray.life, max: r.ray.life });
  if (r.flash) b.flash = Math.max(b.flash, r.flash);
}

export function stepBurst(b: Burst, dt: number) {
  const keep = Math.max(0, 1 - DRAG * dt);
  for (const p of b.parts) {
    p.life -= dt;
    p.vx *= keep;
    p.vy = p.vy * keep + p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
  }
  b.parts = b.parts.filter((p) => p.life > 0);
  for (const r of b.rays) r.life -= dt;
  b.rays = b.rays.filter((r) => r.life > 0);
  b.flash = Math.max(0, b.flash - FLASH_FADE * dt);
}

export const isIdle = (b: Burst): boolean => !b.parts.length && !b.rays.length && b.flash === 0;
