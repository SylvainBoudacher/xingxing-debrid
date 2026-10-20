import { describe, expect, it } from "vitest";
import { parcelCells } from "../cells";
import { createStarterSave } from "../save";
import { rollSeed, seededRng } from "../seeds";
import type { ChestStack, PotagerSave, Slot } from "../types";
import { buyChestUpgrade, buyParcel, buySachet, buyStallUpgrade, buyTool } from "./shop";

const base = (over: Partial<PotagerSave> = {}): PotagerSave => ({
  ...createStarterSave(),
  ...over,
});
const emptyBag = (): (Slot | null)[] => base().inventory.map(() => null);
const fullPile = (rarity: "commune" | "rare" | "epique" | "legendaire"): Slot => ({
  kind: "seeds",
  rarity,
  seeds: Array.from({ length: 5 }, () => rollSeed(rarity, () => 0)),
});
const chestPile = (rarity: "commune" | "rare" | "epique" | "legendaire"): ChestStack => ({
  kind: "seeds",
  rarity,
  seeds: [rollSeed(rarity, () => 0)],
});

describe("buySachet", () => {
  it("15 PO : accepté, 0 PO, 3 graines", () => {
    const out = buySachet(base({ po: 15, inventory: emptyBag() }), "simple", seededRng(1));
    if ("refused" in out) throw new Error("refusé");
    expect(out.save.po).toBe(0);
    expect(out.seeds).toHaveLength(3);
    expect(out.toChest).toBe(false);
  });
  it("14 PO : refusé", () => {
    expect(buySachet(base({ po: 14 }), "simple", seededRng(1))).toEqual({ refused: "po" });
  });
  it("sac et coffre sans place : refusé, PO intacts", () => {
    const inventory = emptyBag().map(() => fullPile("legendaire"));
    const chest = Array.from({ length: 12 }, () => chestPile("commune"));
    const full = base({ po: 150, inventory, chest });
    const out = buySachet(full, "luxe", () => 0.99);
    expect(out).toEqual({ refused: "place" });
    expect(full.po).toBe(150);
  });
  it("sac plein, coffre avec place : graines au coffre", () => {
    const inventory = emptyBag().map(() => fullPile("legendaire"));
    const out = buySachet(base({ po: 15, inventory }), "simple", seededRng(1));
    if ("refused" in out) throw new Error("refusé");
    expect(out.toChest).toBe(true);
    expect(out.save.chest.length).toBeGreaterThan(0);
  });
  it("le sachet de luxe ne donne jamais de commune", () => {
    const rng = seededRng(5);
    for (let i = 0; i < 200; i++) {
      const out = buySachet(base({ po: 150, inventory: emptyBag() }), "luxe", rng);
      if ("refused" in out) throw new Error("refusé");
      expect(out.seeds.every((s) => s.rarity !== "commune")).toBe(true);
    }
  });
});

describe("buyParcel", () => {
  it("ajoute la parcelle et ses cases en herbe, puis refuse un second achat", () => {
    const out = buyParcel(base({ po: 80 }), "p1");
    if ("refused" in out) throw new Error("refusé");
    expect(out.parcels).toContain("p1");
    expect(out.po).toBe(0);
    for (const c of parcelCells("p1")) expect(out.cells[c.key]).toEqual({ kind: "herbe" });
    expect(buyParcel({ ...out, po: 500 }, "p1")).toEqual({ refused: "deja" });
  });
  it("refuse sans assez de PO", () => {
    expect(buyParcel(base({ po: 79 }), "p1")).toEqual({ refused: "po" });
  });
});

describe("buyTool", () => {
  it("bêche au râtelier : niveau 2 au râtelier", () => {
    const inventory = emptyBag();
    const out = buyTool(base({ po: 120, inventory, rack: [{ id: "beche" }] }), "beche");
    if ("refused" in out) throw new Error("refusé");
    expect(out.rack[0].level).toBe(2);
    expect(buyTool({ ...out, po: 500 }, "beche")).toEqual({ refused: "deja" });
  });
  it("bêche dans le sac : niveau 2, même case", () => {
    const inventory = emptyBag();
    inventory[2] = { kind: "tool", tool: { id: "beche" } };
    const out = buyTool(base({ po: 120, inventory, rack: [] }), "beche");
    if ("refused" in out) throw new Error("refusé");
    expect(out.inventory[2]).toEqual({ kind: "tool", tool: { id: "beche", level: 2 } });
  });
});

describe("améliorations", () => {
  it("étal 6, 9, 12 puis déjà", () => {
    let s = base({ po: 260 });
    for (const [level, po] of [
      [1, 200],
      [2, 0],
    ]) {
      const out = buyStallUpgrade(s);
      if ("refused" in out) throw new Error("refusé");
      s = out;
      expect(s.stallLevel).toBe(level);
      expect(s.po).toBe(po);
    }
    expect(buyStallUpgrade({ ...s, po: 999 })).toEqual({ refused: "deja" });
  });
  it("coffre 12, 18, 24 puis déjà", () => {
    let s = base({ po: 330 });
    for (const [level, po] of [
      [1, 250],
      [2, 0],
    ]) {
      const out = buyChestUpgrade(s);
      if ("refused" in out) throw new Error("refusé");
      s = out;
      expect(s.chestLevel).toBe(level);
      expect(s.po).toBe(po);
    }
    expect(buyChestUpgrade({ ...s, po: 999 })).toEqual({ refused: "deja" });
  });
});
