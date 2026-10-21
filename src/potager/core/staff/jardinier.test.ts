import { describe, expect, it } from "vitest";
import { parcelCells } from "../cells";
import type { PotagerSave } from "../types";
import { advanceStaff } from "./crew";
import { hired, P0, plant, seedOf, village } from "./testkit";

const rng = () => 0.3;
const run = (s: PotagerSave, steps: number, watch?: (s: PotagerSave) => void) => {
  for (let i = 0; i < steps; i++) {
    s = advanceStaff(s, 1000, rng);
    s = { ...s, playTimeMs: s.playTimeMs + 1000 };
    watch?.(s);
  }
  return s;
};
const jardinier = (
  extra: Partial<PotagerSave> = {},
  level: 1 | 5 = 5,
  maxRarity = "commune" as const,
) => village({ staff: { jardinier: hired(level, { maxRarity }) }, ...extra });
const count = (s: PotagerSave, kind: string) => P0.filter((k) => s.cells[k].kind === kind).length;

describe("jardinier", () => {
  it("chasse la corneille avant la mauvaise herbe", () => {
    const [seed] = seedOf("commune");
    const s = jardinier({
      cells: { ...village().cells, [P0[0]]: plant(seed) },
      crows: { [P0[0]]: { leaveAt: Infinity } },
      weeds: { [P0[3]]: { at: 0 } },
    });
    let crowGoneFirst: boolean | null = null;
    run(s, 60, (x) => {
      if (crowGoneFirst !== null) return;
      if (!x.crows[P0[0]]) crowGoneFirst = !!x.weeds[P0[3]];
      else if (!x.weeds[P0[3]]) crowGoneFirst = false;
    });
    expect(crowGoneFirst).toBe(true);
  });

  it("bêche puis sème avec les graines du coffre, jamais celles du sac", () => {
    const s = jardinier({
      chest: [{ kind: "seeds", rarity: "commune", seeds: seedOf("commune", 3) }],
    });
    const out = run(s, 400);
    expect(count(out, "plante")).toBe(3);
    expect(count(out, "bechee")).toBe(P0.length - 3);
    expect(out.inventory).toEqual(s.inventory);
    expect(out.chest).toEqual([]);
  });

  it("bêche sans semer quand aucune graine permise n'est au coffre", () => {
    const s = jardinier({ chest: [{ kind: "seeds", rarity: "rare", seeds: seedOf("rare", 3) }] });
    const out = run(s, 400);
    expect(count(out, "plante")).toBe(0);
    expect(count(out, "bechee")).toBe(P0.length);
    expect(out.crew.jardinier?.status).toEqual({ kind: "noSeeds" });
  });

  it("sème les communes avant les rares", () => {
    const s = jardinier(
      {
        chest: [
          { kind: "seeds", rarity: "rare", seeds: seedOf("rare", 2) },
          { kind: "seeds", rarity: "commune", seeds: seedOf("commune", 2) },
        ],
      },
      5,
      "rare" as never,
    );
    let firstSown: string | null = null;
    run(s, 400, (x) => {
      const p = P0.map((k) => x.cells[k]).find((c) => c.kind === "plante");
      if (!firstSown && p?.kind === "plante") firstSown = p.seed.rarity;
    });
    expect(firstSown).toBe("commune");
  });

  it("sème sans Parfait et sans rien révéler", () => {
    const s = jardinier(
      { chest: [{ kind: "seeds", rarity: "commune", seeds: seedOf("commune", 5) }] },
      1,
    );
    const out = run(s, 600);
    const sown = P0.map((k) => out.cells[k]).filter((c) => c.kind === "plante");
    expect(sown.length).toBeGreaterThan(0);
    for (const c of sown) {
      expect(c.kind === "plante" && c.sowGrade).not.toBe("parfait");
      expect(c.kind === "plante" && c.seen).toBe(true);
    }
    expect(out.herbier).toEqual(s.herbier);
  });

  it("ne touche pas une parcelle possédée non confiée", () => {
    const p1 = Object.fromEntries(
      parcelCells("p1").map((c) => [c.key, { kind: "herbe" } as const]),
    );
    const s = jardinier({ parcels: ["p0", "p1"], cells: { ...village().cells, ...p1 } });
    const out = run(s, 300);
    expect(count(out, "bechee")).toBe(P0.length);
    for (const k of Object.keys(p1)) expect(out.cells[k].kind).toBe("herbe");
  });
});
