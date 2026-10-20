import { describe, expect, it } from "vitest";
import { MAP } from "./catalog/map";
import { parcelCells } from "./cells";
import { advanceNuisances, scareCrows, weedFactor } from "./nuisances";
import { createStarterSave } from "./save";
import type { Cell, PotagerSave } from "./types";

const always = () => 0;
const never = () => 0.999;
const sown: Cell = {
  kind: "plante",
  seed: { rarity: "commune", species: "tournesol", color: "yellow" },
  progress: 0.2,
  loose: false,
  sowGrade: "rate",
  wetUntil: 0,
  wetGrade: "rate",
  seen: true,
};
const cells = parcelCells("p0");
const withSown = (): PotagerSave => {
  const s = createStarterSave();
  return { ...s, cells: { ...s.cells, [cells[0].key]: sown } };
};
const repeat = (s: PotagerSave, n: number, rng = always) => {
  for (let i = 0; i < n; i++)
    s = advanceNuisances({ ...s, playTimeMs: s.playTimeMs + 1 }, 300_000, rng);
  return s;
};

describe("mauvaises herbes", () => {
  it("poussent sur la parcelle, trois au plus", () => {
    const s = createStarterSave();
    expect(Object.keys(advanceNuisances(s, 300_000, always).weeds)).toHaveLength(1);
    expect(Object.keys(repeat(s, 10).weeds)).toHaveLength(3);
  });

  it("ralentissent leur case et les voisines", () => {
    const s = { ...createStarterSave(), weeds: { [cells[7].key]: { at: 0 } } };
    // p0 : 6 colonnes x 3 rangées ; la case 7 est en colonne 1, rangée 1
    expect(weedFactor(s, cells[7].key)).toBe(0.5);
    expect(weedFactor(s, cells[0].key)).toBe(0.5);
    expect(weedFactor(s, cells[9].key)).toBe(1);
    const later = { ...s, weeds: { [cells[7].key]: { at: 10_000 } } };
    expect(weedFactor(later, cells[7].key)).toBe(1);
  });
});

describe("corneilles", () => {
  it("se posent sur un semis, deux au plus", () => {
    expect(advanceNuisances(createStarterSave(), 240_000, always).crows).toEqual({});
    const s = advanceNuisances(withSown(), 240_000, always);
    expect(s.crows[cells[0].key]).toEqual({ leaveAt: 180_000 });
    let many = createStarterSave();
    many = { ...many, cells: Object.fromEntries(cells.map((c) => [c.key, sown])) };
    expect(Object.keys(repeat(many, 10).crows).length).toBeLessThanOrEqual(2);
  });

  it("repartent d'elles-mêmes", () => {
    const s = {
      ...withSown(),
      playTimeMs: 200_000,
      crows: { [cells[0].key]: { leaveAt: 180_000 } },
    };
    expect(advanceNuisances(s, 1000, never).crows).toEqual({});
  });

  it("s'envolent quand l'avatar approche", () => {
    const s = { ...withSown(), crows: { [cells[0].key]: { leaveAt: 999_999 } } };
    const c = cells[0].center;
    expect(scareCrows(s, { x: c.x + 1.5, z: c.z }).crows).toEqual({});
    expect(scareCrows(s, { x: c.x + 3, z: c.z })).toBe(s);
  });
});

describe("forêt", () => {
  it("garnit au plus quatre points distincts", () => {
    const s = repeat(createStarterSave(), 10);
    const spots = Object.keys(s.forest).map(Number);
    expect(spots.length).toBeLessThanOrEqual(4);
    expect(spots.length).toBeGreaterThan(0);
    for (const i of spots) expect(i).toBeLessThan(MAP.forest.length);
  });

  it("ne fait rien apparaître sans tirage favorable", () => {
    const s = advanceNuisances(withSown(), 1000, never);
    expect([s.weeds, s.crows, s.forest]).toEqual([{}, {}, {}]);
  });
});
