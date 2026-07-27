import { describe, it, expect, vi, beforeEach } from "vitest";

// Same in-memory LazyStore mock as savedDucks.test.ts: the registry is keyed
// by filename, so ducks.json (collection) and duckdex.json (dex) coexist.
vi.mock("@tauri-apps/plugin-store", () => {
  const registry = new Map<string, Map<string, unknown>>();

  class LazyStore {
    private filename: string;

    constructor(filename: string) {
      this.filename = filename;
      if (!registry.has(filename)) registry.set(filename, new Map());
    }

    private get data(): Map<string, unknown> {
      return registry.get(this.filename)!;
    }

    async get<T>(key: string): Promise<T | null> {
      return (this.data.get(key) as T) ?? null;
    }

    async set(key: string, val: unknown): Promise<void> {
      this.data.set(key, val);
    }

    async save(): Promise<void> {}

    static clearAll(): void {
      registry.forEach((store) => store.clear());
    }
  }

  return { LazyStore };
});

import { LazyStore } from "@tauri-apps/plugin-store";
import type { Variant } from "@/components/duckTypes";
import { getRarity } from "@/components/duckRandom";
import { SPECIES, SPECIES_BY_ID } from "@/components/duckSpecies";
import { upsertSavedDuck } from "./savedDucks";
import {
  COLOR_SPECIES,
  completedFamilies,
  dexStatusOf,
  getDex,
  getShinyDex,
  isClaimed,
  isDexComplete,
  isShinyDexComplete,
  markClaimed,
  recordDiscovery,
  syncDexWithCollection,
} from "./duckDex";
import {
  CASINO_REWARDS,
  COLLECTION_REWARDS,
  COLOR_REWARDS,
  familyRewardAt,
  REWARDS,
  rewardProgress,
} from "./duckRewards";

const SHADES: Variant = { body: "#FFD21E", beak: "#F5811F", acc: "shades" };
const SHADES_PINK: Variant = { body: "#FB7AA8", beak: "#F5811F", acc: "shades" };
const WIZARD: Variant = { body: "#FFD21E", beak: "#F5811F", acc: "wizard", accColor: "#A78BFA" };
const VAMPIRE: Variant = {
  body: "#300010",
  beak: "#F5811F",
  acc: "cape",
  accColor: "#1A0008",
  effect: "glow",
};

beforeEach(async () => {
  (LazyStore as unknown as { clearAll: () => void }).clearAll();
  await getDex(); // refresh the module-level caches after the store reset
  await getShinyDex();
});

describe("getDex", () => {
  it("is empty initially", async () => {
    expect(await getDex()).toEqual({});
  });
});

describe("recordDiscovery", () => {
  it("flags a first save as a new species and persists it", async () => {
    const disc = await recordDiscovery(SHADES);
    expect(disc.newSpecies).toBe(true);
    expect(disc.newColor).toBe(false);
    expect(disc.species.id).toBe("shades");
    expect(disc.discoveredSpecies).toBe(1);
    expect(disc.totalSpecies).toBe(SPECIES.length);
    expect(disc.colorCount).toBe(1);
    expect(await getDex()).toEqual({ shades: ["#ffd21e"] });
  });

  it("flags nothing on an exact duplicate", async () => {
    await recordDiscovery(SHADES);
    const disc = await recordDiscovery(SHADES);
    expect(disc.newSpecies).toBe(false);
    expect(disc.newColor).toBe(false);
    expect(disc.colorCount).toBe(1);
  });

  it("flags a new body color on a known species", async () => {
    await recordDiscovery(SHADES);
    const disc = await recordDiscovery(SHADES_PINK);
    expect(disc.newSpecies).toBe(false);
    expect(disc.newColor).toBe(true);
    expect(disc.colorCount).toBe(2);
    expect(disc.discoveredSpecies).toBe(1);
  });

  it("counts distinct species independently", async () => {
    await recordDiscovery(SHADES);
    const disc = await recordDiscovery(WIZARD);
    expect(disc.newSpecies).toBe(true);
    expect(disc.discoveredSpecies).toBe(2);
  });

  it("records a new-generation species (vampire)", async () => {
    const disc = await recordDiscovery(VAMPIRE);
    expect(disc.newSpecies).toBe(true);
    expect(disc.species.id).toBe("vampire");
    expect(disc.species.name).toBe("Canard Vampire");
  });

  it("normalizes body color casing", async () => {
    await recordDiscovery(SHADES);
    const disc = await recordDiscovery({ ...SHADES, body: "#ffd21e" });
    expect(disc.newColor).toBe(false);
  });
});

