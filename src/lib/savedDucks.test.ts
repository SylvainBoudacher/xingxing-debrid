import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SavedDuck } from "./savedDucks";

// The registry lives inside the factory closure — no external variables, so
// there are no TDZ issues from Vitest's mock hoisting. clearAll() is exposed
// as a static method so beforeEach can reset state between tests.
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
import {
  getSavedDucks,
  upsertSavedDuck,
  removeSavedDuck,
  renameSavedDuck,
  setDuckReserved,
  reserveDucks,
  importSavedDucks,
  parseDucksJson,
} from "./savedDucks";

const BASE_VARIANT = { body: "#FFD21E", beak: "#F5811F", acc: "none" } as const;

function makeDuck(id: string, extra: Partial<SavedDuck> = {}): SavedDuck {
  return { id, name: `Canard ${id}`, variant: BASE_VARIANT, scale: 0.65, savedAt: 1000, ...extra };
}

beforeEach(() => {
  (LazyStore as unknown as { clearAll: () => void }).clearAll();
});

// ---- parseDucksJson (pure, no store) ----------------------------------------

describe("parseDucksJson", () => {
  it("parses a valid duck array", () => {
    const raw = JSON.stringify([makeDuck("a")]);
    const result = parseDucksJson(raw);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });

  it("returns empty array for empty JSON array", () => {
    expect(parseDucksJson("[]")).toEqual([]);
  });

  it("throws on non-array JSON", () => {
    expect(() => parseDucksJson('{"id":"x"}')).toThrow("Format invalide");
  });

  it("throws on invalid JSON string", () => {
    expect(() => parseDucksJson("not json")).toThrow();
  });

  it("filters out entries missing variant", () => {
    const raw = JSON.stringify([makeDuck("a"), { id: "b", name: "Bad", scale: 0.5 }]);
    expect(parseDucksJson(raw)).toHaveLength(1);
  });

  it("filters out entries missing scale", () => {
    const raw = JSON.stringify([makeDuck("a"), { id: "b", name: "Bad", variant: BASE_VARIANT }]);
    expect(parseDucksJson(raw)).toHaveLength(1);
  });

  it("filters out entries where variant fields are not strings", () => {
    const bad = {
      id: "b",
      name: "Bad",
      scale: 0.5,
      variant: { body: 123, beak: "#fff", acc: "none" },
    };
    expect(parseDucksJson(JSON.stringify([bad]))).toHaveLength(0);
  });

  it("filters out null entries", () => {
    const raw = JSON.stringify([null, makeDuck("a")]);
    expect(parseDucksJson(raw)).toHaveLength(1);
  });

  it("defaults savedAt to current time when missing", () => {
    const before = Date.now();
    const duck = { id: "a", name: "X", scale: 0.5, variant: BASE_VARIANT };
    const result = parseDucksJson(JSON.stringify([duck]));
    expect(result[0].savedAt).toBeGreaterThanOrEqual(before);
  });

  it("preserves savedAt when present", () => {
    const raw = JSON.stringify([makeDuck("a", { savedAt: 12345 })]);
    expect(parseDucksJson(raw)[0].savedAt).toBe(12345);
  });

  it("defaults reserved to false when absent", () => {
    const raw = JSON.stringify([makeDuck("a")]);
    expect(parseDucksJson(raw)[0].reserved).toBe(false);
  });

  it("preserves reserved: true", () => {
    const raw = JSON.stringify([makeDuck("a", { reserved: true })]);
    expect(parseDucksJson(raw)[0].reserved).toBe(true);
  });
});

// ---- store operations --------------------------------------------------------

describe("getSavedDucks", () => {
  it("returns empty array when store is empty", async () => {
    expect(await getSavedDucks()).toEqual([]);
  });

  it("returns saved ducks", async () => {
    await upsertSavedDuck(makeDuck("a"));
    const result = await getSavedDucks();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });
});

