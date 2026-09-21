import { describe, expect, it } from "vitest";
import { fieldRect, fieldTiles, isInField, isSoil, PLOTS, soilTiles } from "./plots";
import { createStarterSave } from "./starter";
import type { PlotId, TileKey } from "./types";

const ALL: PlotId[] = ["p1", "p2", "p3", "p4"];

describe("parcelles", () => {
  it("les quatre parcelles donnent 80 cases de terre", () => {
    expect(soilTiles(ALL)).toHaveLength(80);
    expect(soilTiles(["p1"])).toHaveLength(24);
    expect(soilTiles(["p1", "p2"])).toHaveLength(40);
    expect(soilTiles(["p1", "p2", "p3"])).toHaveLength(64);
  });

  it("les parcelles ne se chevauchent pas et laissent l'allée en x = 7", () => {
    expect(new Set(soilTiles(ALL)).size).toBe(80);
    for (const key of soilTiles(ALL)) expect(key.startsWith("7,")).toBe(false);
  });

  it("une parcelle inconnue est ignorée", () => {
    expect(soilTiles(["p1", "p9" as PlotId])).toEqual(soilTiles(["p1"]));
  });
});

describe("fieldRect", () => {
  it("le champ s'agrandit à la deuxième puis à la troisième parcelle", () => {
    expect(fieldRect(["p1"])).toEqual({ x: 0, y: 0, w: 9, h: 5 });
    expect(fieldRect(["p1", "p2"])).toEqual({ x: 0, y: 0, w: 13, h: 5 });
    expect(fieldRect(["p1", "p2", "p3"])).toEqual({ x: 0, y: 0, w: 13, h: 9 });
    expect(fieldRect(ALL)).toEqual({ x: 0, y: 0, w: 13, h: 9 });
  });

  it("le champ contient toujours toutes les parcelles débloquées", () => {
    for (let n = 1; n <= ALL.length; n++) {
      const plots = ALL.slice(0, n);
      const r = fieldRect(plots);
      for (const id of plots) {
        const p = PLOTS[id];
        expect(p.x >= r.x && p.x + p.w <= r.x + r.w).toBe(true);
        expect(p.y >= r.y && p.y + p.h <= r.y + r.h).toBe(true);
      }
      expect(fieldTiles(plots)).toHaveLength(r.w * r.h);
    }
  });

  it("isInField suit la taille du champ", () => {
    expect(isInField(["p1"], "9,0")).toBe(false);
    expect(isInField(["p1", "p2"], "9,0")).toBe(true);
    expect(isInField(["p1", "p2"], "0,5")).toBe(false);
    expect(isInField(["p1", "p2", "p3"], "0,5")).toBe(true);
    expect(isInField(ALL, "13,0")).toBe(false);
  });
});

describe("isSoil", () => {
  it("ne reconnaît que la terre des parcelles débloquées", () => {
    expect(isSoil(["p1"], "1,1")).toBe(true);
    expect(isSoil(["p1"], "8,1")).toBe(false);
    expect(isSoil(["p1", "p2"], "8,1")).toBe(true);
    expect(isSoil(ALL, "7,5")).toBe(false);
  });
});

describe("champ de départ", () => {
  it("le décor de départ tient dans le champ et hors de la terre", () => {
    const s = createStarterSave();
    for (const key of Object.keys(s.tiles) as TileKey[]) {
      expect(isInField(s.plots, key)).toBe(true);
      expect(isSoil(s.plots, key)).toBe(false);
    }
  });
});
