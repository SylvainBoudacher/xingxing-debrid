import { MAP, type Rect } from "./catalog/map";
import type { ParcelId, Point } from "./types";

export const CELL = 1;

export interface CellSlot {
  key: string;
  parcel: ParcelId;
  rect: Rect;
  center: Point;
}

const cache = new Map<ParcelId, CellSlot[]>();

// grille de cases de CELL x CELL, centrée dans le rectangle de la parcelle
export function parcelCells(parcel: ParcelId): CellSlot[] {
  const hit = cache.get(parcel);
  if (hit) return hit;
  const r = MAP.parcels.find((p) => p.id === parcel)?.rect;
  if (!r) return [];
  const cols = Math.floor((r.x1 - r.x0) / CELL),
    rows = Math.floor((r.z1 - r.z0) / CELL);
  const ox = r.x0 + (r.x1 - r.x0 - cols * CELL) / 2,
    oz = r.z0 + (r.z1 - r.z0 - rows * CELL) / 2;
  const cells: CellSlot[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const x0 = ox + i * CELL,
        z0 = oz + j * CELL;
      cells.push({
        key: `${parcel}:${i}:${j}`,
        parcel,
        rect: { x0, x1: x0 + CELL, z0, z1: z0 + CELL },
        center: { x: x0 + CELL / 2, z: z0 + CELL / 2 },
      });
    }
  cache.set(parcel, cells);
  return cells;
}

export function cellAt(p: Point, parcels: readonly ParcelId[]): CellSlot | null {
  for (const id of parcels)
    for (const c of parcelCells(id))
      if (p.x >= c.rect.x0 && p.x < c.rect.x1 && p.z >= c.rect.z0 && p.z < c.rect.z1) return c;
  return null;
}
