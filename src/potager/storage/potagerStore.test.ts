import { beforeEach, describe, expect, it, vi } from "vitest";

const registry = vi.hoisted(() => new Map<string, Map<string, unknown>>());

vi.mock("@tauri-apps/plugin-store", () => {
  class LazyStore {
    private filename: string;
    constructor(filename: string) {
      this.filename = filename;
    }
    private get data() {
      if (!registry.has(this.filename)) registry.set(this.filename, new Map());
      return registry.get(this.filename)!;
    }
    async get<T>(key: string): Promise<T | undefined> {
      return this.data.get(key) as T | undefined;
    }
    async set(key: string, val: unknown) {
      this.data.set(key, val);
    }
    async save() {}
    async reload() {}
  }
  return { LazyStore };
});

const { loadPotager, savePotager } = await import("./potagerStore");
const { createStarterSave } = await import("../core/save");

beforeEach(() => registry.clear());

describe("stockage du Potager", () => {
  it("crée et écrit une partie de départ si le fichier est vide", async () => {
    const { save, recovered } = await loadPotager();
    expect(recovered).toBe(false);
    expect(save).toEqual(createStarterSave());
    expect(registry.get("potager.json")?.get("save")).toEqual(createStarterSave());
  });

  it("relit ce qui a été écrit", async () => {
    const s = { ...createStarterSave(), playTimeMs: 4242 };
    await savePotager(s);
    expect((await loadPotager()).save).toEqual(s);
  });

  it("met de côté une sauvegarde illisible", async () => {
    await savePotager({ version: 9 } as never);
    const { save, recovered } = await loadPotager();
    expect(recovered).toBe(true);
    expect(save).toEqual(createStarterSave());
    const backups = [...registry.keys()].filter((k) => k.startsWith("potager.corrupt-"));
    expect(backups).toHaveLength(1);
    expect(registry.get(backups[0])?.get("save")).toEqual({ version: 9 });
    expect(registry.get("potager.json")?.get("save")).toEqual(createStarterSave());
  });
});
