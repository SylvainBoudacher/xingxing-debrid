import { describe, it, expect } from "vitest";
import {
  drawChameleonHalo,
  drawGodlyAura,
  drawGodlyBolts,
  drawNovaAura,
  drawNovaOrbit,
  drawPeacockFan,
  drawPhoenixEmbers,
  drawPhoenixWings,
  type EffectFrame,
} from "./duckRewardEffects";
import { isRadialEffect, rewardPreviewLayout } from "./duckRewardLayout";
import { REWARDS } from "@/lib/duckRewards";
import type { Effect } from "./duckTypes";

// Un ctx factice qui note l'emprise de tout ce qu'on lui demande de dessiner,
// transformations comprises (Zeus fait tourner ses rayons autour du canard).
// Il n'y a pas de canvas sous vitest, et de toute façon c'est la géométrie
// qu'on veut mesurer.
class TracingCtx {
  minX = Infinity;
  minY = Infinity;
  maxX = -Infinity;
  maxY = -Infinity;

  private tx = 0;
  private ty = 0;
  private rot = 0;
  private stack: Array<[number, number, number]> = [];

  fillStyle: unknown = "";
  strokeStyle: unknown = "";
  lineWidth = 0;

  private mark(x: number, y: number, rx = 0, ry = rx) {
    const c = Math.cos(this.rot);
    const s = Math.sin(this.rot);
    const px = this.tx + x * c - y * s;
    const py = this.ty + x * s + y * c;
    const r = Math.max(rx, ry);
    this.minX = Math.min(this.minX, px - r);
    this.maxX = Math.max(this.maxX, px + r);
    this.minY = Math.min(this.minY, py - r);
    this.maxY = Math.max(this.maxY, py + r);
  }

  save() {
    this.stack.push([this.tx, this.ty, this.rot]);
  }
  restore() {
    [this.tx, this.ty, this.rot] = this.stack.pop()!;
  }
  translate(x: number, y: number) {
    this.tx += x;
    this.ty += y;
  }
  rotate(a: number) {
    this.rot += a;
  }

  beginPath() {}
  fill() {}
  stroke() {}

  moveTo(x: number, y: number) {
    this.mark(x, y);
  }
  lineTo(x: number, y: number) {
    this.mark(x, y, this.lineWidth / 2);
  }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
    this.mark(cx, cy);
    this.mark(x, y);
  }
  arc(x: number, y: number, r: number) {
    this.mark(x, y, r);
  }
  ellipse(x: number, y: number, rx: number, ry: number) {
    this.mark(x, y, rx, ry);
  }
  fillRect(x: number, y: number, w: number, h: number) {
    this.mark(x, y);
    this.mark(x + w, y + h);
  }

  createRadialGradient(_x0: number, _y0: number, _r0: number, x1: number, y1: number, r1: number) {
    this.mark(x1, y1, r1);
    return { addColorStop() {} };
  }
  createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
    this.mark(x0, y0);
    this.mark(x1, y1);
    return { addColorStop() {} };
  }
}

const DRAW: Partial<Record<Effect, Array<(f: EffectFrame) => void>>> = {
  chameleon: [drawChameleonHalo],
  peacock: [drawPeacockFan],
  phoenix: [drawPhoenixWings, drawPhoenixEmbers],
  nova: [drawNovaAura, drawNovaOrbit],
  godly: [drawGodlyAura, drawGodlyBolts],
};

// Les effets bouclent lentement (le phénix renaît sur ~20s, le paon ouvre sa
// roue sur ~5s): on échantillonne largement pour attraper les extrêmes.
const TIMES = Array.from({ length: 240 }, (_, i) => i * 250);

const SPRITE_RATIO = 1.15;

// Emprise d'un effet sur toute sa boucle, aux dimensions de la vignette.
function traceEffect(effect: Effect, size: number) {
  const { box, cx, cy, ew, eh } = rewardPreviewLayout(size, SPRITE_RATIO, effect);
  const ctx = new TracingCtx();
  for (const t of TIMES) {
    for (const draw of DRAW[effect]!) {
      draw({
        ctx: ctx as unknown as CanvasRenderingContext2D,
        cx,
        cy,
        dw: ew,
        dh: eh,
        t,
        phase: 0,
      });
    }
  }
  return { width: ctx.maxX - ctx.minX, height: ctx.maxY - ctx.minY, ctx, box };
}

describe("effets des canards de récompense", () => {
  it("dessine chaque récompense du Canardex", () => {
    for (const reward of REWARDS) {
      expect(DRAW[reward.variant().effect!], reward.name).toBeDefined();
    }
  });

  // Supernova et Zeus rayonnent tout autour d'eux: leur effet est resserré pour
  // que rayons, halo et éclairs tiennent dans la case au lieu d'être coupés.
  it("resserre les effets radiaux et laisse les autres pleine taille", () => {
    expect(isRadialEffect("nova")).toBe(true);
    expect(isRadialEffect("godly")).toBe(true);
    expect(isRadialEffect("phoenix")).toBe(false);

    const nova = rewardPreviewLayout(52, SPRITE_RATIO, "nova");
    expect(nova.ew).toBeLessThan(nova.dw);
    expect(nova.cy).toBe(nova.box / 2); // centré, l'effet part dans tous les sens

    const phoenix = rewardPreviewLayout(52, SPRITE_RATIO, "phoenix");
    expect(phoenix.ew).toBe(phoenix.dw);
    expect(phoenix.cy).toBeGreaterThan(phoenix.box / 2); // calé bas, ailes au-dessus
  });

  it("dessine le canard à la même taille pour toutes les récompenses", () => {
    const sizes = REWARDS.map((r) => rewardPreviewLayout(52, SPRITE_RATIO, r.variant().effect).dh);
    expect(new Set(sizes).size).toBe(1);
  });

  // Régression: les tailles fixes des routines (nuages d'orage, éclairs,
  // étincelles) étaient réglées sur le canard de la piscine et ne suivaient pas
  // la vignette, qui est cinq fois plus petite.
  // le paon est exclu: ses ocelles ont un rayon plancher, sa roue n'est donc
  // pas strictement proportionnelle en très petit
  it.each(["nova", "godly", "phoenix", "chameleon"] as const)(
    "met l'effet %s à l'échelle du canard",
    (effect) => {
      // gros écart d'échelle: une constante restée en pixels fixes se voit dans
      // le rapport des emprises
      const small = traceEffect(effect, 26);
      const big = traceEffect(effect, 260);
      expect(big.width / small.width).toBeCloseTo(10, 0);
      expect(big.height / small.height).toBeCloseTo(10, 0);
    },
  );

  it("garde Zeus et Supernova plus compacts que la case", () => {
    for (const effect of ["nova", "godly"] as const) {
      const { width, height, box } = traceEffect(effect, 52);
      // marge: les extrémités mesurées sont des dégradés déjà transparents
      expect(width, effect).toBeLessThan(box * 1.15);
      expect(height, effect).toBeLessThan(box * 1.15);
    }
  });
});
