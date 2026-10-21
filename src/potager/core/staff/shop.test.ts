import { describe, expect, it } from "vitest";
import { createStarterSave } from "../save";
import type { PotagerSave } from "../types";
import { buyMaison, hire, levelUp, setFloristActive, setMaxRarity, setStaffParcel } from "./shop";

const rich = (po: number, extra: Partial<PotagerSave> = {}): PotagerSave => ({
  ...createStarterSave(),
  po,
  ...extra,
});
const withMaison = (po: number) => rich(po, { buildings: ["etal", "cabane", "maison"] });
const ok = (r: PotagerSave | { refused: string }) => {
  if ("refused" in r) throw new Error(r.refused);
  return r;
};

describe("maison des employés", () => {
  it("refuse sans assez de PO", () => {
    const s = rich(149);
    expect(buyMaison(s)).toEqual({ refused: "po" });
  });

  it("se construit pour 150 PO, une seule fois", () => {
    const s = ok(buyMaison(rich(150)));
    expect(s.po).toBe(0);
    expect(s.buildings).toContain("maison");
    expect(buyMaison({ ...s, po: 500 })).toEqual({ refused: "deja" });
  });
});

describe("embauches", () => {
  it("demande la maison", () => {
    expect(hire(rich(1000), "arroseur")).toEqual({ refused: "maison" });
  });

  it("suit l'ordre des métiers", () => {
    expect(hire(withMaison(1000), "jardinier")).toEqual({ refused: "ordre" });
  });

  it("embauche l'arroseur pour 100 PO, sans parcelle", () => {
    const s = ok(hire(withMaison(100), "arroseur"));
    expect(s.po).toBe(0);
    expect(s.staff.arroseur).toEqual({
      level: 1,
      parcels: [],
      maxRarity: "commune",
      active: true,
    });
    expect(hire({ ...s, po: 100 }, "arroseur")).toEqual({ refused: "deja" });
    expect(hire(s, "jardinier")).toEqual({ refused: "po" });
  });
});

describe("niveaux", () => {
  it("coûtent 150, 240, 384 puis 614 PO pour l'arroseur", () => {
    let s = ok(hire(withMaison(100 + 150 + 240 + 384 + 614), "arroseur"));
    for (const [price, level] of [
      [150, 2],
      [240, 3],
      [384, 4],
      [614, 5],
    ]) {
      const before = s.po;
      s = ok(levelUp(s, "arroseur"));
      expect(before - s.po).toBe(price);
      expect(s.staff.arroseur?.level).toBe(level);
    }
    expect(levelUp({ ...s, po: 9999 }, "arroseur")).toEqual({ refused: "max" });
  });

  it("refusent faute de PO sans rien changer", () => {
    const s = ok(hire(withMaison(100), "arroseur"));
    expect(levelUp(s, "arroseur")).toEqual({ refused: "po" });
  });
});

describe("réglages", () => {
  const hired = () => ok(hire(withMaison(100), "arroseur"));

  it("confie et retire une parcelle possédée", () => {
    const on = setStaffParcel(hired(), "arroseur", "p0", true);
    expect(on.staff.arroseur?.parcels).toEqual(["p0"]);
    expect(setStaffParcel(on, "arroseur", "p0", true).staff.arroseur?.parcels).toEqual(["p0"]);
    expect(setStaffParcel(on, "arroseur", "p0", false).staff.arroseur?.parcels).toEqual([]);
  });

  it("ignore une parcelle non possédée ou un employé absent", () => {
    const s = hired();
    expect(setStaffParcel(s, "arroseur", "p1", true)).toBe(s);
    expect(setStaffParcel(s, "jardinier", "p0", true)).toBe(s);
  });

  it("ne confie jamais de parcelle au fleuriste", () => {
    const s = rich(0, {
      buildings: ["etal", "cabane", "maison"],
      staff: { fleuriste: { level: 1, parcels: [], maxRarity: "commune", active: true } },
    });
    expect(setStaffParcel(s, "fleuriste", "p0", true)).toBe(s);
  });

  it("règle la rareté du jardinier et l'interrupteur du fleuriste", () => {
    const h = { level: 1 as const, parcels: [], maxRarity: "commune" as const, active: true };
    const s = rich(0, { staff: { jardinier: h, fleuriste: h } });
    expect(setMaxRarity(s, "epique").staff.jardinier?.maxRarity).toBe("epique");
    expect(setFloristActive(s, false).staff.fleuriste?.active).toBe(false);
    const none = rich(0);
    expect(setMaxRarity(none, "rare")).toBe(none);
    expect(setFloristActive(none, false)).toBe(none);
  });
});
