import type { Target } from "../core/actions";
import { MAP, parcelSign } from "../core/catalog/map";
import { cellAt } from "../core/cells";
import type { Point, PotagerSave } from "../core/types";

export const near = (a: Point, b: Point, d: number) => Math.hypot(a.x - b.x, a.z - b.z) < d;

// élément du jardin sous un point cliqué au sol
export function targetAt(p: Point, save: PotagerSave): Target | null {
  const spot = Object.keys(save.forest)
    .map(Number)
    .find((i) => near(p, MAP.forest[i], 0.6));
  if (spot !== undefined) return { kind: "foret", spot };
  const c = cellAt(p, save.parcels);
  if (c) return { kind: "cell", key: c.key };
  const { abri, puits } = MAP;
  const onRect = (r: { x: number; z: number; w: number; d: number }) =>
    Math.abs(p.x - r.x) < r.w / 2 + 0.5 && Math.abs(p.z - r.z) < r.d / 2 + 0.5;
  if (onRect(abri)) return { kind: "abri" };
  if (near(p, puits, puits.r + 0.5)) return { kind: "puits" };
  for (const kind of ["etal", "cabane"] as const)
    if (onRect(MAP.buildings.find((b) => b.id === kind)!)) return { kind };
  const sign = MAP.parcels.find(
    (x) => !save.parcels.includes(x.id) && near(p, parcelSign(x.id), 0.8),
  );
  return sign ? { kind: "panneau", parcel: sign.id } : null;
}
