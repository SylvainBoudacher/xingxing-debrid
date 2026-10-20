import type { ColorId } from "../../core/catalog/colors";
import type { SpeciesId } from "../../core/catalog/species";
import type { CueillirView } from "../../core/minigames/cueillir";
import { COLOR_HEX, FLOWER_SHAPES } from "../../textures/flowerShapes";
import { FIXED } from "../../textures/flowers";
import { backdrop, blit, makeSprite, particles, rect, type Ctx } from "./pixelKit";
import { pick } from "../../textures/pixel";
import { C, grass, keycap, SOIL, SOIL_DARK, vignette } from "./scenery";

export interface Bloom {
  species: SpeciesId;
  color: ColorId;
}

const BOARD = { x: 70, y: 12, w: 82, h: 62 };
const FLOWER = { x: 18, y: 26 };

const bg = backdrop((g, rng) => {
  grass(g, rng);
  // butte de terre au pied de la fleur
  for (let j = 0; j < 10; j++) {
    const half = 7 + j * 2;
    rect(g, FLOWER.x + 16 - half - 1, 70 + j, half * 2 + 2, 1, C.ink);
    for (let x = -half; x < half; x++)
      rect(
        g,
        FLOWER.x + 16 + x,
        70 + j,
        1,
        1,
        rng() < 0.15 ? pick(rng, SOIL_DARK) : SOIL[j < 2 ? 3 : 1],
      );
  }
  rect(g, BOARD.x - 1, BOARD.y - 1, BOARD.w + 2, BOARD.h + 2, C.ink);
  for (let y = 0; y < BOARD.h; y++) {
    const plank = Math.floor(y / 10);
    rect(
      g,
      BOARD.x,
      BOARD.y + y,
      BOARD.w,
      1,
      y % 10 === 9 ? C.woodDark : plank % 2 ? C.wood : "#946232",
    );
  }
  for (let i = 0; i < 18; i++)
    rect(
      g,
      BOARD.x + 2 + Math.floor(rng() * (BOARD.w - 6)),
      BOARD.y + Math.floor(rng() * BOARD.h),
      4,
      1,
      C.woodDark,
    );
  for (const [x, y] of [
    [3, 3],
    [BOARD.w - 4, 3],
    [3, BOARD.h - 4],
    [BOARD.w - 4, BOARD.h - 4],
  ])
    rect(g, BOARD.x + x, BOARD.y + y, 1, 1, "#d8d0c0");
  vignette(g);
}, 23);

const timeCol = (k: number) => (k > 0.5 ? C.good : k > 0.25 ? C.mid : C.bad);

// La fleur à cueillir à gauche, les touches à taper sur la planche.
export function cueillirArt(bloom: Bloom = { species: "cosmos", color: "pink" }) {
  const [p, P] = COLOR_HEX[bloom.color];
  const flower = makeSprite(FLOWER_SHAPES[bloom.species], { ...FIXED, p, P });
  const fx = particles(60);
  let seen = 0;
  return (c: Ctx, v: CueillirView) => {
    const now = performance.now();
    c.drawImage(bg(), 0, 0);

    if (v.done > seen) {
      seen = v.done;
      fx.burst(FLOWER.x + 16, FLOWER.y + 14, 8, [p, P, C.good], { speed: 30, up: 30, life: 0.8 });
    }
    // la fleur sort de terre un peu plus à chaque bonne touche
    const lift = seen * 3;
    blit(c, flower(), FLOWER.x, FLOWER.y - lift, 2);
    fx.draw(c, now);

    v.sequence.forEach((k, j) => {
      const done = j < v.done,
        next = j === v.done;
      keycap(
        c,
        BOARD.x + 9 + j * 24,
        BOARD.y + 12 - (next && Math.floor(now / 250) % 2 ? 1 : 0),
        k,
        {
          pressed: done,
          face: done ? C.good : undefined,
          glow: next ? C.gold : undefined,
        },
      );
    });

    const bx = BOARD.x + 8,
      by = BOARD.y + 42,
      bw = BOARD.w - 16;
    rect(c, bx - 1, by - 1, bw + 2, 7, C.ink);
    rect(c, bx, by, bw, 5, "#3a2a1c");
    rect(c, bx, by, bw * v.timeLeft, 5, timeCol(v.timeLeft));
    rect(c, bx, by, bw * v.timeLeft, 1, "rgba(255, 255, 255, 0.35)");
  };
}
