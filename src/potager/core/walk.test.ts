import { describe, expect, it } from "vitest";
import { MAP } from "./catalog/map";
import { isWalkable, nearestWalkable, type Walkable } from "./walk";

const b = ["etal", "cabane"] as const;
const w: Walkable = (x, z) => isWalkable(x, z, b);

describe("zones praticables", () => {
  it("laisse marcher au point de départ", () => {
    expect(isWalkable(MAP.spawn.x, MAP.spawn.z, b)).toBe(true);
  });

  it("bloque un bâtiment possédé seulement", () => {
    expect(isWalkable(-5.3, -2.7, b)).toBe(false);
    expect(isWalkable(-5.3, -2.7, [])).toBe(true);
  });

  it("bloque la mer, la barrière et les tonneaux", () => {
    expect(isWalkable(0, 8, b)).toBe(false);
    expect(isWalkable(0, -4.3, b)).toBe(false);
    expect(isWalkable(-7.8, -1.6, b)).toBe(false);
  });

  it("laisse marcher sur le plateau et l'escalier", () => {
    expect(isWalkable(0, -8, b)).toBe(true);
    expect(isWalkable(-10.2, -3, b)).toBe(true);
  });

  it("n'entre dans l'escalier que par le pied ou le haut", () => {
    expect(isWalkable(-11.2, -3, b)).toBe(false);
    expect(isWalkable(-9.3, -3, b)).toBe(false);
    expect(isWalkable(-11.2, -1, b)).toBe(true);
  });

  it("laisse marcher sur le sable", () => {
    expect(isWalkable(0, 6, b)).toBe(true);
  });

  it("trouve le point praticable le plus proche", () => {
    const p = nearestWalkable({ x: 0, z: 8.5 }, w);
    expect(p).not.toBeNull();
    expect(p!.z).toBeLessThanOrEqual(7.4);
    expect(nearestWalkable({ x: 0, z: 30 }, w)).toBeNull();
    const inside = nearestWalkable({ x: -5.3, z: -2.7 }, w);
    expect(inside && w(inside.x, inside.z)).toBe(true);
  });

  it("bloque l'abri et le puits", () => {
    expect(isWalkable(MAP.abri.x, MAP.abri.z, b)).toBe(false);
    expect(isWalkable(MAP.puits.x, MAP.puits.z, b)).toBe(false);
  });

  it("place les objets de forêt sur des points praticables", () => {
    expect(MAP.forest.length).toBeGreaterThanOrEqual(6);
    for (const p of MAP.forest) expect(isWalkable(p.x, p.z, b), `${p.x},${p.z}`).toBe(true);
  });
});
