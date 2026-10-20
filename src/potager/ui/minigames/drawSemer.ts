import type { SemerView } from "../../core/minigames/semer";
import { GRASS } from "../../textures/terrain";
import { backdrop, blit, line, particles, rect, ring, U, type Ctx } from "./pixelKit";
import { C, CLODS, grass, soil, vignette } from "./scenery";
import { SEED, SPROUT } from "./sprites";

// sillon vu de côté : dessus de la terre à GROUND
const GROUND = 58,
  HANG_Y = 18,
  PIVOT = { x: 80, y: -40 };
// tolérances de la logique (unités de maquette), pour colorer l'aide à la visée
const PERFECT = 18,
  GOOD = 42;
const FALL_MS = 260;

const SKY = ["#9cc4d8", "#b4d4e0", "#cce0e4"];
const HEDGE = ["#2e4a22", "#3a5a2a", "#44663a", "#263e1c"];

// ciel pâle, haie en touffes rondes, bande d'herbe, sillon, herbe de devant
const bg = backdrop((g, rng) => {
  SKY.forEach((col, i) => rect(g, 0, i * 5, 160, 5, col));
  rect(g, 0, 15, 160, 30, HEDGE[3]);
  for (let i = 0; i < 260; i++) {
    const x = rng() * 164 - 2,
      y = 8 + Math.pow(rng(), 0.7) * 36,
      r = 2 + rng() * 2.5;
    ring(g, x, y, 0, r, HEDGE[Math.floor(rng() * 3)]);
    rect(g, x - 1, y - r + 1, 1, 1, "#5a7a44");
  }
  grass(g, rng, 0, 44, 160, 14);
  rect(g, 0, 44, 160, 1, GRASS[3]);
  soil(g, rng, 0, GROUND, 160, 16);
  grass(g, rng, 0, GROUND + 17, 160, 90 - GROUND - 17);
  vignette(g);
});

const zoneCol = (d: number) => (d < PERFECT ? C.good : d < GOOD ? C.mid : C.cream);

// La graine se balance au bout d'un fil ; son ombre montre où elle tombera.
export function semerArt() {
  const fx = particles();
  let droppedAt = 0,
    landed = false;
  return (c: Ctx, v: SemerView) => {
    const now = performance.now();
    c.drawImage(bg(), 0, 0);
    const hx = v.hole * U,
      sx = v.x * U;

    // zones de tolérance sur le dessus du sillon, puis le trou
    rect(c, hx - GOOD * U, GROUND - 1, GOOD * 2 * U, 2, "rgba(245, 197, 42, 0.55)");
    rect(c, hx - PERFECT * U, GROUND - 1, PERFECT * 2 * U, 2, "rgba(143, 208, 90, 0.9)");
    rect(c, hx - 4, GROUND, 8, 4, "#1e1008");
    rect(c, hx - 3, GROUND + 4, 6, 1, "#1e1008");
    rect(c, hx - 5, GROUND - 1, 1, 1, CLODS[2]);
    rect(c, hx + 4, GROUND - 1, 1, 1, CLODS[2]);

    if (!v.dropped) {
      const col = zoneCol(Math.abs(v.x - v.hole));
      for (let y = HANG_Y + 11; y < GROUND - 2; y += 4) rect(c, sx, y, 1, 2, col);
      rect(c, sx - 3, GROUND - 2, 7, 1, "rgba(0, 0, 0, 0.35)");
      line(c, PIVOT.x, PIVOT.y, sx, HANG_Y, "#e8dcc4");
      blit(c, SEED(), sx - 3, HANG_Y);
    } else {
      droppedAt ||= now;
      const k = Math.min(1, (now - droppedAt) / FALL_MS);
      if (k < 1) blit(c, SEED(), sx - 3, HANG_Y + (GROUND - 6 - HANG_Y) * k * k);
      else {
        if (!landed) fx.burst(sx, GROUND - 1, 10, CLODS, { speed: 25, up: 35 });
        landed = true;
        // dans le trou, elle germe ; à côté, elle reste posée sur la terre
        if (Math.abs(v.x - v.hole) < GOOD) blit(c, SPROUT(), sx - 3, GROUND - 6);
        else blit(c, SEED(), sx - 3, GROUND - 8);
      }
    }
    fx.draw(c, now);
  };
}
