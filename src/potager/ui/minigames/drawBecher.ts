import type { BecherView } from "../../core/minigames/becher";
import { backdrop, blit, bob, particles, rect, ring, U, type Ctx } from "./pixelKit";
import { C, CLODS, grass, pip, soil, vignette } from "./scenery";
import { SPADE } from "./sprites";

const CX = 80,
  CY = 40;
const PLOT = { x: 56, y: 22, w: 48, h: 36 };
const STRIPE = PLOT.w / 3;

const bg = backdrop((g, rng) => {
  grass(g, rng);
  rect(g, PLOT.x - 1, PLOT.y - 1, PLOT.w + 2, PLOT.h + 2, "rgba(30, 20, 10, 0.25)");
  vignette(g);
});
const turned = backdrop((g, rng) => soil(g, rng, PLOT.x, PLOT.y, PLOT.w, PLOT.h), 11);

function stakes(c: Ctx) {
  const rope = "#d8c8a0";
  rect(c, PLOT.x - 2, PLOT.y - 3, PLOT.w + 4, 1, rope);
  rect(c, PLOT.x - 2, PLOT.y + PLOT.h + 1, PLOT.w + 4, 1, rope);
  for (const x of [PLOT.x - 3, PLOT.x + PLOT.w + 1])
    for (const y of [PLOT.y - 6, PLOT.y + PLOT.h - 2]) {
      rect(c, x - 1, y - 1, 4, 7, C.ink);
      rect(c, x, y, 2, 5, C.woodLight);
      rect(c, x + 1, y, 1, 5, C.wood);
    }
}

// Trois coups de bêche : la terre se retourne bande par bande.
export function becherArt() {
  const fx = particles();
  let seen = 0,
    struckAt = -1e9;
  return (c: Ctx, v: BecherView) => {
    const now = performance.now();
    c.drawImage(bg(), 0, 0);
    v.hits.forEach((_, i) => {
      const x = PLOT.x + i * STRIPE;
      c.drawImage(turned(), x, PLOT.y - 1, STRIPE, PLOT.h + 2, x, PLOT.y - 1, STRIPE, PLOT.h + 2);
    });
    stakes(c);

    if (v.hits.length > seen) {
      seen = v.hits.length;
      struckAt = now;
      fx.burst(PLOT.x + (seen - 0.5) * STRIPE, PLOT.y + PLOT.h / 2, 14, CLODS, {
        speed: 40,
        up: 50,
      });
    }

    if (v.active) {
      const t = v.target * U,
        r = v.radius * U,
        d = Math.abs(v.radius - v.target);
      const col = d < 5 ? C.good : d < 12 ? C.mid : C.cream;
      if (d < 5) ring(c, CX, CY, t - 3, t + 3, "rgba(143, 208, 90, 0.35)");
      ring(c, CX, CY, t - 2, t + 2, C.ink);
      ring(c, CX, CY, t - 1, t + 1, C.gold);
      ring(c, CX, CY, r - 2, r + 1, C.ink);
      ring(c, CX, CY, r - 1, r, col);
    }

    // la bêche attend sur le côté, puis s'enfonce dans la bande qu'on vient de bêcher
    const k = (now - struckAt) / 220;
    if (k < 1)
      blit(c, SPADE(), PLOT.x + (seen - 0.5) * STRIPE - 4, PLOT.y - 10 + Math.sin(k * Math.PI) * 8);
    else blit(c, SPADE(), 128, 30 + bob(now, 1.5));

    fx.draw(c, now);
    for (let i = 0; i < 3; i++) pip(c, CX - 12 + i * 12, 82, v.hits[i], i === v.hits.length, now);
  };
}