describe("syncDexWithCollection", () => {
  it("retroactively discovers every saved duck", async () => {
    await upsertSavedDuck({ id: "a", name: "A", variant: SHADES, scale: 0.6, savedAt: 1 });
    await upsertSavedDuck({ id: "b", name: "B", variant: WIZARD, scale: 0.6, savedAt: 2 });
    const entries = await syncDexWithCollection();
    expect(Object.keys(entries).sort()).toEqual(["shades", "wizard"]);
    expect(await getDex()).toEqual(entries);
  });

  it("does not duplicate colors already recorded", async () => {
    await recordDiscovery(SHADES);
    await upsertSavedDuck({ id: "a", name: "A", variant: SHADES, scale: 0.6, savedAt: 1 });
    const entries = await syncDexWithCollection();
    expect(entries.shades).toEqual(["#ffd21e"]);
  });

  it("merges new colors from the collection into a known species", async () => {
    await recordDiscovery(SHADES);
    await upsertSavedDuck({ id: "a", name: "A", variant: SHADES_PINK, scale: 0.6, savedAt: 1 });
    const entries = await syncDexWithCollection();
    expect(entries.shades).toHaveLength(2);
  });
});

describe("isDexComplete", () => {
  it("is false when empty or partial", async () => {
    expect(isDexComplete({})).toBe(false);
    await recordDiscovery(SHADES);
    expect(isDexComplete(await getDex())).toBe(false);
  });

  it("is true once every species preview has been recorded", async () => {
    for (const s of SPECIES) await recordDiscovery(s.preview);
    expect(isDexComplete(await getDex())).toBe(true);
  });
});

describe("dexStatusOf", () => {
  it("reports an unknown species", () => {
    expect(dexStatusOf(SHADES)).toBe("species");
  });

  it("reports null once the exact duck is recorded", async () => {
    await recordDiscovery(SHADES);
    expect(dexStatusOf(SHADES)).toBe(null);
  });

  it("reports a new color on a known species", async () => {
    await recordDiscovery(SHADES);
    expect(dexStatusOf(SHADES_PINK)).toBe("color");
  });

  it("stays in sync after a retroactive collection sync", async () => {
    await upsertSavedDuck({ id: "a", name: "A", variant: WIZARD, scale: 0.6, savedAt: 1 });
    expect(dexStatusOf(WIZARD)).toBe("species");
    await syncDexWithCollection();
    expect(dexStatusOf(WIZARD)).toBe(null);
  });
});

describe("shiny", () => {
  const SHINY_SHADES: Variant = { ...SHADES, shiny: true };

  it("records the shiny version of a species once", async () => {
    const disc = await recordDiscovery(SHINY_SHADES);
    expect(disc.newShiny).toBe(true);
    expect(disc.shinyCount).toBe(1);
    const dup = await recordDiscovery(SHINY_SHADES);
    expect(dup.newShiny).toBe(false);
    expect(await getShinyDex()).toEqual(["shades"]);
  });

  it("does not record shiny for a normal duck", async () => {
    const disc = await recordDiscovery(SHADES);
    expect(disc.newShiny).toBe(false);
    expect(await getShinyDex()).toEqual([]);
  });

  it("dexStatusOf flags an uncollected shiny", async () => {
    await recordDiscovery(SHADES);
    expect(dexStatusOf(SHINY_SHADES)).toBe("shiny");
    await recordDiscovery(SHINY_SHADES);
    expect(dexStatusOf(SHINY_SHADES)).toBe(null);
  });

  it("syncs shiny ducks from the collection", async () => {
    await upsertSavedDuck({ id: "a", name: "A", variant: SHINY_SHADES, scale: 0.6, savedAt: 1 });
    await syncDexWithCollection();
    expect(await getShinyDex()).toEqual(["shades"]);
  });

  it("is complete once every species was seen shiny", async () => {
    expect(isShinyDexComplete([])).toBe(false);
    for (const s of SPECIES) await recordDiscovery({ ...s.preview, shiny: true });
    expect(isShinyDexComplete(await getShinyDex())).toBe(true);
  });
});

