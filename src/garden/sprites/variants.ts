import type { VariantId } from "../core/types";
import { hexRgb, mix } from "./color";
import { PAL } from "./palette";
import { rampAt, type Buf, type Ramp } from "./raster";

const FROST: Ramp = ["#2e4a6e", "#6a94c4", "#a8d0ee", "#e8f6ff"];
const GOLD: Ramp = ["#8a5a0c", "#d99a1c", "#f7cf4a", "#fff6c0"];
const LEAVES = new Set<string>([...PAL.green, ...PAL.darkLeaf]);

const lum = (hex: string) => {
  const [r, g, b] = hexRgb(hex);
  return (0.3 * r + 0.59 * g + 0.11 * b) / 255;
};

// `map` lit l'ancien tableau : les voisins sont ceux d'avant la recoloration.
function recolor(b: Buf, fn: (col: string, i: number) => string) {
  b.c = b.c.map((col, i) => (col ? fn(col, i) : null));
}

// Recolorations appliquées avant le contour.
export const VARIANT_FX: Record<VariantId, (b: Buf) => void> = {
  givree: (b) =>
    recolor(b, (col, i) => (i < b.w || !b.c[i - b.w] ? "#f0faff" : rampAt(FROST, lum(col) * 1.25))),
  doree: (b) => recolor(b, (col) => (LEAVES.has(col) ? col : rampAt(GOLD, lum(col) * 1.3 - 0.05))),
  lumineuse: (b) =>
    recolor(b, (col) => (LEAVES.has(col) ? mix(col, "#1e3a4a", 0.3) : mix(col, "#c8fff0", 0.45))),
};
