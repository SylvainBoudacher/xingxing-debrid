import { describe, expect, it } from "vitest";
import { planAction, type Plan, type Target, type Tool } from "./actions";
import { WATER_MS } from "./growth";
import { createStarterSave } from "./starter";
import { HOUR } from "./time";
import type { DecorId, GardenSave, Interval, PlantTile, Rarity, Seed, SpeciesId } from "./types";

const noRain = (): Interval[] => [];
const NOW = new Date(2026, 9, 1, 12).getTime();
const tile = (key: `${number},${number}`): Target => ({ kind: "tile", key });

function withTiles(tiles: GardenSave["tiles"]): GardenSave {
  return { ...createStarterSave(), tiles };
}

const flower = (species: SpeciesId, watered: Interval[] = []): PlantTile => ({
  kind: "plant",
  seed: { species, color: "pink", rarity: "commune" },
  sownAt: NOW - 9 * HOUR,
  watered,
});

const young: PlantTile = { ...flower("cosmos"), sownAt: NOW - HOUR };

function plan(
  s: GardenSave,
  target: Target,
  tool: Tool,
  opts: { rng?: () => number; seedRarity?: Rarity | null; decor?: DecorId | null } = {},
): Plan | null {
  return planAction(s, target, tool, NOW, { rng: () => 0.99, rain: noRain, ...opts });
}

function refused(p: Plan | null) {
  expect(p?.ok).toBe(false);
  return p && !p.ok ? p.reason : "";
}

function run(p: Plan | null) {
  if (!p?.ok) throw new Error("action refusée");
  return p.apply();
}

describe("creuser", () => {
  it("creuse un trou dans la terre libre", () => {
    const out = run(plan(withTiles({}), tile("1,1"), "creuser"));
    expect(out.save.tiles["1,1"]).toEqual({ kind: "hole", dugAt: NOW });
    expect(out.save.progress.counters.dug).toBe(1);
    expect(out.effects).toEqual([{ kind: "burst", key: "1,1", particle: "dirt" }]);
  });

  it("refuse l'herbe et les cases occupées", () => {
    const s = withTiles({ "1,1": { kind: "leaves", since: 0 } });
    expect(refused(plan(s, tile("0,0"), "creuser"))).toBe("seulement dans la terre");
    expect(refused(plan(s, tile("1,1"), "creuser"))).toBe("la case est occupée");
  });
});

describe("semer", () => {
  it("sème la plus ancienne graine dans un trou", () => {
    const s = withTiles({ "1,1": { kind: "hole", dugAt: NOW } });
    const [first, ...rest] = s.inventory.seeds;
    const out = run(plan(s, tile("1,1"), "semer"));
    expect(out.save.tiles["1,1"]).toEqual({ kind: "plant", seed: first, sownAt: NOW, watered: [] });
    expect(out.save.inventory.seeds).toEqual(rest);
    expect(out.save.progress.counters.sown).toBe(1);
  });

  it("explique pourquoi il ne peut pas semer", () => {
    const s = withTiles({ "2,2": { kind: "hole", dugAt: NOW } });
    expect(refused(plan(s, tile("1,1"), "semer"))).toBe("creuse d'abord un trou");
    expect(refused(plan(s, tile("0,0"), "semer"))).toBe("il faut un trou");
    const empty = { ...s, inventory: { ...s.inventory, seeds: [] } };
    expect(refused(plan(empty, tile("2,2"), "semer"))).toBe("plus de graines");
  });
});

describe("arroser", () => {
  it("mouille la plante 6 h", () => {
    const s = withTiles({ "1,1": young });
    const out = run(plan(s, tile("1,1"), "arroser"));
    const p = out.save.tiles["1,1"] as PlantTile;
    expect(p.watered).toEqual([{ start: NOW, end: NOW + WATER_MS }]);
    expect(out.save.progress.counters.watered).toBe(1);
    expect(out.effects).toEqual([{ kind: "burst", key: "1,1", particle: "water" }]);
  });

  it("prolonge un arrosage en cours", () => {
    const s = withTiles({ "1,1": { ...young, watered: [{ start: NOW - HOUR, end: NOW + HOUR }] } });
    const p = run(plan(s, tile("1,1"), "arroser")).save.tiles["1,1"] as PlantTile;
    expect(p.watered).toEqual([{ start: NOW - HOUR, end: NOW + WATER_MS }]);
  });

  it("refuse tout ce qui n'est pas une plante", () => {
    const s = withTiles({ "2,2": { kind: "hole", dugAt: NOW } });
    expect(refused(plan(s, tile("1,1"), "arroser"))).toBe("rien à arroser, sème d'abord");
    expect(refused(plan(s, tile("2,2"), "arroser"))).toBe("rien à arroser, sème d'abord");
  });
});

