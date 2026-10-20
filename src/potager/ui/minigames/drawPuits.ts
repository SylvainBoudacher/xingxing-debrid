import type { PuitsView } from "../../core/minigames/puits";
import { outlinePixels, pick } from "../../textures/pixel";
import { arc, backdrop, blit, blitRot, line, particles, rect, ring, type Ctx } from "./pixelKit";
import { C, gauge, grass, innerOf, keycap, vignette } from "./scenery";
import { DROP } from "./sprites";

const AXLE_Y = 17,
  RISE = 40,
  LOW = 64;
// seuil de la logique au-delà duquel l'eau déborde, et angle d'affichage du seau
const SPILL_FROM = 0.35,
  VISUAL = 0.9;
const METER = { x: 24, y: 42, r: 15 };
const G = { x: 138, y: 16, w: 12, h: 66 };
const inner = innerOf(G);

const STONE = ["#9a9aa2", "#8a8a92", "#aaaab2", "#7e7e88"];
const ROOF = ["#7a3018", "#8e3c1e", "#5e2210"];

function bricks(g: Ctx, rng: () => number, x0: number, y0: number, w: number, h: number) {
  rect(g, x0, y0, w, h, "#5a5a64");
  for (let y = y0; y < y0 + h; y += 4)
    for (let x = x0 + (((y - y0) / 4) % 2 ? -3 : 0); x < x0 + w; x += 7) {
      const l = Math.max(x, x0),
        r = Math.min(x + 6, x0 + w);
      rect(g, l, y, r - l, 3, pick(rng, STONE));
      rect(g, l, y, r - l, 1, "#c4c4cc");
    }
}

const back = backdrop((g, rng) => {
  grass(g, rng);
  for (const x of [50, 107]) {
    rect(g, x - 1, 8, 5, LOW - 6, C.ink);
    rect(g, x, 9, 3, LOW - 8, C.wood);
    rect(g, x, 9, 1, LOW - 8, C.woodLight);
  }
  for (let y = 0; y < 11; y++) {
    const half = 12 + y * 2.6;
    rect(g, 80 - half - 1, y, half * 2 + 2, 1, C.ink);
    rect(g, 80 - half, y, half * 2, 1, ROOF[y % 3 === 2 ? 2 : (y >> 1) % 2]);
  }
  rect(g, 49, 11, 62, 1, C.ink);
  rect(g, 54, AXLE_Y - 2, 52, 5, C.ink);
  rect(g, 55, AXLE_Y - 1, 50, 3, C.woodDark);
  rect(g, 55, AXLE_Y - 1, 50, 1, C.wood);
  for (let x = 74; x < 87; x += 2) rect(g, x, AXLE_Y - 2, 1, 5, "#c8b080");
  // manivelle sur le montant droit
  rect(g, 111, AXLE_Y - 1, 4, 2, C.ink);
  rect(g, 114, AXLE_Y - 1, 2, 7, C.ink);
  rect(g, 115, AXLE_Y + 4, 3, 2, C.woodLight);
  rect(g, 47, LOW - 6, 66, 6, "#2a2a32");
  rect(g, 49, LOW - 5, 62, 5, "#101820");
  vignette(g);
}, 31);

const front = backdrop((g, rng) => {
  bricks(g, rng, 46, LOW, 68, 30);
  rect(g, 45, LOW - 1, 70, 2, C.ink);
}, 37);

// seau de bois cerclé, eau visible au bord ; haut de l'anse en (8, 0), marge de contour comprise
function drawBucket(s: HTMLCanvasElement, water: number) {
  const g = s.getContext("2d")!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, s.width, s.height);
  g.translate(1, 1);
  for (let x = 4; x <= 12; x++)
    rect(g, x, Math.round(4 - Math.sin(((x - 4) / 8) * Math.PI) * 4), 1, 1, "#5e6874");
  for (let j = 0; j < 10; j++) {
    const half = 6 - Math.floor(j / 4);
    for (let x = -half; x < half; x++)
      rect(g, 8 + x, 4 + j, 1, 1, (x + 8) % 3 ? C.wood : C.woodLight);
  }
  rect(g, 2, 6, 12, 1, "#5e6874");
  rect(g, 4, 11, 8, 1, "#5e6874");
  rect(g, 3, 4, 10, 1, water > 0.15 ? C.waterLight : "#2a1c12");
  g.setTransform(1, 0, 0, 1, 0, 0);
  const img = g.getImageData(0, 0, s.width, s.height);
  img.data.set(outlinePixels(img.data, s.width, s.height));
  g.putImageData(img, 0, 0);
}

// Le seau remonte en tanguant ; le cadran à gauche indique le côté à corriger.
export function puitsArt() {
  const fx = particles(150);
  const bucket = document.createElement("canvas");
  bucket.width = bucket.height = 18;
  return (c: Ctx, v: PuitsView) => {
    const now = performance.now();
    c.drawImage(back(), 0, 0);

    const by = Math.round(LOW - v.height * RISE),
      a = v.angle * VISUAL;
    line(c, 80, AXLE_Y + 2, 80, by - 1, "#c8b080");
    drawBucket(bucket, v.water);
    blitRot(c, bucket, 80, by, a, 8, 0);
    if (Math.abs(v.angle) > SPILL_FROM && v.water > 0 && Math.random() < 0.6) {
      const side = Math.sign(v.angle) * 6;
      fx.burst(
        80 + side * Math.cos(a) - 4 * Math.sin(a),
        by + side * Math.sin(a) + 4 * Math.cos(a),
        1,
        [C.water, C.waterLight],
        {
          speed: 10,
          up: 5,
          life: 0.8,
        },
      );
    }
    c.drawImage(front(), 0, 0);
    fx.draw(c, now);

    // cadran d'équilibre : vert tant que l'eau ne déborde pas
    arc(c, METER.x, METER.y, METER.r - 4, METER.r, 0, Math.PI / 2, C.bad);
    arc(c, METER.x, METER.y, METER.r - 4, METER.r, 0, SPILL_FROM * (Math.PI / 2), C.good);
    const na = v.angle * (Math.PI / 2);
    line(
      c,
      METER.x,
      METER.y,
      METER.x + Math.sin(na) * (METER.r + 1),
      METER.y - Math.cos(na) * (METER.r + 1),
      C.cream,
    );
    ring(c, METER.x, METER.y, 0, 2.5, C.ink);
    ring(c, METER.x, METER.y, 0, 1.5, C.gold);

    // touche qui redresse le seau, mise en avant quand il penche
    const want = Math.abs(v.angle) > 0.2 ? (v.angle > 0 ? 1 : -1) : 0;
    const hintOn = Math.floor(now / 220) % 2 === 0;
    for (const d of [-1, 1] as const)
      keycap(c, METER.x - 15 + (d > 0 ? 17 : 0), METER.y + 10, d < 0 ? "left" : "right", {
        pressed: v.push === d,
        face: v.push === d ? C.good : undefined,
        glow: want === d && v.push !== d && hintOn ? C.gold : undefined,
      });

    gauge(c, G);
    rect(c, inner.x, inner.y + inner.h * (1 - v.water), inner.w, inner.h * v.water, C.water);
    rect(c, inner.x, inner.y + inner.h * (1 - v.water), inner.w, 1, C.waterLight);
    blit(c, DROP(), G.x + 3, G.y - 10);
  };
}
