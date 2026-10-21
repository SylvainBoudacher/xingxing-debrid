import { describe, expect, it } from "vitest";
import { harvestCell } from "../actions";
import { entryKey } from "../seeds";
import { announceEntries, orphanDiscoveries } from "./announce";
import { P0, plant, seedOf, village } from "./testkit";

const [seed] = seedOf("commune");
const k = entryKey(seed.species, seed.color);
const bloomed = () =>
  village({
    cells: { ...village().cells, [P0[0]]: plant(seed, { progress: 1, seen: false }) },
    herbier: { [k]: { discoveredAt: 1, announced: false } },
  });

describe("découvertes cueillies par un employé", () => {
  it("cueille sans annoncer ni marquer vue", () => {
    const r = harvestCell(bloomed(), P0[0], "bien", () => 0.999, true, false)!;
    expect(r.save.cells[P0[0]]).toEqual({ kind: "herbe" });
    expect(r.save.herbier[k].announced).toBe(false);
    expect(r.announce).toBeNull();
    expect(r.flower).toMatchObject({
      species: seed.species,
      color: seed.color,
      quality: "ordinaire",
    });
  });

  it("annonce comme le joueur quand on le demande", () => {
    const r = harvestCell(bloomed(), P0[0], "parfait", () => 0.999, true, true)!;
    expect(r.save.herbier[k].announced).toBe(true);
    expect(r.announce).toEqual({ species: seed.species, color: seed.color });
    expect(r.flower.quality).toBe("belle");
  });

  it("repère une entrée restée sans annonce", () => {
    const r = harvestCell(bloomed(), P0[0], "bien", () => 0.999, true, false)!;
    expect(orphanDiscoveries(r.save)).toEqual([k]);
    expect(announceEntries(r.save, [k]).herbier[k].announced).toBe(true);
  });

  it("attend que l'autre plante non vue de la même entrée soit montrée", () => {
    const s = bloomed();
    const two = { ...s, cells: { ...s.cells, [P0[1]]: plant(seed, { progress: 1, seen: false }) } };
    const r = harvestCell(two, P0[0], "bien", () => 0.999, true, false)!;
    expect(orphanDiscoveries(r.save)).toEqual([]);
  });
});
