import { describe, expect, it } from "vitest";
import { LEAF_SLOT_MS } from "../core/leaves";
import { createStarterSave } from "../core/starter";
import { DAY, HOUR, startOfDay } from "../core/time";
import type { GardenSave, SachetType, Seed } from "../core/types";
import { gardenReducer, INITIAL_GARDEN, type GardenState } from "./gardenReducer";

const NOW = 10_000 * LEAF_SLOT_MS + HOUR;

function loaded(tiles: GardenSave["tiles"] = {}): GardenState {
  const save = { ...createStarterSave(), tiles, leaves: { checkedAt: NOW - HOUR } };
  return gardenReducer(INITIAL_GARDEN, { type: "load", save });
}

describe("gardenReducer", () => {
  it("ignore tout tant que rien n'est chargé", () => {
    expect(gardenReducer(INITIAL_GARDEN, { type: "tick", now: NOW })).toBe(INITIAL_GARDEN);
    expect(gardenReducer(INITIAL_GARDEN, { type: "move", from: "1,1", to: "2,2" })).toBe(
      INITIAL_GARDEN,
    );
  });

  it("set remplace la sauvegarde", () => {
    const state = loaded();
    const save = { ...state.save!, plots: [] };
    expect(gardenReducer(state, { type: "set", save }).save).toBe(save);
  });

  it("move applique un déplacement valide et ignore un refus", () => {
    const state = loaded({ "0,1": { kind: "decor", id: "paille" } });
    const moved = gardenReducer(state, { type: "move", from: "0,1", to: "8,0" });
    expect(moved.save!.tiles["8,0"]).toEqual({ kind: "decor", id: "paille" });
    expect(gardenReducer(state, { type: "move", from: "0,1", to: "9,0" })).toBe(state);
  });

  it("tick inscrit les découvertes et incrémente seq", () => {
    const state = loaded({
      "1,1": {
        kind: "plant",
        seed: { species: "cosmos", color: "pink", rarity: "commune" },
        sownAt: NOW - 9 * HOUR,
        watered: [],
      },
    });
    const next = gardenReducer(state, { type: "tick", now: NOW });
    expect(next.discoveries).toEqual({
      seq: 1,
      found: [{ species: "cosmos", color: "pink", rarity: "commune" }],
    });
    expect(next.save!.herbier["cosmos:pink"]).toBeDefined();
    const again = gardenReducer(next, { type: "tick", now: NOW });
    expect(again).toBe(next);
  });

  it("tick fait tomber les feuilles sans toucher aux découvertes", () => {
    const state = loaded();
    const next = gardenReducer(state, { type: "tick", now: NOW + LEAF_SLOT_MS });
    expect(Object.values(next.save!.tiles).some((t) => t?.kind === "leaves")).toBe(true);
    expect(next.discoveries).toBe(state.discoveries);
  });
});

describe("press", () => {
  const flower = { species: "cosmos", color: "pink", rarity: "commune" } as const;
  const withFlower = () => {
    const s = createStarterSave();
    return gardenReducer(INITIAL_GARDEN, {
      type: "load",
      save: { ...s, inventory: { ...s.inventory, basket: [flower] } },
    });
  };

  it("presse la fleur et signale la graine", () => {
    const next = gardenReducer(withFlower(), { type: "press", index: 0, now: 5, rng: () => 0 });
    expect(next.save!.inventory.basket).toHaveLength(0);
    expect(next.pressed).toEqual({ seq: 1, seed: true });
  });

  it("index invalide : état inchangé", () => {
    const state = withFlower();
    expect(gardenReducer(state, { type: "press", index: 4, now: 5, rng: () => 0 })).toBe(state);
  });
});

