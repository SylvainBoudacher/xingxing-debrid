import { describe, expect, it } from "vitest";
import { createStarterSave } from "../save";
import { BUILDING_IDS } from "../types";
import { groundHeight, MAP, type Rect } from "./map";

const inside = (r: Rect, b: Rect) => r.x0 >= b.x0 && r.x1 <= b.x1 && r.z0 >= b.z0 && r.z1 <= b.z1;
const overlap = (a: Rect, b: Rect) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;
const buildingRect = (b: (typeof MAP.buildings)[number]): Rect => ({
  x0: b.x - b.w / 2,
  x1: b.x + b.w / 2,
  z0: b.z - b.d / 2,
  z1: b.z + b.d / 2,
});
const footprints = [
  ...MAP.parcels.map((p) => ({ id: p.id, rect: p.rect })),
  ...MAP.buildings.map((b) => ({ id: b.id, rect: buildingRect(b) })),
];

describe("disposition du village", () => {
  it("garde parcelles et bâtiments dans les bornes", () => {
    for (const f of footprints) expect(inside(f.rect, MAP.bounds), f.id).toBe(true);
  });

  it("ne superpose ni parcelles ni bâtiments", () => {
    for (let i = 0; i < footprints.length; i++)
      for (let j = i + 1; j < footprints.length; j++)
        expect(
          overlap(footprints[i].rect, footprints[j].rect),
          `${footprints[i].id}/${footprints[j].id}`,
        ).toBe(false);
  });

  it("pose chaque parcelle et chaque bâtiment à la hauteur du sol", () => {
    for (const p of MAP.parcels) {
      const { x0, x1, z0, z1 } = p.rect;
      expect(groundHeight((x0 + x1) / 2, (z0 + z1) / 2), p.id).toBe(p.y);
    }
    for (const b of MAP.buildings) expect(groundHeight(b.x, b.z), b.id).toBe(b.y);
  });

  it("fait naître l'avatar sur la terrasse du milieu", () => {
    expect(groundHeight(MAP.spawn.x, MAP.spawn.z)).toBe(0);
  });

  it("a des identifiants uniques et chaque bâtiment une fois", () => {
    expect(new Set(MAP.parcels.map((p) => p.id)).size).toBe(MAP.parcels.length);
    expect(MAP.buildings.map((b) => b.id).sort()).toEqual([...BUILDING_IDS].sort());
  });

  it("cadre la partie de départ sur la vue de départ", () => {
    expect(createStarterSave().camera).toEqual({ ...MAP.spawnView, mode: "follow" });
  });

  it("fait monter l'escalier du milieu au plateau", () => {
    expect(groundHeight(-10.2, -1.5)).toBe(0);
    expect(groundHeight(-10.2, -4)).toBe(2.2);
    expect(groundHeight(-10.2, -2.75)).toBeCloseTo(1.1);
    expect(groundHeight(0, 0)).toBe(0);
    expect(groundHeight(0, -8)).toBe(2.2);
  });
});