describe("cueillir", () => {
  it("à la main : la fleur va au panier, la case se libère", () => {
    const s = withTiles({ "1,1": flower("cosmos") });
    const out = run(plan(s, tile("1,1"), "main"));
    expect(out.save.tiles["1,1"]).toBeUndefined();
    expect(out.save.inventory.basket).toEqual([
      { species: "cosmos", color: "pink", rarity: "commune" },
    ]);
    expect(out.save.inventory.seeds).toEqual(s.inventory.seeds);
    expect(out.save.progress.counters.picked).toBe(1);
    expect(out.effects).toEqual([
      { kind: "burst", key: "1,1", particle: "petals" },
      { kind: "toast", text: "Cosmos rose cueilli" },
    ]);
  });

  it("donne parfois une graine de la même fleur", () => {
    const s = withTiles({ "1,1": flower("cosmos") });
    const out = run(plan(s, tile("1,1"), "main", { rng: () => 0.1 }));
    expect(out.save.inventory.seeds[out.save.inventory.seeds.length - 1]).toEqual({
      species: "cosmos",
      color: "pink",
      rarity: "commune",
    });
    expect(out.effects[1]).toEqual({ kind: "toast", text: "Cosmos rose cueilli : +1 graine" });
  });

  it("une belle plante a 45 % de chance", () => {
    const wetAll = [{ start: NOW - 10 * HOUR, end: NOW }];
    const beautiful = withTiles({ "1,1": flower("cosmos", wetAll) });
    const dry = withTiles({ "1,1": flower("cosmos") });
    const rng = () => 0.4;
    expect(run(plan(beautiful, tile("1,1"), "main", { rng })).save.inventory.seeds).toHaveLength(4);
    expect(run(plan(dry, tile("1,1"), "main", { rng })).save.inventory.seeds).toHaveLength(3);
  });

  it("compte à part la cueillette d'une belle plante", () => {
    const wetAll = [{ start: NOW - 10 * HOUR, end: NOW }];
    const beautiful = run(
      plan(withTiles({ "1,1": flower("cosmos", wetAll) }), tile("1,1"), "main"),
    );
    expect(beautiful.save.progress.counters.pickedBeautiful).toBe(1);
    const dry = run(plan(withTiles({ "1,1": flower("cosmos") }), tile("1,1"), "main"));
    expect(dry.save.progress.counters.pickedBeautiful).toBeUndefined();
  });

  it("au sécateur pour les tiges épaisses", () => {
    const s = withTiles({ "1,1": flower("dahlia") });
    const p = plan(s, tile("1,1"), "secateur");
    expect(p).toMatchObject({ ok: true, label: "Couper au sécateur" });
    expect(run(p).save.inventory.basket).toHaveLength(1);
  });

  it("le mauvais outil donne la raison", () => {
    const s = withTiles({ "1,1": flower("dahlia"), "2,1": flower("cosmos") });
    expect(refused(plan(s, tile("1,1"), "main"))).toBe("tige trop épaisse, prends le sécateur");
    expect(refused(plan(s, tile("2,1"), "secateur"))).toBe("tige fragile, cueille-la à la main");
  });

  it("rien à cueillir sur une plante non éclose", () => {
    const s = withTiles({ "1,1": young });
    expect(plan(s, tile("1,1"), "main")).toBeNull();
    expect(refused(plan(s, tile("1,1"), "secateur"))).toBe("rien à couper ici");
  });
});

describe("râteau", () => {
  it("ramasse un tas de feuilles", () => {
    const s = withTiles({ "0,0": { kind: "leaves", since: 0 } });
    const out = run(plan(s, tile("0,0"), "rateau"));
    expect(out.save.tiles["0,0"]).toBeUndefined();
    expect(out.save.progress.counters.raked).toBe(1);
    expect(out.effects).toEqual([{ kind: "burst", key: "0,0", particle: "leaves" }]);
  });

  it("refuse hors des feuilles, et la main renvoie au râteau", () => {
    const s = withTiles({ "0,0": { kind: "leaves", since: 0 } });
    expect(refused(plan(s, tile("1,1"), "rateau"))).toBe("pas de feuilles ici");
    expect(refused(plan(s, tile("0,0"), "main"))).toBe("prends le râteau");
    expect(refused(plan(s, tile("0,0"), "secateur"))).toBe("rien à couper ici");
  });
});

