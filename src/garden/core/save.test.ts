import { describe, expect, it } from "vitest";
import { withDemoPlants } from "./demo";
import { growthOf } from "./growth";
import { isSoil, soilTiles } from "./plots";
import { parseSave } from "./save";
import { createStarterSave } from "./starter";

describe("plots", () => {
  it("la parcelle p1 couvre 24 cases", () => {
    expect(soilTiles(["p1"])).toHaveLength(24);
    expect(isSoil(["p1"], "1,1")).toBe(true);
    expect(isSoil(["p1"], "6,4")).toBe(true);
    expect(isSoil(["p1"], "0,1")).toBe(false);
    expect(isSoil(["p1"], "7,4")).toBe(false);
  });
});

describe("createStarterSave", () => {
  it("contient une parcelle, 3 graines, 1 sachet et du décor", () => {
    const s = createStarterSave();
    expect(s.version).toBe(1);
    expect(s.plots).toEqual(["p1"]);
    expect(s.inventory.seeds).toHaveLength(3);
    expect(s.sachets.pending).toEqual(["quotidien"]);
    expect(s.tiles["0,1"]).toEqual({ kind: "decor", id: "lanterne" });
  });

  it("le décor n'est jamais posé sur la terre", () => {
    const s = createStarterSave();
    for (const key of Object.keys(s.tiles) as (keyof typeof s.tiles)[]) {
      expect(isSoil(s.plots, key)).toBe(false);
    }
  });
});

describe("parseSave", () => {
  it("garde un brassage valide et vide un chaudron à recette inconnue", () => {
    const s = createStarterSave();
    const brewing = { ...s, atelier: { brew: { recipe: "rosee", startedAt: 42 } } };
    expect(parseSave(brewing)?.atelier.brew).toEqual({ recipe: "rosee", startedAt: 42 });
    const odd = { ...s, atelier: { brew: { recipe: "philtre", startedAt: 42 } } };
    expect(parseSave(odd)?.atelier.brew).toBeNull();
  });

  it("accepte une sauvegarde valide", () => {
    const s = createStarterSave();
    expect(parseSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it("refuse une version inconnue ou une forme cassée", () => {
    expect(parseSave(null)).toBeNull();
    expect(parseSave("texte")).toBeNull();
    expect(parseSave({ ...createStarterSave(), version: 2 })).toBeNull();
    expect(parseSave({ ...createStarterSave(), tiles: [] })).toBeNull();
    expect(parseSave({ ...createStarterSave(), inventory: undefined })).toBeNull();
  });

  it("convertit un pending numérique des anciennes sauvegardes", () => {
    const old = { ...createStarterSave(), sachets: { lastDailyAt: 123, pending: 3 } };
    expect(parseSave(old)?.sachets).toEqual({
      lastDailyAt: 123,
      pending: ["quotidien", "quotidien", "quotidien"],
    });
  });

  it("laisse intact un pending déjà en tableau, et rend une liste vide sinon", () => {
    const s = createStarterSave();
    expect(parseSave({ ...s, sachets: { lastDailyAt: 1, pending: [] } })?.sachets.pending).toEqual(
      [],
    );
    expect(parseSave({ ...s, sachets: { lastDailyAt: 1, pending: 0 } })?.sachets.pending).toEqual(
      [],
    );
    expect(parseSave({ ...s, sachets: { lastDailyAt: 1 } })?.sachets.pending).toEqual([]);
  });
});

describe("withDemoPlants", () => {
  it("sème des plantes à toutes les étapes dans la parcelle", () => {
    const now = Date.now();
    const s = withDemoPlants(createStarterSave(), now);
    const stages = new Set<number>();
    for (const [key, t] of Object.entries(s.tiles)) {
      if (t?.kind !== "plant") continue;
      expect(isSoil(s.plots, key as `${number},${number}`)).toBe(true);
      stages.add(growthOf(t, now, () => []).stage);
    }
    expect(stages).toEqual(new Set([0, 1, 2, 3, 4]));
  });
});

describe("paniers dans la sauvegarde", () => {
  it("complète progress.baskets s'il manque", () => {
    const raw = JSON.parse(JSON.stringify(createStarterSave()));
    delete raw.progress.baskets;
    expect(parseSave(raw)!.progress.baskets).toEqual({});
  });

  it("garde les dépôts déjà faits", () => {
    const raw = JSON.parse(JSON.stringify(createStarterSave()));
    raw.progress.baskets = { d4: { dahlia: 2 } };
    expect(parseSave(raw)!.progress.baskets).toEqual({ d4: { dahlia: 2 } });
  });
});
