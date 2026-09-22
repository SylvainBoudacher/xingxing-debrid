import type { ColorId, VariantId } from "../core/types";
import { ATELIER_DRAW } from "./atelier";
import { DECOR_DRAW, drawTree } from "./decor";
import { PAL } from "./palette";
import { COLOR_RAMP } from "./colorRamps";
import { buf, crop, outline, toCanvas, type Buf, type DrawFn, type Ramp } from "./raster";
import { SPECIES_DRAW } from "./species/index";
import { STAGE_DRAW } from "./stages";
import { TOOL_DRAW } from "./tools";
import { VARIANT_FX } from "./variants";

export const SPRITE_TILE = 48;
const K = SPRITE_TILE / 32;

export type SpriteName =
  | keyof typeof SPECIES_DRAW
  | keyof typeof STAGE_DRAW
  | keyof typeof DECOR_DRAW
  | keyof typeof TOOL_DRAW
  | keyof typeof ATELIER_DRAW
  | "arbre";

export interface SpriteRef {
  name: SpriteName;
  color?: ColorId | "cream";
  variant?: VariantId;
}

export const spriteKey = (ref: SpriteRef): string =>
  `${ref.name}:${ref.color ?? ""}:${ref.variant ?? ""}`;

function rampOf(color: SpriteRef["color"]): Ramp {
  if (!color) return PAL.green;
  if (color === "cream") return PAL.cream;
  return PAL[COLOR_RAMP[color]];
}

export function drawBuf(draw: DrawFn, ramp: Ramp, variant?: VariantId): Buf {
  const b = buf(SPRITE_TILE, SPRITE_TILE * 1.5);
  draw(b, K, ramp);
  if (variant) VARIANT_FX[variant](b);
  outline(b);
  return b;
}

export function renderSpriteBuf(ref: SpriteRef): Buf {
  if (ref.name === "arbre") {
    const b = buf(SPRITE_TILE * 3, SPRITE_TILE * 4.5);
    drawTree(b, K);
    outline(b);
    return b;
  }
  const draw =
    SPECIES_DRAW[ref.name as keyof typeof SPECIES_DRAW] ??
    STAGE_DRAW[ref.name as keyof typeof STAGE_DRAW] ??
    DECOR_DRAW[ref.name as keyof typeof DECOR_DRAW] ??
    TOOL_DRAW[ref.name as keyof typeof TOOL_DRAW] ??
    ATELIER_DRAW[ref.name as keyof typeof ATELIER_DRAW];
  return drawBuf(draw, rampOf(ref.color), ref.variant);
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

const urls = new Map<string, string>();

export function spriteDataUrl(ref: SpriteRef): string {
  const key = spriteKey(ref);
  let url = urls.get(key);
  if (!url) {
    url = spriteCanvas(ref).toDataURL();
    urls.set(key, url);
  }
  return url;
}

const icons = new Map<string, string>();

// Icône : le sprite recadré sur sa zone dessinée.
export function iconDataUrl(ref: SpriteRef): string {
  const key = spriteKey(ref);
  let url = icons.get(key);
  if (!url) {
    url = toCanvas(crop(renderSpriteBuf(ref), 1)).toDataURL();
    icons.set(key, url);
  }
  return url;
}
