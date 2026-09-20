import { describe, expect, it } from "vitest";
import { CATALOG_ENTRIES, entriesOfRarity } from "./catalog/species";
import { entryId } from "./discovery";
import {
  pickSeedChance,
  pressSeedChance,
  RARITY_WEIGHT,
  rollPickSeed,
  rollPressSeed,
  rollSachetSeed,
  rollVariant,
  VARIANT_CHANCE,
} from "./rolls";
import type { Flower } from "./types";

const flower: Flower = { species: "dahlia", color: "red", rarity: "rare", variant: "doree" };

describe("rollPickSeed", () => {
  it("30 % sans belle plante, 45 % avec", () => {
    expect(pickSeedChance(false)).toBe(0.3);
    expect(pickSeedChance(true)).toBe(0.45);
    expect(rollPickSeed(flower, false, () => 0.29)).not.toBeNull();
    expect(rollPickSeed(flower, false, () => 0.3)).toBeNull();
    expect(rollPickSeed(flower, true, () => 0.44)).not.toBeNull();
    expect(rollPickSeed(flower, true, () => 0.45)).toBeNull();
  });

  it("la graine reprend espèce, couleur et rareté, sans variante", () => {
    expect(rollPickSeed(flower, false, () => 0)).toEqual({
      species: "dahlia",
      color: "red",
      rarity: "rare",
    });
  });
});

const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("rollPressSeed", () => {
  const cosmos: Flower = { species: "cosmos", color: "pink", rarity: "commune" };

  it("35 % de chance", () => {
    expect(pressSeedChance).toBe(0.35);
    expect(rollPressSeed(cosmos, seq(0.34, 0))).not.toBeNull();
    expect(rollPressSeed(cosmos, seq(0.35, 0))).toBeNull();
  });

  it("pondère les autres couleurs par rareté, jamais la couleur pressée", () => {
    // autres couleurs du cosmos : white C 60, red R 25, orange R 25, yellow E 12, black L 3 = 125
    expect(RARITY_WEIGHT).toEqual({ commune: 60, rare: 25, epique: 12, legendaire: 3 });
    expect(rollPressSeed(cosmos, seq(0, 0))).toEqual({
      species: "cosmos",
      color: "white",
      rarity: "commune",
    });
    expect(rollPressSeed(cosmos, seq(0, 60 / 125))).toEqual({
      species: "cosmos",
      color: "red",
      rarity: "rare",
    });
    expect(rollPressSeed(cosmos, seq(0, 0.999))).toEqual({
      species: "cosmos",
      color: "black",
      rarity: "legendaire",
    });
    for (let r = 0; r < 1; r += 0.01)
      expect(rollPressSeed(cosmos, seq(0, r))!.color).not.toBe("pink");
  });

  it("espèce à trois couleurs : toujours une des deux autres", () => {
    const v: Flower = { species: "lanternelune", color: "blue", rarity: "legendaire" };
    const colors = new Set([0, 0.3, 0.6, 0.99].map((r) => rollPressSeed(v, seq(0, r))!.color));
    expect([...colors].sort()).toEqual(["violet", "white"]);
  });
});

describe("rollSachetSeed", () => {
  const none = new Set<string>();
  const pity = { dryDiscovery: 0, dryRare: 0 };
  // Ordre des tirages : rareté, poids (seulement si rare ou mieux), nouveauté,
  // poids de promotion (seulement si promotion), index, variante.
  // `seq` boucle sur ses valeurs : une séquence trop longue ou trop courte passe inaperçue.
  const noVariant = 0.99;

  it("sous 25 % la graine est commune, au-dessus elle est rare ou mieux", () => {
    expect(rollSachetSeed(none, pity, seq(0.24, 0, 0, 0, noVariant)).rarity).toBe("rare");
    expect(rollSachetSeed(none, pity, seq(0.25, 0, 0, noVariant)).rarity).toBe("commune");
  });

  it("répartit rare, épique et légendaire selon les poids du catalogue", () => {
    const at = (weight: number) =>
      rollSachetSeed(none, pity, seq(0, weight, 0, 0, noVariant)).rarity;
    expect(at(0)).toBe("rare");
    expect(at(25 / 40 + 0.01)).toBe("epique");
    expect(at(0.99)).toBe("legendaire");
  });

  it("suit la jauge de rareté quand elle est montée", () => {
    const hot = { dryDiscovery: 0, dryRare: 10 }; // 45 %
    expect(rollSachetSeed(none, hot, seq(0.44, 0, 0, 0, noVariant)).rarity).toBe("rare");
    expect(rollSachetSeed(none, hot, seq(0.45, 0, 0, noVariant)).rarity).toBe("commune");
  });

  it("pioche une inconnue quand le jet de nouveauté réussit", () => {
    const known = new Set(
      entriesOfRarity("commune")
        .slice(1)
        .map((e) => entryId(e.species, e.color)),
    );
    const first = entriesOfRarity("commune")[0];
    const seed = rollSachetSeed(known, pity, seq(0.99, 0.24, 0, noVariant));
    expect(entryId(seed.species, seed.color)).toBe(entryId(first.species, first.color));
  });

  it("pioche une connue quand le jet de nouveauté échoue", () => {
    const first = entriesOfRarity("commune")[0];
    const known = new Set([entryId(first.species, first.color)]);
    const seed = rollSachetSeed(known, pity, seq(0.99, 0.99, 0, noVariant));
    expect(entryId(seed.species, seed.color)).toBe(entryId(first.species, first.color));
  });

  it("début de partie : jet manqué mais aucune connue, la graine est quand même une nouveauté", () => {
    const seed = rollSachetSeed(none, pity, seq(0.99, 0.99, 0, noVariant));
    expect(seed.rarity).toBe("commune");
    expect(
      entriesOfRarity("commune").some((e) => e.species === seed.species && e.color === seed.color),
    ).toBe(true);
  });

  it("promeut la graine quand la rareté tirée n'a plus d'inconnue", () => {
    const known = new Set(entriesOfRarity("commune").map((e) => entryId(e.species, e.color)));
    const seed = rollSachetSeed(known, pity, seq(0.99, 0, 0, 0, noVariant));
    expect(seed.rarity).not.toBe("commune");
  });

  it("Herbier complet : la graine reste dans sa rareté", () => {
    const all = new Set(CATALOG_ENTRIES.map((e) => entryId(e.species, e.color)));
    const seed = rollSachetSeed(all, pity, seq(0.99, 0, 0, noVariant));
    expect(seed.rarity).toBe("commune");
  });
});

describe("rollVariant", () => {
  it("2 % de chance, les trois variantes à parts égales", () => {
    expect(VARIANT_CHANCE).toBe(0.02);
    expect(rollVariant(seq(0.02))).toBeUndefined();
    expect(rollVariant(seq(0.019, 0))).toBe("givree");
    expect(rollVariant(seq(0, 0.4))).toBe("doree");
    expect(rollVariant(seq(0, 0.9))).toBe("lumineuse");
  });
});