describe("sachets", () => {
  const withSachets = (lastDailyAt: number, pending: SachetType[]): GardenState =>
    gardenReducer(INITIAL_GARDEN, {
      type: "load",
      save: { ...createStarterSave(), sachets: { lastDailyAt, pending } },
    });

  it("ouvre un sachet, range les graines et avance le compteur de lot", () => {
    const state = withSachets(startOfDay(NOW), ["quotidien"]);
    const next = gardenReducer(state, { type: "open-sachet", now: NOW, rng: () => 0.5 });
    expect(next.opened.seq).toBe(1);
    expect(next.opened.seeds).toHaveLength(3);
    expect(next.save!.sachets.pending).toEqual([]);
    expect(next.save!.inventory.seeds).toHaveLength(6);
  });

  it("sans sachet en attente, l'état ne bouge pas", () => {
    const state = withSachets(startOfDay(NOW), []);
    expect(gardenReducer(state, { type: "open-sachet", now: NOW, rng: () => 0.5 })).toBe(state);
  });

  it("renseigne le type du sachet ouvert", () => {
    const state = withSachets(startOfDay(NOW), ["dore", "quotidien"]);
    const next = gardenReducer(state, { type: "open-sachet", now: NOW, rng: () => 0.5 });
    expect(next.opened.type).toBe("dore");
  });

  it("dev-reveal range les graines imposées et les présente comme un sachet doré", () => {
    const state = withSachets(startOfDay(NOW), []);
    const seeds: Seed[] = [{ species: "cosmos", color: "black", rarity: "legendaire" }];
    const next = gardenReducer(state, { type: "dev-reveal", seeds });
    expect(next.opened).toEqual({ seq: 1, seeds, type: "dore" });
    expect(next.save!.inventory.seeds.slice(-1)).toEqual(seeds);
    expect(next.save!.sachets.pending).toEqual([]);
  });

  it("le tick crédite le sachet du jour", () => {
    const state = withSachets(startOfDay(NOW) - 2 * DAY, []);
    const next = gardenReducer(state, { type: "tick", now: NOW });
    expect(next.save!.sachets.pending).toHaveLength(2);
  });
});

describe("progression", () => {
  const withProgress = (save: GardenSave): GardenState =>
    gardenReducer(INITIAL_GARDEN, { type: "load", save });

  it("claim applique la récompense et marque le nœud", () => {
    const base = createStarterSave();
    const state = withProgress({
      ...base,
      progress: { ...base.progress, counters: { sown: 1 } },
    });
    const next = gardenReducer(state, { type: "claim", id: "root", now: NOW, rng: () => 0.5 });
    expect(next.save!.inventory.seeds).toHaveLength(6);
    expect(next.save!.progress.nodes.root).toBe(NOW);
    expect(next.claimed.seq).toBe(1);
    expect(next.claimed.id).toBe("root");
  });

  it("claim sur un nœud qui n'est pas prêt ne change rien", () => {
    const state = withProgress(createStarterSave());
    expect(gardenReducer(state, { type: "claim", id: "root", now: NOW, rng: () => 0.5 })).toBe(
      state,
    );
  });

  it("deposit retire la fleur du panier", () => {
    const base = createStarterSave();
    const state = withProgress({
      ...base,
      progress: { ...base.progress, nodes: { root: 1, d1: 1, d2: 1 } },
      inventory: {
        ...base.inventory,
        basket: [{ species: "dahlia", color: "red", rarity: "commune" }],
      },
    });
    const next = gardenReducer(state, { type: "deposit", id: "d4", species: "dahlia" });
    expect(next.save!.inventory.basket).toEqual([]);
    expect(next.save!.progress.baskets.d4).toEqual({ dahlia: 1 });
  });

  it("le tick crédite deux sachets par jour après Main verte", () => {
    const base = createStarterSave();
    const state = withProgress({
      ...base,
      progress: { ...base.progress, nodes: { j1: 1 } },
      sachets: { lastDailyAt: startOfDay(NOW) - DAY, pending: [] },
    });
    expect(gardenReducer(state, { type: "tick", now: NOW }).save!.sachets.pending).toHaveLength(2);
  });
});

describe("atelier", () => {
  const c = { species: "cosmos", color: "pink", rarity: "commune" } as const;
  const withAtelier = (): GardenState => {
    const s = createStarterSave();
    return gardenReducer(INITIAL_GARDEN, {
      type: "load",
      save: {
        ...s,
        inventory: { ...s.inventory, basket: [c, c, c] },
        progress: { ...s.progress, nodes: { a1: 1 } },
      },
    });
  };

  it("brasse puis récupère les doses une fois le temps écoulé", () => {
    const brewing = gardenReducer(withAtelier(), { type: "brew", recipe: "croissance", now: NOW });
    expect(brewing.save!.atelier.brew).toEqual({ recipe: "croissance", startedAt: NOW });
    expect(gardenReducer(brewing, { type: "collect-brew", now: NOW + HOUR })).toBe(brewing);
    const done = gardenReducer(brewing, { type: "collect-brew", now: NOW + 2 * HOUR });
    expect(done.save!.inventory.potions.croissance).toBe(3);
    expect(done.save!.atelier.brew).toBeNull();
  });

  it("ignore une recette verrouillée", () => {
    const state = withAtelier();
    expect(gardenReducer(state, { type: "brew", recipe: "lune", now: NOW })).toBe(state);
  });
});
