import type { ColorId } from "../core/types";
import { DECOR_DRAW, drawTree } from "./decor";
import { PAL } from "./palette";
import { buf, outline, toCanvas, type Buf, type Ramp } from "./raster";
import { SPECIES_COLOR, SPECIES_DRAW } from "./species";
import { STAGE_DRAW } from "./stages";

export const SPRITE_TILE = 48;
const K = SPRITE_TILE / 32;

export type SpriteName =
  keyof typeof SPECIES_DRAW | keyof typeof STAGE_DRAW | keyof typeof DECOR_DRAW | "arbre";

export interface SpriteRef {
  name: SpriteName;
  color?: ColorId | "cream";
}

export const spriteKey = (ref: SpriteRef): string => `${ref.name}:${ref.color ?? ""}`;

function rampOf(color: SpriteRef["color"]): Ramp {
  if (!color) return PAL.green;
  if (color === "cream") return PAL.cream;
  return PAL[SPECIES_COLOR[color]];
}

export function renderSpriteBuf(ref: SpriteRef): Buf {
  if (ref.name === "arbre") {
    const b = buf(SPRITE_TILE * 3, SPRITE_TILE * 4.5);
    drawTree(b, K);
    outline(b);
    return b;
  }
  const b = buf(SPRITE_TILE, SPRITE_TILE * 1.5);
  const draw =
    SPECIES_DRAW[ref.name as keyof typeof SPECIES_DRAW] ??
    STAGE_DRAW[ref.name as keyof typeof STAGE_DRAW] ??
    DECOR_DRAW[ref.name as keyof typeof DECOR_DRAW];
  draw(b, K, rampOf(ref.color));
  outline(b);
  return b;
}

const cache = new Map<string, HTMLCanvasElement>();

export function spriteCanvas(ref: SpriteRef): HTMLCanvasElement {
  const key = spriteKey(ref);
  let cv = cache.get(key);
  if (!cv) {
    cv = toCanvas(renderSpriteBuf(ref));
    cache.set(key, cv);
  }
  return cv;
}
