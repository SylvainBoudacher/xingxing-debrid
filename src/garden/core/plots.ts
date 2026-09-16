import { parseTileKey, tileKey, type PlotId, type TileKey } from "./types";

export const PLOTS: Record<PlotId, { x: number; y: number; w: number; h: number }> = {
  p1: { x: 1, y: 1, w: 6, h: 4 },
};

export function soilTiles(plots: PlotId[]): TileKey[] {
  const out: TileKey[] = [];
  for (const id of plots) {
    const p = PLOTS[id];
    for (let y = p.y; y < p.y + p.h; y++)
      for (let x = p.x; x < p.x + p.w; x++) out.push(tileKey(x, y));
  }
  return out;
}

export function isSoil(plots: PlotId[], key: TileKey): boolean {
  return soilTiles(plots).includes(key);
}

export const FIELD = { x: 0, y: 0, w: 9, h: 5 } as const;

export function fieldTiles(): TileKey[] {
  const out: TileKey[] = [];
  for (let y = FIELD.y; y < FIELD.y + FIELD.h; y++)
    for (let x = FIELD.x; x < FIELD.x + FIELD.w; x++) out.push(tileKey(x, y));
  return out;
}

export function isInField(key: TileKey): boolean {
  const [x, y] = parseTileKey(key);
  return x >= FIELD.x && x < FIELD.x + FIELD.w && y >= FIELD.y && y < FIELD.y + FIELD.h;
}