describe("upsertSavedDuck", () => {
  it("adds a new duck to an empty collection", async () => {
    const list = await upsertSavedDuck(makeDuck("a"));
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("a");
  });

  it("appends when id is not present", async () => {
    await upsertSavedDuck(makeDuck("a"));
    const list = await upsertSavedDuck(makeDuck("b"));
    expect(list).toHaveLength(2);
  });

  it("replaces existing duck with same id", async () => {
    await upsertSavedDuck(makeDuck("a", { name: "Ancien" }));
    const list = await upsertSavedDuck(makeDuck("a", { name: "Nouveau" }));
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Nouveau");
  });
});

describe("removeSavedDuck", () => {
  it("removes the duck with the given id", async () => {
    await upsertSavedDuck(makeDuck("a"));
    await upsertSavedDuck(makeDuck("b"));
    const list = await removeSavedDuck("a");
    expect(list.map((d) => d.id)).toEqual(["b"]);
  });

  it("is a no-op when id not found", async () => {
    await upsertSavedDuck(makeDuck("a"));
    const list = await removeSavedDuck("unknown");
    expect(list).toHaveLength(1);
  });
});

describe("renameSavedDuck", () => {
  it("updates the name of the target duck", async () => {
    await upsertSavedDuck(makeDuck("a", { name: "Avant" }));
    const list = await renameSavedDuck("a", "Apres");
    expect(list[0].name).toBe("Apres");
  });

  it("does not affect other ducks", async () => {
    await upsertSavedDuck(makeDuck("a"));
    await upsertSavedDuck(makeDuck("b", { name: "Intouche" }));
    await renameSavedDuck("a", "Nouveau");
    const list = await getSavedDucks();
    expect(list.find((d) => d.id === "b")!.name).toBe("Intouche");
  });

  it("is a no-op when id not found", async () => {
    await upsertSavedDuck(makeDuck("a", { name: "Original" }));
    await renameSavedDuck("unknown", "NouveauNom");
    expect((await getSavedDucks())[0].name).toBe("Original");
  });
});

describe("setDuckReserved", () => {
  it("marks a duck as reserved", async () => {
    await upsertSavedDuck(makeDuck("a", { reserved: false }));
    const list = await setDuckReserved("a", true);
    expect(list[0].reserved).toBe(true);
  });

  it("removes duck from reserve", async () => {
    await upsertSavedDuck(makeDuck("a", { reserved: true }));
    const list = await setDuckReserved("a", false);
    expect(list[0].reserved).toBe(false);
  });
});

describe("reserveDucks", () => {
  it("marks all listed ids as reserved", async () => {
    await upsertSavedDuck(makeDuck("a"));
    await upsertSavedDuck(makeDuck("b"));
    await upsertSavedDuck(makeDuck("c"));
    const list = await reserveDucks(["a", "c"]);
    expect(list.find((d) => d.id === "a")!.reserved).toBe(true);
    expect(list.find((d) => d.id === "b")!.reserved).toBeFalsy();
    expect(list.find((d) => d.id === "c")!.reserved).toBe(true);
  });

  it("ignores ids not in the collection", async () => {
    await upsertSavedDuck(makeDuck("a"));
    const list = await reserveDucks(["unknown"]);
    expect(list).toHaveLength(1);
    expect(list[0].reserved).toBeFalsy();
  });
});

describe("importSavedDucks", () => {
  it("imports ducks into an empty collection", async () => {
    const { list, added } = await importSavedDucks([makeDuck("a"), makeDuck("b")]);
    expect(list).toHaveLength(2);
    expect(added).toBe(2);
  });

  it("skips ducks with ids already present", async () => {
    await upsertSavedDuck(makeDuck("a"));
    const { list, added } = await importSavedDucks([makeDuck("a"), makeDuck("b")]);
    expect(list).toHaveLength(2);
    expect(added).toBe(1);
  });

  it("returns added count of 0 when all ids already exist", async () => {
    await upsertSavedDuck(makeDuck("a"));
    const { added } = await importSavedDucks([makeDuck("a")]);
    expect(added).toBe(0);
  });

  it("does not overwrite existing duck data on duplicate id", async () => {
    await upsertSavedDuck(makeDuck("a", { name: "Original" }));
    await importSavedDucks([makeDuck("a", { name: "Imported" })]);
    const list = await getSavedDucks();
    expect(list.find((d) => d.id === "a")!.name).toBe("Original");
  });
});
