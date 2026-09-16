import { beforeEach, describe, expect, it, vi } from "vitest";

const data = vi.hoisted(() => new Map<string, unknown>());

vi.mock("@tauri-apps/plugin-store", () => ({
  LazyStore: class {
    async get<T>(k: string): Promise<T | undefined> {
      return data.get(k) as T | undefined;
    }
    async set(k: string, v: unknown) {
      data.set(k, v);
    }
    async save() {}
  },
}));

const { getBackdrop, loadBackdrop, saveBackdrop } = await import("./backdropPref");

beforeEach(() => data.clear());

describe("loadBackdrop", () => {
  it("force le Potager une seule fois, même si l'été était désactivé", async () => {
    data.set("summer_pool_enabled", false);
    expect(await loadBackdrop()).toBe("potager");
    expect(data.get("garden_default_v1")).toBe(true);
  });

  it("respecte ensuite le choix de l'utilisateur", async () => {
    await loadBackdrop();
    await saveBackdrop("mare");
    expect(await loadBackdrop()).toBe("mare");
  });

  it("retombe sur le Potager si la valeur stockée est inconnue", async () => {
    data.set("garden_default_v1", true);
    data.set("animated_backdrop", "piscine");
    expect(await loadBackdrop()).toBe("potager");
  });
});

describe("getBackdrop", () => {
  it("lit sans migrer", async () => {
    expect(await getBackdrop()).toBe("potager");
    expect(data.has("garden_default_v1")).toBe(false);
    data.set("animated_backdrop", "aucun");
    expect(await getBackdrop()).toBe("aucun");
  });
});
