import type { Rarity } from "../../core/types";

export const CARD_SCALE = 2;
export const CARD_PAD = 8;
const W = 48 * CARD_SCALE;
const H = 72 * CARD_SCALE;
export const CARD_W = W + 2 * CARD_PAD;
export const CARD_H = H + CARD_PAD;
const CX = CARD_W / 2;
const HEAD_Y = CARD_PAD + H * 0.3;
const MAX_PARTS = 12;

type Kind = "spark" | "mote" | "glitter";

interface Particle {
  kind: Kind;
  x: number;
  y: number;
  vy: number;
  life: number;
  max: number;
}

export interface CardFxState {
  sprite: HTMLCanvasElement;
  glow: HTMLCanvasElement | null;
  rarity: Rarity;
  parts: Particle[];
}

const makeCanvas = () =>
  Object.assign(document.createElement("canvas"), { width: CARD_W, height: CARD_H });

function tinted(sprite: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const cv = makeCanvas();
  const g = cv.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  g.drawImage(sprite, CARD_PAD, CARD_PAD, W, H);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = color;
  g.fillRect(0, 0, CARD_W, CARD_H);
  return cv;
}

export function createCardFx(sprite: HTMLCanvasElement, rarity: Rarity): CardFxState {
  return {
    sprite,
    glow: rarity === "epique" ? tinted(sprite, "#c9a0ff") : null,
    rarity,
    parts: [],
  };
}

function star(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  a: number,
) {
  const s = CARD_SCALE;
  g.globalAlpha = Math.max(0, a);
  g.fillStyle = color;
  g.fillRect(Math.round(x) - s / 2, Math.round(y) - r, s, r * 2);
  g.fillRect(Math.round(x) - r, Math.round(y) - s / 2, r * 2, s);
  g.globalAlpha = 1;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function emit(fx: CardFxState, dt: number, rate: number, make: () => Particle) {
  if (fx.parts.length < MAX_PARTS && Math.random() < dt * rate) fx.parts.push(make());
}

function drawLegendary(g: CanvasRenderingContext2D, t: number) {
  const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
  const halo = g.createRadialGradient(CX, HEAD_Y, 4, CX, HEAD_Y, CARD_W * 0.6);
  halo.addColorStop(0, `rgba(255,220,120,${0.45 * (0.7 + 0.3 * pulse)})`);
  halo.addColorStop(1, "rgba(255,200,80,0)");
  g.fillStyle = halo;
  g.fillRect(0, 0, CARD_W, CARD_H);
  g.save();
  g.translate(CX, HEAD_Y);
  g.rotate(t * 0.2);
  g.fillStyle = "rgba(255,230,150,0.14)";
  for (let k = 0; k < 8; k++) {
    g.rotate(Math.PI / 4);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(-5, -CARD_W * 0.7);
    g.lineTo(5, -CARD_W * 0.7);
    g.fill();
  }
  g.restore();
}

function spawnParticles(fx: CardFxState, dt: number) {
  const left = CARD_PAD + 10;
  const right = CARD_W - CARD_PAD - 10;
  if (fx.rarity === "rare")
    emit(fx, dt, 5, () => ({
      kind: "spark",
      x: rand(left, right),
      y: rand(CARD_PAD, HEAD_Y + 30),
      vy: 0,
      life: 0.6,
      max: 0.6,
    }));
  if (fx.rarity === "epique")
    emit(fx, dt, 4, () => ({
      kind: "mote",
      x: rand(left, right),
      y: rand(HEAD_Y, CARD_H - 20),
      vy: -30,
      life: 2,
      max: 2,
    }));
  if (fx.rarity === "legendaire")
    emit(fx, dt, 5, () => ({
      kind: "glitter",
      x: rand(CARD_PAD, CARD_W - CARD_PAD),
      y: rand(HEAD_Y - 20, CARD_H - 30),
      vy: -12,
      life: 2.5,
      max: 2.5,
    }));
}

// Une image de la carte : halo, sprite puis particules. Fond transparent.
export function drawCardFx(g: CanvasRenderingContext2D, fx: CardFxState, t: number, dt: number) {
  g.clearRect(0, 0, CARD_W, CARD_H);
  g.imageSmoothingEnabled = false;
  if (fx.rarity === "legendaire") drawLegendary(g, t);
  if (fx.glow) {
    g.globalAlpha = 0.9 * (0.6 + 0.4 * Math.sin(t * 2));
    for (const [dx, dy] of [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
      [-1, -1],
      [1, 1],
      [-1, 1],
      [1, -1],
    ])
      g.drawImage(fx.glow, dx * CARD_SCALE, dy * CARD_SCALE);
    g.globalAlpha = 1;
  }
  g.drawImage(fx.sprite, CARD_PAD, CARD_PAD, W, H);

  spawnParticles(fx, dt);
  const s = CARD_SCALE;
  for (const p of fx.parts) {
    p.life -= dt;
    p.y += p.vy * dt;
    const fade = Math.min(1, p.life);
    if (p.kind === "spark")
      star(g, p.x, p.y, s * 3, "#dff2ff", Math.sin((p.life / p.max) * Math.PI));
    else if (p.kind === "glitter") star(g, p.x, p.y, s * 1.5, "#fff1b0", fade);
    else {
      g.globalAlpha = Math.max(0, fade);
      g.fillStyle = "#e0c8ff";
      g.fillRect(Math.round(p.x / s) * s, Math.round(p.y / s) * s, s, s);
      g.globalAlpha = 1;
    }
  }
  fx.parts = fx.parts.filter((p) => p.life > 0);
}