describe("corbeau et limites", () => {
  it.each(["main", "creuser", "semer", "arroser", "secateur", "rateau"] as Tool[])(
    "%s chasse le corbeau",
    (tool) => {
      const out = run(plan(withTiles({}), { kind: "crow", id: "c1" }, tool));
      expect(out.save.progress.counters.crowsChased).toBe(1);
      expect(out.effects).toEqual([{ kind: "chase", id: "c1" }]);
    },
  );

  it("aucune action hors de la grille ni sur une case vide", () => {
    const s = withTiles({ "0,1": { kind: "decor", id: "lanterne" } });
    expect(plan(s, tile("12,0"), "creuser")).toBeNull();
    expect(plan(s, tile("0,0"), "main")).toBeNull();
  });

  it("un refus ne touche pas la sauvegarde", () => {
    const s = withTiles({});
    const copy = structuredClone(s);
    plan(s, tile("0,0"), "creuser");
    expect(s).toEqual(copy);
  });
});

describe("semer une rareté choisie", () => {
  const seeds: Seed[] = [
    { species: "tournesol", color: "yellow", rarity: "commune" },
    { species: "dahlia", color: "blue", rarity: "legendaire" },
    { species: "cosmos", color: "pink", rarity: "commune" },
  ];
  const withHole = (): GardenSave => {
    const base = createStarterSave();
    return {
      ...base,
      inventory: { ...base.inventory, seeds },
      tiles: { ...base.tiles, "1,1": { kind: "hole", dugAt: NOW - 1000 } },
    };
  };
  const sown = (save: GardenSave) => {
    const t = save.tiles["1,1"];
    return t?.kind === "plant" ? t.seed : null;
  };

  it("sème la plus ancienne graine de la rareté demandée", () => {
    const out = run(plan(withHole(), tile("1,1"), "semer", { seedRarity: "legendaire" }));
    expect(sown(out.save)?.rarity).toBe("legendaire");
    expect(out.save.inventory.seeds.map((s) => s.species)).toEqual(["tournesol", "cosmos"]);
  });

  it("sans rareté demandée, sème la plus ancienne", () => {
    const out = run(plan(withHole(), tile("1,1"), "semer"));
    expect(sown(out.save)?.species).toBe("tournesol");
  });

  it("rareté demandée absente : retombe sur la plus ancienne", () => {
    const out = run(plan(withHole(), tile("1,1"), "semer", { seedRarity: "epique" }));
    expect(sown(out.save)?.species).toBe("tournesol");
  });

  it("inventaire vide : refus", () => {
    const base = withHole();
    const empty = { ...base, inventory: { ...base.inventory, seeds: [] } };
    expect(refused(plan(empty, tile("1,1"), "semer"))).toBe("plus de graines");
  });
});

describe("décor", () => {
  const withDecor = (
    decor: Partial<Record<DecorId, number>>,
    tiles: GardenSave["tiles"] = {},
  ): GardenSave => {
    const s = withTiles(tiles);
    return { ...s, inventory: { ...s.inventory, decor } };
  };

  it("pose le décor choisi sur une case libre hors de la terre", () => {
    const s = withDecor({ citrouille: 2 });
    const out = run(plan(s, tile("4,0"), "decor", { decor: "citrouille" }));
    expect(out.save.tiles["4,0"]).toEqual({ kind: "decor", id: "citrouille" });
    expect(out.save.inventory.decor.citrouille).toBe(1);
  });

  it("refuse sans sélection, sur une case occupée ou sur la terre", () => {
    const s = withDecor({ citrouille: 1 }, { "4,0": { kind: "leaves", since: 0 } });
    expect(refused(plan(s, tile("3,0"), "decor"))).toBe("choisis un décor dans le panneau");
    expect(refused(plan(s, tile("4,0"), "decor", { decor: "citrouille" }))).toBe(
      "il y a déjà quelque chose ici",
    );
    expect(refused(plan(s, tile("1,1"), "decor", { decor: "citrouille" }))).toBe(
      "pas sur la terre d'une parcelle",
    );
  });

  it("refuse un décor qu'on ne possède plus", () => {
    expect(
      refused(plan(withDecor({ citrouille: 0 }), tile("4,0"), "decor", { decor: "citrouille" })),
    ).toBe("il ne t'en reste plus");
  });

  it("ne plante un arbre qu'en bordure du champ", () => {
    const s = withDecor({ arbre: 2 });
    expect(refused(plan(s, tile("7,2"), "decor", { decor: "arbre" }))).toBe(
      "un arbre ne se plante qu'en bordure du champ",
    );
    expect(plan(s, tile("4,0"), "decor", { decor: "arbre" })?.ok).toBe(true);
    expect(plan(s, tile("0,2"), "decor", { decor: "arbre" })?.ok).toBe(true);
  });

  it("la main range un décor posé dans l'inventaire", () => {
    const s = withDecor({}, { "4,0": { kind: "decor", id: "lanterne" } });
    const p = plan(s, tile("4,0"), "main");
    expect(p).toMatchObject({ ok: true, label: "Ranger la lanterne" });
    const out = run(p);
    expect(out.save.tiles["4,0"]).toBeUndefined();
    expect(out.save.inventory.decor.lanterne).toBe(1);
  });
});
