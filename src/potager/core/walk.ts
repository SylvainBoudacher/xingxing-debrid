import { MAP } from "./catalog/map";
import type { BuildingId, Point } from "./types";

export type Walkable = (x: number, z: number) => boolean;

const MIDDLE_Z: [number, number] = [-3.6, 4.2];
const PLATEAU_Z: [number, number] = [MAP.bounds.z0 + 0.5, -4.7];
const BUILDING_PAD = 0.3;
const BARREL_R = 0.45;
const TRUNK_R = 0.5;

const within = (v: number, [a, b]: [number, number]) => v >= a && v <= b;
const near = (p: Point, x: number, z: number, r: number) => Math.hypot(p.x - x, p.z - z) < r;

function onGround(x: number, z: number) {
  // les flancs de l'escalier sont fermés : on n'y entre que par le pied ou le haut
  for (const s of MAP.stairs)
    if (x >= s.x0 - 0.2 && x <= s.x1 + 0.2 && within(z, [-4.7, s.zFoot]))
      return x >= s.x0 + 0.2 && x <= s.x1 - 0.2;
  if (!within(x, [MAP.bounds.x0 + 0.5, MAP.bounds.x1 - 0.5])) return false;
  return within(z, MIDDLE_Z) || within(z, PLATEAU_Z);
}

export function isWalkable(x: number, z: number, buildings: readonly BuildingId[]): boolean {
  if (!onGround(x, z)) return false;
  for (const b of MAP.buildings)
    if (
      buildings.includes(b.id) &&
      Math.abs(x - b.x) < b.w / 2 + BUILDING_PAD &&
      Math.abs(z - b.z) < b.d / 2 + BUILDING_PAD
    )
      return false;
  const { abri, puits } = MAP;
  if (
    Math.abs(x - abri.x) < abri.w / 2 + BUILDING_PAD &&
    Math.abs(z - abri.z) < abri.d / 2 + BUILDING_PAD
  )
    return false;
  if (near(puits, x, z, puits.r + BUILDING_PAD)) return false;
  if (MAP.barrels.some((p) => near(p, x, z, BARREL_R))) return false;
  return !MAP.trees.some((t) => near(t, x, z, TRUNK_R));
}

const STEP = 0.25;

// anneaux de rayon croissant autour de p
export function nearestWalkable(p: Point, walkable: Walkable, maxDist = 2.5): Point | null {
  if (walkable(p.x, p.z)) return { x: p.x, z: p.z };
  for (let r = STEP; r <= maxDist + 1e-9; r += STEP) {
    const n = Math.ceil((2 * Math.PI * r) / STEP);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI;
      const x = p.x + Math.cos(a) * r,
        z = p.z + Math.sin(a) * r;
      if (walkable(x, z)) return { x, z };
    }
  }
  return null;
}

export function segmentWalkable(a: Point, b: Point, walkable: Walkable): boolean {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / STEP));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    if (!walkable(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
  }
  return true;
}
