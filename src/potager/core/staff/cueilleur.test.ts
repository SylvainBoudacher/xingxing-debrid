import { describe, expect, it } from "vitest";
import { CHEST_SIZES } from "../economy/catalog";
import type { ChestStack, PotagerSave } from "../types";
import { advanceStaff } from "./crew";
import { orphanDiscoveries } from "./announce";
import { entryKey } from "../seeds";
import { hired, P0, plant, seedOf, village } from "./testkit";

const run = (s: PotagerSave, steps: number) => {
  for (let i = 0; i < steps; i++) {
    s = advanceStaff(s, 1000, () => 0.999);
    s = { ...s, playTimeMs: s.playTimeMs + 1000 };
  }
  return s;
};
const [seed] = seedOf("commune");
const blooms = (n: number, extra = {}) => {
  const cells = { ...village().cells };
  for (const k of P0.slice(0, n)) cells[k] = plant(seed, { progress: 1, ...extra });
  return cells;
};
const flowersIn = (chest: ChestStack[]) =>
  chest.reduce((n, c) => n + (c.kind === "flowers" ? c.count : 0), 0);
const fillers = (n: number): ChestStack[] =>
  Array.from({ length: n }, (_, i) => ({
    kind: "seeds",
    rarity: "epique",
    seeds: seedOf("epique", 1 + i),
  }));

describe("cueilleur", () => {
  it("range au coffre en deux tournées, fleurs ordinaires seulement", () => {
    const s = village({ cells: blooms(7), staff: { cueilleur: hired(5) } });
    const out = run(s, 300);
    expect(flowersIn(out.chest)).toBe(7);
    expect(out.chest.every((c) => c.kind !== "flowers" || c.quality === "ordinaire")).toBe(true);
    expect(P0.slice(0, 7).every((k) => out.cells[k].kind === "herbe")).toBe(true);
    expect(out.inventory).toEqual(s.inventory);
  });

  it("s'arrête coffre plein, puis reprend quand il s'agrandit", () => {
    const s = village({
      cells: blooms(7),
      chest: fillers(CHEST_SIZES[0]),
      staff: { cueilleur: hired(5) },
    });
    const stuck = run(s, 300);
    expect(stuck.crew.cueilleur?.status).toEqual({ kind: "chestFull" });
    expect(stuck.crew.cueilleur?.carry.flowers.reduce((n, f) => n + f.count, 0)).toBe(5);
    expect(P0.slice(0, 7).filter((k) => stuck.cells[k].kind === "plante")).toHaveLength(2);
    const out = run({ ...stuck, chestLevel: 1 }, 300);
    expect(flowersIn(out.chest)).toBe(7);
  });

  it("laisse l'annonce d'une fleur non vue au joueur", () => {
    const s = village({
      cells: blooms(1, { seen: false }),
      herbier: { [entryKey(seed.species, seed.color)]: { discoveredAt: 1, announced: false } },
      staff: { cueilleur: hired(5) },
    });
    const out = run(s, 200);
    expect(out.cells[P0[0]].kind).toBe("herbe");
    expect(orphanDiscoveries(out)).toEqual([entryKey(seed.species, seed.color)]);
  });
});
