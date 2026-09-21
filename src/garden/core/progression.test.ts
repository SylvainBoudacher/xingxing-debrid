import { describe, expect, it } from "vitest";
import { nodeById } from "./catalog/tree";
import { entryId } from "./discovery";
import { claim, deposit, openNodes, progressOf, readyCount, stateOf } from "./progression";
import { createStarterSave } from "./starter";
import type { CounterId } from "./counters";
import type { Flower, GardenSave, HerbierEntry, SpeciesId } from "./types";

const NOW = 1_700_000_000_000;
const node = (id: string) => nodeById(id)!;
const base = (): GardenSave => createStarterSave();

const withCounter = (s: GardenSave, id: CounterId, n: number): GardenSave => ({
  ...s,
  progress: { ...s.progress, counters: { ...s.progress.counters, [id]: n } },
});

const withNodes = (s: GardenSave, ...ids: string[]): GardenSave => ({
  ...s,
  progress: {
    ...s.progress,
    nodes: { ...s.progress.nodes, ...Object.fromEntries(ids.map((id) => [id, 1])) },
  },
});

const entry = (variants: HerbierEntry["variants"] = []): HerbierEntry => ({
  discoveredAt: 1,
  pressed: 0,
  variants,
});

const withHerbier = (s: GardenSave, ids: string[]): GardenSave => ({
  ...s,
  herbier: Object.fromEntries(ids.map((id) => [id, entry()])),
});

const flower = (species: string): Flower =>
  ({ species, color: "pink", rarity: "commune" }) as Flower;

describe("stateOf", () => {
  it("ouvre la racine et verrouille ses enfants", () => {
    expect(stateOf(base(), node("root"))).toBe("ouvert");
    expect(stateOf(base(), node("j1"))).toBe("verrouille");
  });

  it("passe à prêt quand la tâche est remplie", () => {
    expect(stateOf(withCounter(base(), "sown", 1), node("root"))).toBe("pret");
  });

  it("termine un nœud récupéré et ouvre ses enfants", () => {
    const s = withNodes(base(), "root");
    expect(stateOf(s, node("root"))).toBe("termine");
    expect(stateOf(s, node("j1"))).toBe("ouvert");
    expect(stateOf(s, node("j2"))).toBe("verrouille");
  });
});

describe("progressOf", () => {
  it("lit un compteur", () => {
    expect(progressOf(withCounter(base(), "watered", 13), node("j2"))).toEqual({
      value: 13,
      target: 20,
    });
  });

  it("compte les entrées de l'Herbier", () => {
    const s = withHerbier(base(), ["tournesol:yellow", "aster:violet", "cosmos:pink"]);
    expect(progressOf(s, node("h1"))).toEqual({ value: 3, target: 5 });
  });

  it("compte les entrées rares ou mieux", () => {
    const s = withHerbier(base(), ["tournesol:yellow", "tournesol:bronze", "tournesol:white"]);
    expect(progressOf(s, node("h2"))).toEqual({ value: 2, target: 1 });
  });

  it("compte les familles de couleurs complètes", () => {
    const partial = withHerbier(base(), ["tournesol:yellow", "tournesol:orange"]);
    expect(progressOf(partial, node("h3")).value).toBe(0);
    const full = withHerbier(base(), [
      "tournesol:yellow",
      "tournesol:orange",
      "tournesol:bronze",
      "tournesol:burgundy",
      "tournesol:white",
    ]);
    expect(progressOf(full, node("h3")).value).toBe(1);
  });

  it("compte les variantes spéciales", () => {
    const s = base();
    const withVariant: GardenSave = {
      ...s,
      herbier: { [entryId("cosmos", "pink")]: entry(["givree"]) },
    };
    expect(progressOf(withVariant, node("h4"))).toEqual({ value: 1, target: 1 });
    expect(progressOf(withHerbier(s, ["cosmos:pink"]), node("h4")).value).toBe(0);
  });

  it("compte les fleurs déposées dans un panier", () => {
    const s = base();
    expect(progressOf(s, node("d4"))).toEqual({ value: 0, target: 5 });
    const deposited: GardenSave = {
      ...s,
      progress: { ...s.progress, baskets: { d4: { dahlia: 2, cosmos: 1 } } },
    };
    expect(progressOf(deposited, node("d4"))).toEqual({ value: 3, target: 5 });
  });
});

