import type * as THREE from "three";
import type { ColorId } from "../core/catalog/colors";
import { RARITY_COLOR } from "../core/catalog/rarity";
import type { SpeciesId } from "../core/catalog/species";
import type { Rarity } from "../core/types";
import { COLOR_HEX, FLOWER_SHAPES, H, STAGE_SHAPES, W } from "./flowerShapes";
import { canvasTex, dot, outlineCanvas } from "./pixel";

const FIXED: Record<string, string> = {
  c: "#5a3418",
  y: "#f0c43a",
  s: "#4a7a2a",
  l: "#5e9a34",
  b: "#3e6a2a",
  m: "#6a4628",
};

function drawGrid(g: CanvasRenderingContext2D, grid: string[], palette: Record<string, string>) {
  grid.forEach((row, y) => [...row].forEach((ch, x) => palette[ch] && dot(g, x, y, palette[ch])));
  outlineCanvas(g, W, H);
}

const flowerCache = new Map<string, THREE.Texture>();

export function flowerTex(species: SpeciesId, color: ColorId): THREE.Texture {
  const key = `${species}:${color}`;
  let t = flowerCache.get(key);
  if (!t) {
    const [p, P] = COLOR_HEX[color];
    t = canvasTex(W, H, (g) => drawGrid(g, FLOWER_SHAPES[species], { ...FIXED, p, P }));
    flowerCache.set(key, t);
  }
  return t;
}

// image d'une fleur pour l'interface (Herbier)
export function flowerDataUrl(species: SpeciesId, color: ColorId): string {
  const tex = flowerTex(species, color);
  return (tex.image as HTMLCanvasElement).toDataURL();
}

const stageCache: THREE.Texture[] = [];

export function stageTex(stage: 0 | 1 | 2 | 3): THREE.Texture {
  return (stageCache[stage] ??= canvasTex(W, H, (g) => drawGrid(g, STAGE_SHAPES[stage], FIXED)));
}

const markCache = new Map<Rarity, THREE.Texture>();

// petite étiquette plantée devant une case semée : la rareté, rien d'autre
export function rarityMarkTex(rarity: Rarity): THREE.Texture {
  let t = markCache.get(rarity);
  if (!t) {
    t = canvasTex(8, 12, (g) => {
      dot(g, 3, 4, "#7a5434", 2, 8);
      dot(g, 1, 0, RARITY_COLOR[rarity], 6, 5);
      dot(g, 1, 0, "#ffffff55", 6, 1);
      outlineCanvas(g, 8, 12);
    });
    markCache.set(rarity, t);
  }
  return t;
}
