import { beforeEach, describe, expect, it, vi } from "vitest";

const registry = vi.hoisted(() => new Map<string, Map<string, unknown>>());

vi.mock("@tauri-apps/plugin-store", () => {
  class LazyStore {
    private filename: string;
    constructor(filename: string) {
      this.filename = filename;
    }
    // recrée la table après un registry.clear() entre deux tests
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

const { loadGarden, saveGarden, createSaveScheduler } = await import("./gardenStore");
const { createStarterSave } = await import("../core/starter");

beforeEach(() => registry.clear());

describe("loadGarden", () => {
  it("crée et écrit une sauvegarde de départ si le fichier est vide", async () => {
    const { save, recovered } = await loadGarden();
    expect(recovered).toBe(false);
    expect(save).toEqual(createStarterSave());
    expect(registry.get("garden.json")!.get("save")).toEqual(save);
  });

  it("relit une sauvegarde existante", async () => {
    const s = { ...createStarterSave(), plots: ["p1" as const] };
    s.sachets.pending = 4;
    await saveGarden(s);
    expect((await loadGarden()).save.sachets.pending).toBe(4);
  });

  it("met de côté une sauvegarde illisible et repart de zéro", async () => {
    registry.set("garden.json", new Map([["save", { version: 99 }]]));
    const { save, recovered } = await loadGarden();
    expect(recovered).toBe(true);
    expect(save).toEqual(createStarterSave());
    const backup = [...registry.keys()].find((k) => k.startsWith("garden.corrupt-"));
    expect(backup).toMatch(/^garden\.corrupt-\d{8}-\d{6}\.json$/);
    expect(registry.get(backup!)!.get("save")).toEqual({ version: 99 });
  });
});

describe("createSaveScheduler", () => {
  it("regroupe les écritures et flush écrit la dernière version", async () => {
    vi.useFakeTimers();
    const saver = createSaveScheduler(1000);
    const a = createStarterSave();
    const b = { ...createStarterSave(), sachets: { lastDailyAt: 0, pending: 9 } };
    saver.schedule(a);
    saver.schedule(b);
    expect(registry.get("garden.json")?.get("save")).toBeUndefined();
    await saver.flush();
    expect(registry.get("garden.json")!.get("save")).toEqual(b);
    vi.useRealTimers();
  });
});
