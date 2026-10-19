import type { BuildingId, ParcelId, Point } from "../types";

export interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

// bloc de terrain plein : `top` = hauteur du sol
export interface Terrace {
  rect: Rect;
  top: number;
  bottom: number;
}

export interface Stair {
  x0: number;
  x1: number;
  zFoot: number;
  from: number;
  to: number;
  steps: number;
}

export interface PathStrip {
  rect: Rect;
  y: number;
}

export interface BuildingSlot {
  id: BuildingId;
  x: number;
  z: number;
  y: number;
  w: number;
  d: number;
}

export interface ParcelSlot {
  id: ParcelId;
  rect: Rect;
  y: number;
}

export interface TreeSpot {
  x: number;
  z: number;
  y: number;
  palette: number;
  size: number;
}

const MIDDLE = 0;
const PLATEAU = 2.2;
const SHORE = -3;

// Les terrasses débordent des bornes : la caméra bornée ne doit jamais voir le vide.
export const MAP = {
  bounds: { x0: -24, x1: 24, z0: -14, z1: 8 },
  terraces: [
    { rect: { x0: -34, x1: 34, z0: -4, z1: 4.6 }, top: MIDDLE, bottom: SHORE },
    { rect: { x0: -34, x1: 34, z0: -34, z1: -4 }, top: PLATEAU, bottom: SHORE },
    { rect: { x0: -34, x1: 34, z0: 4.6, z1: 8.5 }, top: SHORE, bottom: -7 },
  ],
  stairs: [{ x0: -11, x1: -9.4, zFoot: -1.5, from: MIDDLE, to: PLATEAU, steps: 5 }],
  paths: [
    { rect: { x0: -30, x1: 30, z0: 2.1, z1: 3.5 }, y: MIDDLE },
    { rect: { x0: -5.4, x1: -4.15, z0: -1.4, z1: 2.1 }, y: MIDDLE },
    { rect: { x0: -15.6, x1: -14.6, z0: -1.6, z1: 2.1 }, y: MIDDLE },
    { rect: { x0: -9, x1: 18, z0: -5.6, z1: -4.6 }, y: PLATEAU },
  ],
  water: { y: -3.4, zFrom: 8.5 },
  buildings: [
    { id: "etal", x: -5.3, z: -2.7, y: MIDDLE, w: 3.6, d: 2.6 },
    { id: "cabane", x: -15.5, z: -2.7, y: MIDDLE, w: 2.6, d: 2.2 },
    { id: "atelier", x: -6, z: -8, y: PLATEAU, w: 3.6, d: 2.8 },
    { id: "serre", x: 14, z: -9, y: PLATEAU, w: 4, d: 3 },
  ],
  parcels: [
    { id: "p0", rect: { x0: 0.6, x1: 7.4, z0: -1.9, z1: 1.7 }, y: MIDDLE },
    { id: "p1", rect: { x0: 9, x1: 15.8, z0: -1.9, z1: 1.7 }, y: MIDDLE },
    { id: "p2", rect: { x0: -22, x1: -17, z0: -1.2, z1: 1.4 }, y: MIDDLE },
    { id: "p3", rect: { x0: 2, x1: 9, z0: -10, z1: -6.5 }, y: PLATEAU },
  ],
  // tonneaux devant l'étal
  barrels: [
    { x: -7.8, z: -1.6 },
    { x: -8.4, z: -0.9 },
  ],
  // abri de jardin (râtelier et coffre) et puits : toujours présents
  abri: { x: -1.8, z: -2.7, w: 1.8, d: 1.6 },
  puits: { x: 18.5, z: -0.5, r: 0.8 },
  spawn: { x: -2, z: 1.2 },
  spawnView: { x: 0, z: -0.6 },
  trees: [
    { x: -15, z: -6.5, y: PLATEAU, palette: 0, size: 4.2 },
    { x: -10.5, z: -9.5, y: PLATEAU, palette: 1, size: 4.8 },
    { x: -1.5, z: -7.6, y: PLATEAU, palette: 3, size: 4.2 },
    { x: 10.5, z: -6.8, y: PLATEAU, palette: 1, size: 4.4 },
    { x: 19, z: -8, y: PLATEAU, palette: 0, size: 4.6 },
    { x: -20, z: -9, y: PLATEAU, palette: 2, size: 5 },
    { x: -12, z: -13, y: PLATEAU, palette: 2, size: 5.4 },
    { x: 1.5, z: -14, y: PLATEAU, palette: 1, size: 5.6 },
    { x: 8, z: -15, y: PLATEAU, palette: 0, size: 5.8 },
    { x: -4, z: -16, y: PLATEAU, palette: 3, size: 5.4 },
    { x: 15.5, z: -13.5, y: PLATEAU, palette: 3, size: 5 },
    { x: 23, z: -11, y: PLATEAU, palette: 2, size: 5.2 },
    { x: -26, z: -12, y: PLATEAU, palette: 0, size: 5.4 },
  ],
} satisfies {
  bounds: Rect;
  terraces: Terrace[];
  stairs: Stair[];
  paths: PathStrip[];
  water: { y: number; zFrom: number };
  buildings: BuildingSlot[];
  parcels: ParcelSlot[];
  barrels: Point[];
  abri: { x: number; z: number; w: number; d: number };
  puits: { x: number; z: number; r: number };
  spawn: Point;
  spawnView: { x: number; z: number };
  trees: TreeSpot[];
};

const contains = (r: Rect, x: number, z: number) =>
  x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;

// pied de l'escalier côté terrasse du milieu, haut contre la falaise (z = -4)
const CLIFF_Z = -4;

export function groundHeight(x: number, z: number): number {
  for (const s of MAP.stairs)
    if (x >= s.x0 && x <= s.x1 && z >= CLIFF_Z && z <= s.zFoot)
      return s.from + ((s.zFoot - z) / (s.zFoot - CLIFF_Z)) * (s.to - s.from);
  let h = -Infinity;
  for (const t of MAP.terraces) if (contains(t.rect, x, z)) h = Math.max(h, t.top);
  return h === -Infinity ? MAP.water.y : h;
}
