import { parseTileKey, tileKey, type PlotId, type TileKey } from "./types";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PLOTS: Record<PlotId, Rect> = {
  p1: { x: 1, y: 1, w: 6, h: 4 },
  p2: { x: 8, y: 1, w: 4, h: 4 },
  p3: { x: 1, y: 5, w: 6, h: 4 },
  p4: { x: 8, y: 5, w: 4, h: 4 },
};

// Le champ s'agrandit avec les parcelles : en largeur à la deuxième, en profondeur à la
// troisième. La quatrième remplit le carré déjà cadré.
const FIELDS: Rect[] = [
  { x: 0, y: 0, w: 9, h: 5 },
  { x: 0, y: 0, w: 13, h: 5 },
  { x: 0, y: 0, w: 13, h: 9 },
  { x: 0, y: 0, w: 13, h: 9 },
];

const known = (plots: PlotId[]): PlotId[] => plots.filter((id) => !!PLOTS[id]);

export function fieldRect(plots: PlotId[]): Rect {
  const n = Math.min(FIELDS.length, Math.max(1, known(plots).length));
  return FIELDS[n - 1];
}

function rectTiles(r: Rect): TileKey[] {
  const out: TileKey[] = [];
  for (let y = r.y; y < r.y + r.h; y++)
    for (let x = r.x; x < r.x + r.w; x++) out.push(tileKey(x, y));
  return out;
}

export function soilTiles(plots: PlotId[]): TileKey[] {
  return known(plots).flatMap((id) => rectTiles(PLOTS[id]));
}

export function isSoil(plots: PlotId[], key: TileKey): boolean {
  const [x, y] = parseTileKey(key);
  return known(plots).some((id) => {
    const p = PLOTS[id];
    return x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h;
  });
}

export function fieldTiles(plots: PlotId[]): TileKey[] {
  return rectTiles(fieldRect(plots));
}

export function isInField(plots: PlotId[], key: TileKey): boolean {
  const [x, y] = parseTileKey(key);
  const f = fieldRect(plots);
  return x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h;
}
