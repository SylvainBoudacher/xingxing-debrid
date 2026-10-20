import type { ArroserView } from "../../core/minigames/arroser";
import { backdrop, blit, blitRot, particles, rect, type Ctx } from "./pixelKit";
import { C, gauge, grass, innerOf, level, pointer, soil, vignette } from "./scenery";
import { CAN, CAN_SPOUT, SPROUT } from "./sprites";

const PATCH = { x: 22, y: 46, w: 70, h: 32 };
const CAN_AT = { x: 40, y: 24 },
  CAN_PIVOT = { x: 6, y: 6 },
  TILT = 0.55;
const G = { x: 124, y: 8, w: 14, h: 74 };

const inner = innerOf(G);
const bg = backdrop((g, rng) => {
  grass(g, rng);
  soil(g, rng, PATCH.x, PATCH.y, PATCH.w, PATCH.h);
  gauge(g, G);
  vignette(g);
});

const DROPS = [C.water, C.waterLight, C.water];

// L'arrosoir penche tant qu'on maintient ; la terre fonce et la jauge monte.
export function arroserArt() {
  const fx = particles(160, (x, y) =>
    fx.burst(x, y - 1, 2, [C.waterLight], { speed: 14, up: 22, life: 0.25 }),
  );
  return (c: Ctx, v: ArroserView) => {
    const now = performance.now();
    c.drawImage(bg(), 0, 0);
    rect(c, PATCH.x, PATCH.y, PATCH.w, PATCH.h, `rgba(28, 14, 6, ${v.level * 0.55})`);
    blit(c, SPROUT(), PATCH.x + PATCH.w / 2 - 3, PATCH.y + 8);

    const a = v.pouring ? TILT : 0;
    if (v.pouring) {
      const dx = CAN_SPOUT.x - CAN_PIVOT.x,
        dy = CAN_SPOUT.y - CAN_PIVOT.y;
      const tx = CAN_AT.x + dx * Math.cos(a) - dy * Math.sin(a),
        ty = CAN_AT.y + dx * Math.sin(a) + dy * Math.cos(a);
      for (let i = 0; i < 2; i++)
        fx.burst(tx + Math.random() * 3, ty + 2, 1, DROPS, {
          speed: 6,
          up: 0,
          life: 1,
          floor: PATCH.y + 6 + Math.random() * (PATCH.h - 10),
        });
    }
    blitRot(c, CAN(), CAN_AT.x, CAN_AT.y, a, CAN_PIVOT.x, CAN_PIVOT.y);
    fx.draw(c, now);

    // jauge : zone verte, bande idéale, niveau d'eau
    const [z0, z1] = v.zone,
      [i0, i1] = v.ideal;
    rect(c, inner.x, level(inner, z1), inner.w, inner.h * (z1 - z0), "rgba(143, 208, 90, 0.3)");
    const fill = inner.h * v.level;
    rect(c, inner.x, inner.y + inner.h - fill, inner.w, fill, C.water);
    rect(c, inner.x + 1, inner.y + inner.h - fill, 1, fill, "#6aa4e8");
    if (fill > 0) rect(c, inner.x, inner.y + inner.h - fill, inner.w, 1, C.waterLight);
    rect(c, inner.x, level(inner, i1), inner.w, 1, C.good);
    rect(c, inner.x, level(inner, i0), inner.w, 1, C.good);
    const inZone = v.level >= z0 && v.level <= z1;
    const mark = inZone && Math.floor(now / 160) % 2 ? C.good : C.gold;
    const my = Math.round(level(inner, (i0 + i1) / 2));
    pointer(c, G.x - 4, my, 1, mark);
    pointer(c, G.x + G.w + 3, my, -1, mark);
  };
}
