import { describe, expect, it } from "vitest";
import { createStarterSave } from "../save";
import type { FlowerStack, PotagerSave, Slot } from "../types";
import { stockStall, unstockStall } from "./stall";

const rose = (count: number, species: FlowerStack["species"] = "dahlia"): FlowerStack => ({
  kind: "flowers",
  species,
  color: "red",
  quality: "belle",
  count,
});
const emptyBag = (): (Slot | null)[] => createStarterSave().inventory.map(() => null);
const base = (over: Partial<PotagerSave> = {}): PotagerSave => ({
  ...createStarterSave(),
  ...over,
});

describe("stockStall", () => {
  it("complète la pile identique puis ouvre une nouvelle pile", () => {
    const inventory = emptyBag();
    inventory[0] = rose(3);
    const out = stockStall(base({ inventory, stall: [rose(4)] }), 0)!;
    expect(out.stall.map((p) => p.count)).toEqual([5, 2]);
    expect(out.inventory[0]).toBeNull();
  });
  it("null et rien ne bouge si la réserve est pleine", () => {
    const inventory = emptyBag();
    inventory[0] = rose(3);
    const stall = Array.from({ length: 6 }, () => rose(5, "aster"));
    const save = base({ inventory, stall });
    expect(stockStall(save, 0)).toBeNull();
    expect(save.stall).toHaveLength(6);
  });
  it("null pour une pile de graines", () => {
    const inventory = emptyBag();
    inventory[0] = { kind: "seeds", rarity: "commune", seeds: [] };
    expect(stockStall(base({ inventory }), 0)).toBeNull();
  });
});

describe("unstockStall", () => {
  it("null quand le sac est plein", () => {
    const inventory = emptyBag().map(() => rose(1));
    expect(unstockStall(base({ inventory, stall: [rose(2)] }), 0)).toBeNull();
  });
  it("rend la pile entière au sac", () => {
    const inventory = emptyBag();
    const out = unstockStall(base({ inventory, stall: [rose(2)] }), 0)!;
    expect(out.stall).toHaveLength(0);
    expect(out.inventory[0]).toMatchObject({ kind: "flowers", count: 2 });
  });
});