describe("completedFamilies", () => {
  const PIRATE: Variant = { body: "#FFD21E", beak: "#2A2A2A", acc: "pirate" };

  // Enregistre `count` couleurs distinctes pour une même espèce. Les teintes
  // sont arbitraires: seul le nombre d'entrées compte pour la progression.
  async function fillFamily(base: Variant, count: number) {
    for (let i = 0; i < count; i++) {
      await recordDiscovery({ ...base, body: `#0000${i.toString(16).padStart(2, "0")}` });
    }
  }

  it("counts nothing on an empty dex", () => {
    expect(completedFamilies({})).toBe(0);
  });

  it("never counts a fixed-look species", async () => {
    await recordDiscovery(PIRATE);
    expect(completedFamilies(await getDex())).toBe(0);
  });

  it("counts a colorable species only on its last color", async () => {
    const shades = SPECIES_BY_ID.get("shades")!;
    await fillFamily(SHADES, shades.maxColors - 1);
    expect(completedFamilies(await getDex())).toBe(0);
    await fillFamily(SHADES, shades.maxColors);
    expect(completedFamilies(await getDex())).toBe(1);
  });

  it("counts families independently", async () => {
    const shades = SPECIES_BY_ID.get("shades")!;
    const wizard = SPECIES_BY_ID.get("wizard")!;
    await fillFamily(SHADES, shades.maxColors);
    await fillFamily(WIZARD, wizard.maxColors);
    expect(completedFamilies(await getDex())).toBe(2);
  });

  it("counts families of one rarity only when asked", async () => {
    const shades = SPECIES_BY_ID.get("shades")!;
    const wizard = SPECIES_BY_ID.get("wizard")!;
    await fillFamily(SHADES, shades.maxColors);
    await fillFamily(WIZARD, wizard.maxColors);
    const entries = await getDex();
    expect(completedFamilies(entries, "common")).toBe(1);
    expect(completedFamilies(entries, "rare")).toBe(1);
    expect(completedFamilies(entries, "uncommon")).toBe(0);
  });

  it("exposes 27 colorable species", () => {
    expect(COLOR_SPECIES).toHaveLength(27);
    expect(COLOR_SPECIES.every((s) => s.maxColors > 1)).toBe(true);
  });
});

describe("recordDiscovery family flags", () => {
  it("flags familyComplete only on the color that completes the family", async () => {
    const shades = SPECIES_BY_ID.get("shades")!;
    let disc = await recordDiscovery(SHADES);
    expect(disc.familyComplete).toBe(false);
    expect(disc.familiesComplete).toBe(0);
    for (let i = 1; i < shades.maxColors - 1; i++) {
      disc = await recordDiscovery({ ...SHADES, body: `#0000${i.toString(16).padStart(2, "0")}` });
      expect(disc.familyComplete).toBe(false);
    }
    disc = await recordDiscovery({ ...SHADES, body: "#abcdef" });
    expect(disc.familyComplete).toBe(true);
    expect(disc.familiesComplete).toBe(1);
  });

  it("never flags familyComplete for a fixed-look species", async () => {
    const disc = await recordDiscovery({ body: "#FFD21E", beak: "#2A2A2A", acc: "pirate" });
    expect(disc.familyComplete).toBe(false);
  });

  it("does not re-flag familyComplete on a duplicate color", async () => {
    const shades = SPECIES_BY_ID.get("shades")!;
    for (let i = 0; i < shades.maxColors; i++) {
      await recordDiscovery({ ...SHADES, body: `#0000${i.toString(16).padStart(2, "0")}` });
    }
    const dup = await recordDiscovery({ ...SHADES, body: "#000000" });
    expect(dup.familyComplete).toBe(false);
    expect(dup.familiesComplete).toBe(1);
  });
});

