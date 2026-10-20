import { createRng, outlinePixels } from "../../textures/pixel";

// Toile basse définition, affichée deux fois plus grande en pixels nets.
export const LW = 160,
  LH = 90;
// les vues des jeux restent dans les unités des maquettes (320 x 180)
export const U = LW / 320;
export const TAU = Math.PI * 2;

export type Ctx = CanvasRenderingContext2D;
export type Pal = Record<string, string>;

export function rect(c: Ctx, x: number, y: number, w: number, h: number, col: string) {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// Anneau sans anticrénelage entre r0 et r1, tracé ligne par ligne (r0 = 0 : disque).
export function ring(c: Ctx, cx: number, cy: number, r0: number, r1: number, col: string) {
  c.fillStyle = col;
  for (let y = Math.floor(cy - r1); y <= Math.ceil(cy + r1); y++) {
    const dy = y + 0.5 - cy;
    if (Math.abs(dy) >= r1) continue;
    const xo = Math.sqrt(r1 * r1 - dy * dy);
    const l = Math.round(cx - xo),
      r = Math.round(cx + xo);
    if (Math.abs(dy) >= r0) {
      c.fillRect(l, y, r - l, 1);
      continue;
    }
    const xi = Math.sqrt(r0 * r0 - dy * dy);
    const il = Math.round(cx - xi),
      ir = Math.round(cx + xi);
    c.fillRect(l, y, il - l, 1);
    c.fillRect(ir, y, r - ir, 1);
  }
}

export const angleGap = (a: number, b: number) => {
  const d = (((a - b) % TAU) + TAU) % TAU;
  return Math.min(d, TAU - d);
};

// Portion d'anneau autour de l'angle `at` (0 en haut, sens horaire), à +-half.
export function arc(
  c: Ctx,
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  at: number,
  half: number,
  col: string,
) {
  c.fillStyle = col;
  for (let y = Math.floor(cy - r1); y <= Math.ceil(cy + r1); y++)
    for (let x = Math.floor(cx - r1); x <= Math.ceil(cx + r1); x++) {
      const dx = x + 0.5 - cx,
        dy = y + 0.5 - cy;
      const d = Math.hypot(dx, dy);
      if (d >= r0 && d < r1 && angleGap(Math.atan2(dx, -dy), at) <= half) c.fillRect(x, y, 1, 1);
    }
}

export function line(c: Ctx, x0: number, y0: number, x1: number, y1: number, col: string) {
  c.fillStyle = col;
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++)
    c.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
}

// Sprite en grille de caractères, contour sombre compris (1 pixel de marge).
export function makeSprite(rows: string[], pal: Pal) {
  let s: HTMLCanvasElement | null = null;
  return () => {
    if (s) return s;
    const w = rows[0].length + 2,
      h = rows.length + 2;
    s = document.createElement("canvas");
    s.width = w;
    s.height = h;
    const g = s.getContext("2d")!;
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => pal[ch] && rect(g, x + 1, y + 1, 1, 1, pal[ch])),
    );
    const img = g.getImageData(0, 0, w, h);
    img.data.set(outlinePixels(img.data, w, h));
    g.putImageData(img, 0, 0);
    return s;
  };
}

// (x, y) : coin haut gauche du dessin, hors contour
export function blit(c: Ctx, img: HTMLCanvasElement, x: number, y: number, scale = 1) {
  c.drawImage(
    img,
    Math.round(x) - scale,
    Math.round(y) - scale,
    img.width * scale,
    img.height * scale,
  );
}

// rotation autour du point (ox, oy) du dessin, posé en (x, y)
export function blitRot(
  c: Ctx,
  img: HTMLCanvasElement,
  x: number,
  y: number,
  angle: number,
  ox: number,
  oy: number,
) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.rotate(angle);
  c.drawImage(img, -ox - 1, -oy - 1);
  c.restore();
}

// Décor fixe d'un jeu, dessiné une seule fois.
export function backdrop(draw: (g: Ctx, rng: () => number) => void, seed = 7) {
  let s: HTMLCanvasElement | null = null;
  return () => {
    if (s) return s;
    s = document.createElement("canvas");
    s.width = LW;
    s.height = LH;
    draw(s.getContext("2d")!, createRng(seed));
    return s;
  };
}

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  life: number;
  col: string;
  floor: number;
}

// Petites particules d'un pixel (terre, eau, pétales), retirées au sol ou en fin de vie.
export function particles(gravity = 140, onLand?: (x: number, y: number) => void) {
  const bits: Bit[] = [];
  let last = 0;
  return {
    burst(
      x: number,
      y: number,
      n: number,
      cols: readonly string[],
      { speed = 30, up = 30, life = 0.6, floor = Infinity } = {},
    ) {
      for (let i = 0; i < n; i++)
        bits.push({
          x,
          y,
          vx: (Math.random() * 2 - 1) * speed,
          vy: -up * (0.4 + Math.random() * 0.6),
          t: 0,
          life: life * (0.6 + Math.random() * 0.6),
          col: cols[i % cols.length],
          floor,
        });
    },
    draw(c: Ctx, now: number) {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.t += dt;
        b.vy += gravity * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.t >= b.life || b.y >= b.floor) {
          if (b.y >= b.floor) onLand?.(b.x, b.floor);
          bits.splice(i, 1);
          continue;
        }
        rect(c, b.x, b.y, 1, 1, b.col);
      }
    },
  };
}

export const blink = (now: number, periodMs = 500) => Math.floor(now / periodMs) % 2 === 0;
export const bob = (now: number, amp = 1, periodMs = 900) =>
  Math.round(Math.sin((now / periodMs) * TAU) * amp);
