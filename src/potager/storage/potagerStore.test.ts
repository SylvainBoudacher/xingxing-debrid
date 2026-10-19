import { beforeEach, describe, expect, it, vi } from "vitest";

const registry = vi.hoisted(() => new Map<string, Map<string, unknown>>());
// reload() du vrai plugin échoue si le fichier manque ou n'est pas du JSON
const disk = vi.hoisted(() => ({ reloadFails: false, fileExists: false }));
const invoke = vi.hoisted(() => vi.fn(async () => disk.fileExists));

vi.mock("@tauri-apps/api/core", () => ({ invoke }));

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
    async reload() {
      if (disk.reloadFails) throw new Error("Failed to read store file");
    }
  }
  return { LazyStore };
});

const { loadPotager, savePotager } = await import("./potagerStore");
const { createStarterSave } = await import("../core/save");

beforeEach(() => {
  registry.clear();
  disk.reloadFails = false;
  disk.fileExists = false;
  invoke.mockClear();
});

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

  it("démarre une partie si le fichier n'existe pas encore", async () => {
    disk.reloadFails = true;
    const { save, recovered } = await loadPotager();
    expect(recovered).toBe(false);
    expect(save).toEqual(createStarterSave());
    expect(registry.get("potager.json")?.get("save")).toEqual(createStarterSave());
  });

  it("met de côté un fichier qui n'est pas du JSON", async () => {
    disk.reloadFails = true;
    disk.fileExists = true;
    const { save, recovered } = await loadPotager();
    expect(invoke).toHaveBeenCalledWith("backup_corrupt_store", { name: "potager.json" });
    expect(recovered).toBe(true);
    expect(save).toEqual(createStarterSave());
  });
});