describe("rewards", () => {
  it("keeps the legacy store keys of the two existing rewards", () => {
    expect(REWARDS.find((r) => r.id === "canardex-reward")!.storeKey).toBe("reward_claimed");
    expect(REWARDS.find((r) => r.id === "canardex-god")!.storeKey).toBe("god_claimed");
  });

  it("catalogs six rewards with distinct ids, keys and effects", () => {
    expect(REWARDS).toHaveLength(6);
    expect(new Set(REWARDS.map((r) => r.id)).size).toBe(6);
    expect(new Set(REWARDS.map((r) => r.storeKey)).size).toBe(6);
    expect(new Set(REWARDS.map((r) => r.variant().effect)).size).toBe(6);
  });

  it("splits the catalog into colour, collection and casino rewards", () => {
    expect(COLOR_REWARDS.map((r) => r.metric)).toEqual([
      "familiesCommon",
      "familiesUncommon",
      "familiesRare",
    ]);
    expect(COLLECTION_REWARDS.map((r) => r.metric)).toEqual(["species", "shiny"]);
    expect(CASINO_REWARDS.map((r) => r.metric)).toEqual(["casinoJackpot"]);
    expect(COLOR_REWARDS.length + COLLECTION_REWARDS.length + CASINO_REWARDS.length).toBe(
      REWARDS.length,
    );
  });

  it("sets every family threshold to 5", () => {
    expect(COLOR_REWARDS.map((r) => r.threshold)).toEqual([5, 5, 5]);
  });

  it("ranks the reward variants above the ordinary tiers", () => {
    expect(getRarity(REWARDS.find((r) => r.id === "canardex-god")!.variant())).toBe("god");
    expect(getRarity(REWARDS.find((r) => r.id === "canardex-reward")!.variant())).toBe("mythic");
  });

  it("no reward variant unlocks anything in the dex", async () => {
    for (const r of REWARDS) {
      const disc = await recordDiscovery(r.variant());
      expect(disc.newSpecies).toBe(false);
      expect(disc.newColor).toBe(false);
      expect(disc.familyComplete).toBe(false);
      expect(dexStatusOf(r.variant())).toBe(null);
    }
    expect(await getDex()).toEqual({});
  });

  it("caps the displayed progress at the threshold", () => {
    const phoenix = REWARDS.find((r) => r.id === "canardex-phoenix")!;
    const base = {
      species: 0,
      shiny: 0,
      familiesCommon: 0,
      familiesUncommon: 0,
      casinoJackpot: 0,
    };
    expect(rewardProgress(phoenix, { ...base, familiesRare: 3 })).toEqual({
      done: 3,
      total: 5,
    });
    expect(rewardProgress(phoenix, { ...base, familiesRare: 8 })).toEqual({
      done: 5,
      total: 5,
    });
  });

  it("maps a family count and rarity to the reward it unlocks", () => {
    expect(familyRewardAt("common", 5)!.name).toBe("Canard Caméléon");
    expect(familyRewardAt("uncommon", 5)!.name).toBe("Canard Paon");
    expect(familyRewardAt("rare", 5)!.name).toBe("Canard Phénix Chromatique");
    expect(familyRewardAt("common", 4)).toBeUndefined();
    expect(familyRewardAt("legendary", 5)).toBeUndefined();
  });

  it("claim flags persist independently per store key", async () => {
    expect(await isClaimed("reward_claimed")).toBe(false);
    await markClaimed("reward_claimed");
    expect(await isClaimed("reward_claimed")).toBe(true);
    expect(await isClaimed("god_claimed")).toBe(false);
  });
});
