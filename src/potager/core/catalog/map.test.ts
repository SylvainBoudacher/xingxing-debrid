import { describe, expect, it } from "vitest";
import { createStarterSave } from "../save";
import { BUILDING_IDS } from "../types";
import { cellAt } from "../cells";
import { findPath } from "../path";
import { isWalkable, type Walkable } from "../walk";
import { groundHeight, maisonSign, maisonStand, MAP, parcelStake, type Rect } from "./map";

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

  it("place l'abri et le puits dans les bornes, sans chevauchement", () => {
    const { abri, puits } = MAP;
    const extra = [
      {
        id: "abri",
        rect: {
          x0: abri.x - abri.w / 2,
          x1: abri.x + abri.w / 2,
          z0: abri.z - abri.d / 2,
          z1: abri.z + abri.d / 2,
        },
      },
      {
        id: "puits",
        rect: {
          x0: puits.x - puits.r,
          x1: puits.x + puits.r,
          z0: puits.z - puits.r,
          z1: puits.z + puits.r,
        },
      },
    ];
    for (const e of extra) {
      expect(inside(e.rect, MAP.bounds), e.id).toBe(true);
      for (const f of footprints) expect(overlap(e.rect, f.rect), `${e.id}/${f.id}`).toBe(false);
    }
  });
});

describe("maison et piquets", () => {
  const walkable: Walkable = (x, z) => isWalkable(x, z, ["etal", "cabane", "maison"]);

  it("place le panneau de chantier sur la maison", () => {
    const b = MAP.buildings.find((x) => x.id === "maison")!;
    expect(maisonSign()).toEqual({ x: b.x, z: b.z });
  });

  it("rend la maison joignable une fois construite", () => {
    const stand = maisonStand();
    expect(walkable(stand.x, stand.z)).toBe(true);
    expect(findPath(MAP.spawn, stand, walkable)).not.toBeNull();
  });

  it("ne pose pas la maison sur l'abri, le puits, les tonneaux, les troncs ni l'escalier", () => {
    const b = MAP.buildings.find((x) => x.id === "maison")!;
    const r = { x0: b.x - b.w / 2, x1: b.x + b.w / 2, z0: b.z - b.d / 2, z1: b.z + b.d / 2 };
    const { abri, puits } = MAP;
    const abriR = {
      x0: abri.x - abri.w / 2,
      x1: abri.x + abri.w / 2,
      z0: abri.z - abri.d / 2,
      z1: abri.z + abri.d / 2,
    };
    expect(overlap(r, abriR)).toBe(false);
    const pr = puits.r + 0.3;
    expect(
      overlap(r, { x0: puits.x - pr, x1: puits.x + pr, z0: puits.z - pr, z1: puits.z + pr }),
    ).toBe(false);
    for (const p of [...MAP.barrels, ...MAP.trees])
      expect(overlap(r, { x0: p.x - 0.5, x1: p.x + 0.5, z0: p.z - 0.5, z1: p.z + 0.5 })).toBe(
        false,
      );
    for (const s of MAP.stairs)
      expect(overlap(r, { x0: s.x0, x1: s.x1, z0: -4, z1: s.zFoot })).toBe(false);
  });

  it("plante un piquet praticable hors des cases au bord de chaque parcelle", () => {
    const all = MAP.parcels.map((p) => p.id);
    for (const id of all) {
      const p = parcelStake(id);
      expect(walkable(p.x, p.z), id).toBe(true);
      expect(cellAt(p, all), id).toBeNull();
      expect(findPath(MAP.spawn, p, walkable), id).not.toBeNull();
    }
  });
});
