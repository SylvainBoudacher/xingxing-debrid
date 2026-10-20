import type { RubanView } from "../../core/minigames/ruban";
import { angleGap, arc, backdrop, blit, line, particles, rect, ring, type Ctx } from "./pixelKit";
import { C, pip, vignette } from "./scenery";
import { BOW } from "./sprites";

const CX = 80,
  CY = 43,
  R0 = 26,
  R1 = 31;
// tolérances de la logique (radians)
const PERFECT = 0.18,
  GOOD = 0.45;
const RIBBON = "#c83a52",
  RIBBON_DARK = "#8e2440",
  RIBBON_LIGHT = "#f07a90";

// comptoir de l'étal, nappe en dentelle, bouquet emballé au centre
const bg = backdrop((g, rng) => {
  for (let y = 0; y < 90; y++) {
    const k = y % 12;
    rect(g, 0, y, 160, 1, k === 11 ? C.woodDark : k < 2 ? C.woodLight : C.wood);
  }
  for (let i = 0; i < 40; i++)
    rect(
      g,
      Math.floor(rng() * 156),
      Math.floor(rng() * 90),
      3 + Math.floor(rng() * 5),
      1,
      "#7a4e24",
    );
  ring(g, CX, CY, 0, R1 + 4, "rgba(20, 12, 6, 0.35)");
  ring(g, CX, CY, 0, R0 - 2, "#efe4cc");
  for (let a = 0; a < 24; a++) {
    const t = (a / 24) * Math.PI * 2;
    ring(g, CX + Math.sin(t) * (R0 - 3), CY - Math.cos(t) * (R0 - 3), 0, 1.6, "#f8f2e4");
  }
  ring(g, CX, CY, R0 - 7, R0 - 6, "#d8ccb0");
  // bouquet : cornet de papier et trois fleurs
  for (let j = 0; j < 14; j++)
    rect(g, CX - 7 + j / 2, CY - 2 + j, 14 - j, 1, j % 3 ? "#e8d8b0" : "#c8b890");
  for (const [dx, dy, col] of [
    [-5, -6, "#f290b8"],
    [5, -6, "#f2cc3a"],
    [0, -10, "#e04a3a"],
  ] as const) {
    ring(g, CX + dx, CY + dy, 0, 4.5, C.ink);
    ring(g, CX + dx, CY + dy, 0, 3.5, col);
    rect(g, CX + dx, CY + dy, 1, 1, "#5a3418");
  }
  ring(g, CX, CY, R0, R1, RIBBON_DARK);
  ring(g, CX, CY, R0 + 1, R1 - 1, RIBBON);
  ring(g, CX, CY, R0 + 1, R0 + 2, RIBBON_LIGHT);
  vignette(g);
}, 53);

// L'aiguille fait le tour du ruban ; appuyer quand elle passe sur le nœud.
export function rubanArt() {
  const fx = particles(90);
  let seen = 0,
    prev = { x: CX, y: CY };
  return (c: Ctx, v: RubanView) => {
    const now = performance.now();
    c.drawImage(bg(), 0, 0);

    const gap = angleGap(v.angle, v.knot);
    arc(c, CX, CY, R0 - 1, R1 + 1, v.knot, GOOD, "rgba(245, 197, 42, 0.55)");
    arc(
      c,
      CX,
      CY,
      R0 - 1,
      R1 + 1,
      v.knot,
      PERFECT,
      gap < PERFECT ? C.good : "rgba(143, 208, 90, 0.85)",
    );
    const kx = CX + Math.sin(v.knot) * ((R0 + R1) / 2),
      ky = CY - Math.cos(v.knot) * ((R0 + R1) / 2);
    blit(c, BOW(), kx - 4, ky - 3);

    // au second tour le nœud a déjà bougé : les éclats partent de l'ancien
    if (v.hits.length > seen) {
      seen = v.hits.length;
      fx.burst(prev.x, prev.y, 10, [RIBBON_LIGHT, C.gold, C.cream], { speed: 35, up: 35 });
    }
    prev = { x: kx, y: ky };

    const nx = CX + Math.sin(v.angle) * (R1 + 3),
      ny = CY - Math.cos(v.angle) * (R1 + 3);
    line(c, CX + 1, CY + 1, nx + 1, ny + 1, "rgba(20, 12, 6, 0.5)");
    line(c, CX, CY, nx, ny, "#d8e0e8");
    rect(c, nx - 1, ny - 1, 3, 3, C.ink);
    rect(c, nx, ny, 1, 1, "#ffffff");
    ring(c, CX, CY, 0, 3, C.ink);
    ring(c, CX, CY, 0, 2, C.gold);
    fx.draw(c, now);

    for (let i = 0; i < 2; i++) pip(c, CX - 6 + i * 12, 83, v.hits[i], i === v.hits.length, now);
  };
}
