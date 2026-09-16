import { describe, expect, it } from "vitest";
import { bump } from "./counters";
import { LEAF_SLOT_MS } from "./leaves";
import { FIELD, fieldTiles, isInField } from "./plots";
import { parseSave } from "./save";
import { CUT_SPECIES, harvestTool } from "./species";
import { createStarterSave } from "./starter";
import { isMovable, setTile } from "./tiles";

describe("FIELD", () => {
  it("couvre 9 x 5 cases, ligne par ligne", () => {
    expect(FIELD).toEqual({ x: 0, y: 0, w: 9, h: 5 });
    const tiles = fieldTiles();
    expect(tiles).toHaveLength(45);
    expect(tiles.slice(0, 2)).toEqual(["0,0", "1,0"]);
    expect(tiles[44]).toBe("8,4");
  });

  it("isInField borne la grille", () => {
    expect(isInField("0,0")).toBe(true);
    expect(isInField("8,4")).toBe(true);
    expect(isInField("9,0")).toBe(false);
    expect(isInField("0,5")).toBe(false);
    expect(isInField("-1,2")).toBe(false);
  });

  it("le décor de départ est dans la grille", () => {
    for (const key of Object.keys(createStarterSave().tiles))
      expect(isInField(key as `${number},${number}`)).toBe(true);
  });
});

describe("harvestTool", () => {
  it("sécateur pour les tiges épaisses, main pour les autres", () => {
    expect([...CUT_SPECIES].sort()).toEqual([
      "chrysantheme",
      "dahlia",
      "rosetremiere",
      "tournesol",
    ]);
    expect(harvestTool("dahlia")).toBe("secateur");
    expect(harvestTool("cosmos")).toBe("main");
  });
});

describe("bump", () => {
  it("incrémente sans modifier l'original", () => {
    const s = createStarterSave();
    const a = bump(s, "dug");
    const b = bump(a, "dug");
    expect(b.progress.counters.dug).toBe(2);
    expect(s.progress.counters.dug).toBeUndefined();
  });
});

describe("tiles", () => {
  it("setTile pose et retire sans modifier l'original", () => {
    const s = createStarterSave();
    const a = setTile(s, "2,2", { kind: "hole", dugAt: 1 });
    expect(a.tiles["2,2"]).toEqual({ kind: "hole", dugAt: 1 });
    expect(s.tiles["2,2"]).toBeUndefined();
    const b = setTile(a, "2,2", undefined);
    expect("2,2" in b.tiles).toBe(false);
  });

  it("seuls plantes et décor se déplacent", () => {
    expect(isMovable({ kind: "decor", id: "paille" })).toBe(true);
    expect(
      isMovable({
        kind: "plant",
        seed: { species: "aster", color: "violet", rarity: "commune" },
        sownAt: 0,
        watered: [],
      }),
    ).toBe(true);
    expect(isMovable({ kind: "hole", dugAt: 0 })).toBe(false);
    expect(isMovable({ kind: "leaves", since: 0 })).toBe(false);
    expect(isMovable(undefined)).toBe(false);
  });
});

describe("leaves dans la sauvegarde", () => {
  it("la sauvegarde de départ démarre au créneau en cours", () => {
    const { checkedAt } = createStarterSave().leaves;
    expect(checkedAt % LEAF_SLOT_MS).toBe(0);
    expect(Date.now() - checkedAt).toBeLessThan(LEAF_SLOT_MS);
  });

  it("parseSave complète leaves s'il manque", () => {
    const raw = JSON.parse(JSON.stringify(createStarterSave()));
    delete raw.leaves;
    expect(parseSave(raw)!.leaves).toEqual({ checkedAt: 0 });
  });

  it("parseSave garde leaves s'il est valide", () => {
    const s = createStarterSave();
    expect(parseSave(JSON.parse(JSON.stringify(s)))!.leaves).toEqual(s.leaves);
  });
});
