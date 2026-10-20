import type { DesherberView } from "../../core/minigames/desherber";
import { backdrop, blit, line, particles, rect, type Ctx } from "./pixelKit";
import {
  C,
  CLODS,
  gauge,
  grass,
  innerOf,
  level,
  pointer,
  SOIL,
  SOIL_DARK,
  vignette,
} from "./scenery";
import { WEED } from "./sprites";

// coupe du sol vue de côté : surface à GROUND
const GROUND = 50,
  WX = 50,
  LIFT = 24,
  ROOT = 16;
const T = { x: 98, y: 8, w: 14, h: 74 },
  P = { x: 132, y: 20, w: 10, h: 62 };
const tension = innerOf(T),
  pulled = innerOf(P);
const ROOTS = [-7, -3, 0, 4, 8];

const bg = backdrop((g, rng) => {
  grass(g, rng, 0, 0, 160, GROUND);
  for (let y = GROUND; y < 90; y++)
    for (let x = 0; x < 160; x++) {
      const deep = (y - GROUND) / 40;
      const r = rng();
      rect(
        g,
        x,
        y,
        1,
        1,
        r < 0.08
          ? SOIL_DARK[0]
          : r < 0.14
            ? SOIL[3]
            : deep > 0.5
              ? SOIL_DARK[2]
              : SOIL[r < 0.5 ? 1 : 2],
      );
    }
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(rng() * 150),
      y = GROUND + 6 + Math.floor(rng() * 30);
    rect(g, x, y, 3, 2, "#8a8a92");
    rect(g, x, y, 2, 1, "#aaaab2");
  }
  rect(g, 0, GROUND, 160, 1, C.ink);
  for (let x = 0; x < 160; x += 2) rect(g, x, GROUND - 1 - (x % 6 === 0 ? 1 : 0), 1, 1, "#486e24");
  gauge(g, T);
  gauge(g, P);
  vignette(g);
}, 41);

// Maintenir tire la racine ; le curseur doit rester dans la zone verte qui bouge.
export function desherberArt() {
  const fx = particles();
  return (c: Ctx, v: DesherberView) => {
    const now = performance.now();
    c.drawImage(bg(), 0, 0);
    const inside = Math.abs(v.cursor - v.zone) < v.halfZone;

    const base = GROUND - v.progress * LIFT;
    for (const dx of ROOTS) {
      line(c, WX + dx * 0.3, base, WX + dx, base + ROOT - Math.abs(dx) * 0.6, "#d8c8a0");
      rect(c, WX + dx, base + ROOT - Math.abs(dx) * 0.6, 1, 1, "#a89068");
    }
    // la touffe tremble quand on tire au bon endroit
    const shake = inside && v.progress < 1 ? Math.round(Math.sin(now / 30)) : 0;
    blit(c, WEED(), WX - 12 + shake, base - 15, 2);
    if (inside && Math.random() < 0.25) fx.burst(WX, GROUND, 2, CLODS, { speed: 20, up: 25 });
    fx.draw(c, now);

    const zTop = level(tension, v.zone + v.halfZone),
      zH = tension.h * v.halfZone * 2;
    rect(c, tension.x, zTop, tension.w, zH, "rgba(143, 208, 90, 0.45)");
    rect(c, tension.x, zTop, tension.w, 1, C.good);
    rect(c, tension.x, zTop + zH - 1, tension.w, 1, C.good);
    const cy = Math.round(level(tension, v.cursor));
    const col = inside ? C.good : C.gold;
    rect(c, T.x - 1, cy - 1, T.w + 2, 3, C.ink);
    rect(c, T.x, cy, T.w, 1, col);
    pointer(c, T.x - 3, cy, 1, col);
    pointer(c, T.x + T.w + 2, cy, -1, col);

    const fill = pulled.h * v.progress;
    rect(c, pulled.x, pulled.y + pulled.h - fill, pulled.w, fill, C.good);
    rect(c, pulled.x, pulled.y + pulled.h - fill, pulled.w, 1, "#c8f0a0");
    blit(c, WEED(), P.x - 1, P.y - 12);
  };
}
