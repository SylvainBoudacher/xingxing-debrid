import { describe, expect, it } from "vitest";
import { entriesOfRarity } from "../catalog/species";
import { stepSim } from "../clock";
import { createStarterSave } from "../save";
import { entryKey, seededRng } from "../seeds";
import type { FlowerStack, PotagerSave } from "../types";
import { advanceClients, rollDemand, serve } from "./clients";
import { salePrice } from "./price";

const pile = (count: number): FlowerStack => ({
  kind: "flowers",
  species: "dahlia",
  color: "red",
  quality: "belle",
  count,
});
const herbierOf = (keys: string[]) =>
  Object.fromEntries(keys.map((k) => [k, { discoveredAt: 0, announced: true }]));
const base = (over: Partial<PotagerSave> = {}): PotagerSave => ({
  ...createStarterSave(),
  herbier: herbierOf(["dahlia:red"]),
  playTimeMs: 100_000,
  ...over,
});

describe("rollDemand", () => {
  it("null si l'Herbier est vide", () => {
    expect(rollDemand(base({ herbier: {} }), () => 0.5)).toBeNull();
  });
  it("ne demande que des entrées découvertes", () => {
    const keys = ["dahlia:red", "tournesol:white", "aster:blue", "cosmos:yellow"];
    const save = base({ herbier: herbierOf(keys) });
    const rng = seededRng(42);
    for (let i = 0; i < 1000; i++) {
      const d = rollDemand(save, rng)!;
      expect(keys).toContain(entryKey(d.species, d.color));
    }
  });
  it("renormalise : que des communes si l'Herbier n'en a que", () => {
    const commune = entriesOfRarity("commune").map((e) => entryKey(e.species, e.color));
    const save = base({ herbier: herbierOf(commune.slice(0, 3)) });
    const rng = seededRng(7);
    for (let i = 0; i < 200; i++) {
      const d = rollDemand(save, rng)!;
      expect(commune).toContain(entryKey(d.species, d.color));
    }
  });
});

describe("advanceClients", () => {
  it("pas de client sans réserve", () => {
    const s = advanceClients(base({ nextClientAt: 0 }), () => 0.5);
    expect(s.client).toBeNull();
  });
  it("client seulement quand nextClientAt est passé", () => {
    expect(
      advanceClients(base({ stall: [pile(1)], nextClientAt: 200_000 }), () => 0.5).client,
    ).toBeNull();
    const s = advanceClients(base({ stall: [pile(1)], nextClientAt: 100_000 }), () => 0.5);
    expect(s.client).not.toBeNull();
    expect(s.client!.look).toBeGreaterThanOrEqual(0);
    expect(s.client!.look).toBeLessThan(4);
  });
  it("le client repart quand la réserve est vide", () => {
    const s = base({
      stall: [],
      po: 33,
      nextClientAt: 0,
      client: { demand: { species: "dahlia", color: "red" }, look: 1 },
    });
    const r = advanceClients(s, seededRng(3));
    expect(r.client).toBeNull();
    expect(r.po).toBe(33);
    expect(r.nextClientAt).toBeGreaterThanOrEqual(100_000 + 5000);
    expect(r.nextClientAt).toBeLessThanOrEqual(100_000 + 15_000);
  });
  it("stepSim fait arriver un client", () => {
    const s = stepSim(base({ stall: [pile(2)], nextClientAt: 0 }), 1000, () => 0.999);
    expect(s.client).not.toBeNull();
  });
});

describe("serve", () => {
  const client = { demand: { species: "dahlia" as const, color: "red" as const }, look: 0 };
  it("retire une fleur et paie", () => {
    const s = base({ stall: [pile(2)], client, po: 10 });
    const r = serve(s, 0, "parfait", seededRng(1))!;
    expect(r.save.stall[0].count).toBe(1);
    expect(r.gain).toBe(salePrice(pile(1), client.demand, "parfait"));
    expect(r.save.po).toBe(10 + r.gain);
    expect(r.save.client).toBeNull();
  });
  it("supprime la pile à 0", () => {
    const r = serve(base({ stall: [pile(1)], client }), 0, "rate", seededRng(1))!;
    expect(r.save.stall).toHaveLength(0);
  });
  it("null sans client ou sans pile", () => {
    expect(serve(base({ stall: [pile(1)] }), 0, "rate", () => 0)).toBeNull();
    expect(serve(base({ stall: [pile(1)], client }), 3, "rate", () => 0)).toBeNull();
  });
});
