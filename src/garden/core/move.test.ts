import { describe, expect, it } from "vitest";
import { planMove } from "./move";
import { createStarterSave } from "./starter";
import type { GardenSave, PlantTile } from "./types";

const plant: PlantTile = {
  kind: "plant",
  seed: { species: "aster", color: "violet", rarity: "commune" },
  sownAt: 123,
  watered: [{ start: 100, end: 200 }],
};

const s: GardenSave = {
  ...createStarterSave(),
  tiles: {
    "1,1": plant,
    "0,1": { kind: "decor", id: "lanterne" },
    "2,2": { kind: "hole", dugAt: 0 },
    "0,0": { kind: "leaves", since: 0 },
  },
};

describe("planMove", () => {
  it("déplace une plante vers une terre libre en gardant son historique", () => {
    const r = planMove(s, "1,1", "3,3");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.save.tiles["3,3"]).toBe(plant);
    expect(r.save.tiles["1,1"]).toBeUndefined();
  });

  it("une plante ne va que sur de la terre", () => {
    expect(planMove(s, "1,1", "8,0")).toEqual({
      ok: false,
      reason: "une plante ne va que sur de la terre",
    });
  });

  it("le décor va sur l'herbe comme sur la terre", () => {
    expect(planMove(s, "0,1", "8,0").ok).toBe(true);
    expect(planMove(s, "0,1", "4,4").ok).toBe(true);
  });

  it("refuse une case occupée ou hors du champ", () => {
    expect(planMove(s, "0,1", "2,2")).toEqual({ ok: false, reason: "la case est occupée" });
    expect(planMove(s, "0,1", "9,0")).toEqual({ ok: false, reason: "hors du champ" });
  });

  it("trous et tas ne se déplacent pas", () => {
    expect(planMove(s, "2,2", "3,3")).toEqual({ ok: false, reason: "rien à déplacer ici" });
    expect(planMove(s, "0,0", "8,0")).toEqual({ ok: false, reason: "rien à déplacer ici" });
  });

  it("relâcher sur place ne change rien", () => {
    expect(planMove(s, "1,1", "1,1")).toEqual({ ok: true, save: s });
  });
});
