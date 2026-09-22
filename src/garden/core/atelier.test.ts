import { describe, expect, it } from "vitest";
import { brewStatus, collectBrew, missingFor, pickIngredients, startBrew } from "./atelier";
import { createStarterSave } from "./starter";
import { HOUR } from "./time";
import type { Flower, GardenSave, Rarity } from "./types";

const NOW = 1_700_000_000_000;

const f = (rarity: Rarity, variant?: Flower["variant"]): Flower => ({
  species: "cosmos",
  color: "pink",
  rarity,
  ...(variant && { variant }),
});

function atelier(basket: Flower[], nodes: string[] = ["a1"]): GardenSave {
  const s = createStarterSave();
  return {
    ...s,
    inventory: { ...s.inventory, basket },
    progress: { ...s.progress, nodes: Object.fromEntries(nodes.map((id) => [id, 1])) },
  };
}

describe("pickIngredients", () => {
  it("prend les plus anciennes fleurs, celles à variante en dernier", () => {
    const basket = [f("commune", "givree"), f("commune"), f("rare"), f("commune"), f("commune")];
    expect(pickIngredients(basket, { commune: 3 })).toEqual([1, 3, 4]);
    expect(pickIngredients(basket, { commune: 4 })).toEqual([1, 3, 4, 0]);
  });

  it("renvoie null s'il manque des fleurs", () => {
    expect(pickIngredients([f("commune")], { commune: 1, rare: 1 })).toBeNull();
  });
});

describe("missingFor", () => {
  it("compte ce qui manque par rareté", () => {
    expect(missingFor(atelier([f("commune")]), "teinture")).toEqual({ commune: 1, rare: 1 });
    expect(missingFor(atelier([f("commune"), f("commune"), f("rare")]), "teinture")).toEqual({});
  });
});

describe("startBrew", () => {
  const three = [f("commune"), f("rare"), f("commune"), f("commune")];

  it("retire les ingrédients du panier et lance le chaudron", () => {
    const next = startBrew(atelier(three), "croissance", NOW)!;
    expect(next.inventory.basket).toEqual([f("rare")]);
    expect(next.atelier.brew).toEqual({ recipe: "croissance", startedAt: NOW });
  });

  it("refuse une recette verrouillée, un panier trop maigre ou un chaudron occupé", () => {
    expect(startBrew(atelier(three, []), "croissance", NOW)).toBeNull();
    expect(startBrew(atelier([f("commune")]), "croissance", NOW)).toBeNull();
    const busy = startBrew(atelier([...three, ...three]), "croissance", NOW)!;
    expect(startBrew(busy, "rosee", NOW)).toBeNull();
  });
});

describe("brewStatus et collectBrew", () => {
  const brewing = () =>
    startBrew(atelier([f("commune"), f("commune"), f("commune")]), "croissance", NOW)!;

  it("indique le temps restant puis la fin du brassage", () => {
    expect(brewStatus(atelier([]), NOW)).toBeNull();
    expect(brewStatus(brewing(), NOW + HOUR)).toEqual({
      recipe: "croissance",
      remaining: HOUR,
      ready: false,
    });
    expect(brewStatus(brewing(), NOW + 3 * HOUR)).toMatchObject({ remaining: 0, ready: true });
  });

  it("ne récupère qu'un brassage prêt", () => {
    expect(collectBrew(atelier([]), NOW)).toBeNull();
    expect(collectBrew(brewing(), NOW + HOUR)).toBeNull();
  });

  it("ajoute les doses au stock, vide le chaudron et compte le brassage", () => {
    const s = brewing();
    const stocked = { ...s, inventory: { ...s.inventory, potions: { croissance: 1 } } };
    const next = collectBrew(stocked, NOW + 2 * HOUR)!;
    expect(next.inventory.potions.croissance).toBe(4);
    expect(next.atelier.brew).toBeNull();
    expect(next.progress.counters.brewed).toBe(1);
  });
});