describe("claim", () => {
  const ready = (id: string, s: GardenSave): GardenSave => {
    const parents: string[] = [];
    let cur = node(id).parent;
    while (cur) {
      parents.push(cur);
      cur = node(cur).parent;
    }
    return withNodes(s, ...parents);
  };

  it("refuse un nœud qui n'est pas prêt", () => {
    expect(claim(base(), "root", NOW, () => 0.5)).toBeNull();
    expect(claim(withCounter(base(), "bloomed", 9), "j1", NOW, () => 0.5)).toBeNull();
  });

  it("donne des graines et marque le nœud", () => {
    const s = withCounter(base(), "sown", 1);
    const out = claim(s, "root", NOW, () => 0.5)!;
    expect(out.inventory.seeds).toHaveLength(s.inventory.seeds.length + 3);
    expect(out.inventory.seeds.slice(-3).every((seed) => seed.rarity === "commune")).toBe(true);
    expect(out.progress.nodes.root).toBe(NOW);
    expect(claim(out, "root", NOW, () => 0.5)).toBeNull();
  });

  it("ajoute un sachet spécial à la pile", () => {
    const s = ready("j2", withCounter(base(), "watered", 20));
    expect(claim(s, "j2", NOW, () => 0.5)!.sachets.pending).toEqual(["quotidien", "dore"]);
  });

  it("n'écrit rien de plus pour le deuxième sachet du jour", () => {
    const s = ready("j1", withCounter(base(), "bloomed", 5));
    const out = claim(s, "j1", NOW, () => 0.5)!;
    expect(out.sachets.pending).toEqual(s.sachets.pending);
    expect(out.progress.nodes.j1).toBe(NOW);
  });

  it("débloque une parcelle", () => {
    const s = ready(
      "c1",
      withHerbier(
        base(),
        Array.from({ length: 8 }, (_, i) => `x:${i}`),
      ),
    );
    expect(claim(s, "c1", NOW, () => 0.5)!.plots).toEqual(["p1", "p2"]);
  });

  it("range le décor dans l'inventaire", () => {
    const s = ready("d1", withCounter(base(), "picked", 10));
    expect(claim(s, "d1", NOW, () => 0.5)!.inventory.decor).toEqual({ cloture: 12 });
  });
});

describe("deposit", () => {
  const withBasket = (species: string[]): GardenSave => {
    const s = withNodes(base(), "root", "d1", "d2");
    return { ...s, inventory: { ...s.inventory, basket: species.map(flower) } };
  };

  it("dépose une fleur demandée et la retire du panier", () => {
    const out = deposit(withBasket(["dahlia", "dahlia"]), "d4", "dahlia")!;
    expect(out.progress.baskets.d4).toEqual({ dahlia: 1 });
    expect(out.inventory.basket).toHaveLength(1);
  });

  it("refuse une espèce absente du panier ou non demandée", () => {
    expect(deposit(withBasket(["aster"]), "d4", "dahlia")).toBeNull();
    expect(deposit(withBasket(["tournesol"]), "d4", "tournesol")).toBeNull();
  });

  it("refuse quand la case est déjà pleine", () => {
    const once = deposit(withBasket(["aster", "aster"]), "d4", "aster")!;
    expect(deposit(once, "d4", "aster")).toBeNull();
  });

  it("refuse tant que le nœud est verrouillé", () => {
    const s = base();
    const locked = { ...s, inventory: { ...s.inventory, basket: [flower("dahlia")] } };
    expect(deposit(locked, "d4", "dahlia")).toBeNull();
  });

  it("rend le nœud prêt quand toutes les cases sont pleines", () => {
    let s = withBasket(["dahlia", "dahlia", "cosmos", "cosmos", "aster"]);
    for (const species of ["dahlia", "dahlia", "cosmos", "cosmos", "aster"] as SpeciesId[])
      s = deposit(s, "d4", species)!;
    expect(stateOf(s, node("d4"))).toBe("pret");
    expect(s.inventory.basket).toEqual([]);
  });
});

describe("résumé", () => {
  it("compte les nœuds prêts et liste les objectifs en cours", () => {
    const s = withCounter(base(), "sown", 1);
    expect(readyCount(s)).toBe(1);
    expect(openNodes(s).map((n) => n.id)).toEqual(["root"]);
    const after = claim(s, "root", NOW, () => 0.5)!;
    expect(readyCount(after)).toBe(0);
    expect(
      openNodes(after)
        .map((n) => n.id)
        .sort(),
    ).toEqual(["c1", "d1", "h1", "j1"]);
  });
});
