import { describe, expect, it } from "vitest";
import { planAction, type Plan } from "./actions";
import type { RecipeId } from "./catalog/recipes";
import { growthOf } from "./growth";
import { planPotion, roseeArea } from "./potions";
import { createStarterSave } from "./starter";
import { HOUR } from "./time";
import type { GardenSave, Interval, PlantTile, Seed, TileKey } from "./types";

const noRain = (): Interval[] => [];
const NOW = new Date(2026, 9, 1, 12).getTime();

const plant = (seed: Seed, sownAt = NOW - HOUR): PlantTile => ({
  kind: "plant",
  seed,
  sownAt,
  watered: [],
});
const cosmos = plant({ species: "cosmos", color: "pink", rarity: "commune" });
const bloomed = plant({ species: "cosmos", color: "pink", rarity: "commune" }, NOW - 9 * HOUR);

function field(tiles: GardenSave["tiles"], potions: GardenSave["inventory"]["potions"]) {
  const s = createStarterSave();
  return { ...s, tiles, inventory: { ...s.inventory, potions } };
}

const plan = (s: GardenSave, key: TileKey, potion: RecipeId | null, rng = () => 0.99): Plan =>
  planPotion(s, key, potion, NOW, rng, noRain);

function run(p: Plan) {
  if (!p.ok) throw new Error(`refus : ${p.reason}`);
  return p.apply();
}

const reason = (p: Plan) => (p.ok ? "" : p.reason);

describe("refus communs", () => {
  it("demande de choisir une préparation, puis d'en avoir en stock", () => {
    const s = field({ "1,1": cosmos }, { croissance: 0 });
    expect(reason(plan(s, "1,1", null))).toBe("choisis une préparation dans le panneau");
    expect(reason(plan(s, "1,1", "croissance"))).toBe("il ne t'en reste plus");
  });

  it("refuse une case sans plante et une plante éclose", () => {
    const s = field({ "1,1": bloomed }, { croissance: 1 });
    expect(reason(plan(s, "2,2", "croissance"))).toBe("rien à faire pousser ici");
    expect(reason(plan(s, "1,1", "croissance"))).toBe("déjà éclose");
  });
});

describe("élixir de croissance", () => {
  it("fait gagner une étape, retire une dose et compte la préparation", () => {
    const out = run(plan(field({ "1,1": cosmos }, { croissance: 3 }), "1,1", "croissance"));
    const tile = out.save.tiles["1,1"] as PlantTile;
    expect(tile.boosts).toEqual([NOW]);
    expect(growthOf(tile, NOW, noRain).stage).toBe(1);
    expect(out.save.inventory.potions.croissance).toBe(2);
    expect(out.save.progress.counters.potionsUsed).toBe(1);
    expect(out.effects).toEqual([
      { kind: "burst", key: "1,1", particle: "sparkles" },
      { kind: "toast", text: "La plante a grandi d'une étape" },
    ]);
  });
});

describe("rosée du matin", () => {
  it("couvre le carré 3 x 3 sans sortir du champ", () => {
    expect(roseeArea(["p1"], "0,0")).toEqual(["0,0", "1,0", "0,1", "1,1"]);
    expect(roseeArea(["p1"], "4,2")).toHaveLength(9);
  });

  it("arrose chaque plante du carré", () => {
    const s = field({ "1,1": cosmos, "2,2": cosmos, "5,4": cosmos }, { rosee: 1 });
    const out = run(plan(s, "1,1", "rosee"));
    for (const key of ["1,1", "2,2"] as const)
      expect((out.save.tiles[key] as PlantTile).watered).toEqual([
        { start: NOW, end: NOW + 6 * HOUR },
      ]);
    expect((out.save.tiles["5,4"] as PlantTile).watered).toEqual([]);
    expect(out.save.progress.counters.watered).toBe(2);
    expect(out.save.inventory.potions.rosee).toBe(0);
    expect(out.effects).toEqual([
      { kind: "burst", key: "1,1", particle: "water" },
      { kind: "burst", key: "2,2", particle: "water" },
    ]);
  });

  it("refuse un carré sans plante", () => {
    const s = field({ "1,1": cosmos }, { rosee: 1 });
    expect(reason(plan(s, "6,4", "rosee"))).toBe("aucune plante autour");
  });
});

describe("élixir de clairvoyance", () => {
  it("révèle la plante une seule fois", () => {
    const out = run(plan(field({ "1,1": cosmos }, { clairvoyance: 2 }), "1,1", "clairvoyance"));
    expect((out.save.tiles["1,1"] as PlantTile).revealed).toBe(true);
    expect(out.effects[1]).toEqual({ kind: "toast", text: "Révélée : Cosmos rose" });
    expect(reason(plan(out.save, "1,1", "clairvoyance"))).toBe("déjà révélée");
  });
});

describe("teinture", () => {
  it("tire une autre couleur de même rareté et la révèle", () => {
    const sun = plant({ species: "tournesol", color: "yellow", rarity: "commune" });
    const out = run(plan(field({ "1,1": sun }, { teinture: 1 }), "1,1", "teinture", () => 0));
    const tile = out.save.tiles["1,1"] as PlantTile;
    expect(tile.seed).toEqual({ species: "tournesol", color: "orange", rarity: "commune" });
    expect(tile.revealed).toBe(true);
  });

  it("refuse une couleur seule de sa rareté", () => {
    const aster = plant({ species: "aster", color: "white", rarity: "epique" });
    expect(reason(plan(field({ "1,1": aster }, { teinture: 1 }), "1,1", "teinture"))).toBe(
      "aucune autre couleur de cette rareté",
    );
  });
});

describe("poudres", () => {
  it("donne la variante une fois sur deux, et la dose part dans tous les cas", () => {
    const s = field({ "1,1": cosmos }, { givre: 2 });
    const hit = run(plan(s, "1,1", "givre", () => 0.1));
    expect((hit.save.tiles["1,1"] as PlantTile).seed.variant).toBe("givree");
    const miss = run(plan(s, "1,1", "givre", () => 0.9));
    expect((miss.save.tiles["1,1"] as PlantTile).seed.variant).toBeUndefined();
    expect(miss.save.inventory.potions.givre).toBe(1);
  });

  it("remplace une variante déjà présente", () => {
    const gold = plant({ species: "cosmos", color: "pink", rarity: "commune", variant: "doree" });
    const out = run(plan(field({ "1,1": gold }, { lune: 1 }), "1,1", "lune", () => 0));
    expect((out.save.tiles["1,1"] as PlantTile).seed.variant).toBe("lumineuse");
  });
});

describe("outil Préparer", () => {
  it("planAction délègue aux préparations", () => {
    const s = field({ "1,1": cosmos }, { croissance: 1 });
    const p = planAction(s, { kind: "tile", key: "1,1" }, "preparer", NOW, {
      rain: noRain,
      potion: "croissance",
    });
    expect(p).toMatchObject({ ok: true, label: "Élixir de croissance" });
  });
});
