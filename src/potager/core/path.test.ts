import { describe, expect, it } from "vitest";
import { MAP } from "./catalog/map";
import { findPath } from "./path";
import type { Point } from "./types";
import { isWalkable, type Walkable } from "./walk";

const w: Walkable = (x, z) => isWalkable(x, z, ["etal", "cabane"]);

function segmentsWalkable(from: Point, path: Point[]) {
  let a = from;
  for (const b of path) {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.25);
    for (let i = 0; i <= n; i++) {
      const t = n ? i / n : 0;
      if (!w(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
    }
    a = b;
  }
  return true;
}

describe("recherche de chemin", () => {
  it("rejoint un point de la terrasse en ligne praticable", () => {
    const path = findPath(MAP.spawn, { x: 5, z: 0 }, w);
    expect(path).not.toBeNull();
    expect(path![path!.length - 1]).toEqual({ x: 5, z: 0 });
    expect(segmentsWalkable(MAP.spawn, path!)).toBe(true);
  });

  it("passe par l'escalier pour monter sur le plateau", () => {
    const path = findPath(MAP.spawn, { x: 0, z: -8 }, w);
    expect(path).not.toBeNull();
    expect(path!.some((p) => p.x >= -11 && p.x <= -9.4)).toBe(true);
    expect(segmentsWalkable(MAP.spawn, path!)).toBe(true);
  });

  it("renonce à une cible hors de portée", () => {
    expect(findPath(MAP.spawn, { x: 0, z: 30 }, w)).toBeNull();
  });

  it("ne bouge pas vers sa propre position", () => {
    expect(findPath(MAP.spawn, MAP.spawn, w)).toEqual([]);
  });

  it("s'arrête au bord d'un bâtiment cliqué", () => {
    const path = findPath(MAP.spawn, { x: -5.3, z: -2.7 }, w);
    expect(path).not.toBeNull();
    const end = path![path!.length - 1]!;
    expect(w(end.x, end.z)).toBe(true);
  });
});
