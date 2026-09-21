import { describe, expect, it } from "vitest";
import { harvestTool, SPECIES } from "./catalog/species";
import { bump } from "./counters";
import { LEAF_SLOT_MS } from "./leaves";
import { parseSave } from "./save";
import { createStarterSave } from "./starter";
import { isMovable, setTile } from "./tiles";

describe("harvestTool", () => {
  it("sécateur pour les tiges épaisses, main sinon", () => {
    const cut = SPECIES.filter((s) => harvestTool(s.id) === "secateur").map((s) => s.id);
    expect(cut.sort()).toEqual([
      "amarante",
      "chrysantheme",
      "dahlia",
      "heliopsis",
      "rosetremiere",
      "sedum",
      "tournesol",
    ]);
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
