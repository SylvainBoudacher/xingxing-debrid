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
import { SPECIES, speciesOf } from "@/components/duckSpecies";
import { upsertSavedDuck } from "./savedDucks";
import {
  dexStatusOf,
  getDex,
  isDexComplete,
  isRewardClaimed,
  markRewardClaimed,
  recordDiscovery,
  rewardVariant,
  syncDexWithCollection,
} from "./duckDex";

const SHADES: Variant = { body: "#FFD21E", beak: "#F5811F", acc: "shades" };
const SHADES_PINK: Variant = { body: "#FB7AA8", beak: "#F5811F", acc: "shades" };
const WIZARD: Variant = { body: "#FFD21E", beak: "#F5811F", acc: "wizard", accColor: "#A78BFA" };

beforeEach(async () => {
  (LazyStore as unknown as { clearAll: () => void }).clearAll();
  await getDex(); // refresh the module-level cache after the store reset
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

describe("reward", () => {
  it("reward variant classifies as a cataloged legendary", () => {
    const v = rewardVariant();
    expect(getRarity(v)).toBe("legendary");
    expect(SPECIES.some((s) => s.id === speciesOf(v))).toBe(true);
  });

  it("claim flag persists", async () => {
    expect(await isRewardClaimed()).toBe(false);
    await markRewardClaimed();
    expect(await isRewardClaimed()).toBe(true);
  });
});
