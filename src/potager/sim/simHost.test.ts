import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStarterSave } from "../core/save";
import type { PotagerSave } from "../core/types";
import type { SaveStore } from "../storage/potagerStore";
import { createSimHost } from "./simHost";

function memoryStore() {
  let data: PotagerSave | null = null;
  const store = {
    writes: 0,
    get data() {
      return data;
    },
    async load() {
      return { save: data ?? createStarterSave(), recovered: false };
    },
    async write(s: PotagerSave) {
      store.writes++;
      data = s;
    },
  };
  return store satisfies SaveStore;
}

beforeEach(() => vi.useFakeTimers({ now: 0 }));
afterEach(() => vi.useRealTimers());

describe("hôte de simulation", () => {
  it("fait avancer le temps de jeu à chaque tick", async () => {
    const main = createSimHost({ store: memoryStore() });
    await main.start();
    await vi.advanceTimersByTimeAsync(3000);
    expect(main.state()?.playTimeMs).toBe(3000);
  });

  it("écrit au plus toutes les 3 secondes", async () => {
    const store = memoryStore();
    const main = createSimHost({ store });
    await main.start();
    await vi.advanceTimersByTimeAsync(2000);
    expect(store.writes).toBe(0);
    await vi.advanceTimersByTimeAsync(1500);
    expect(store.writes).toBe(1);
  });

  it("remplace l'état et l'écrit tout de suite", async () => {
    const store = memoryStore();
    const main = createSimHost({ store });
    await main.start();
    const x = { ...createStarterSave(), playTimeMs: 777 };
    await main.replace(x);
    expect(main.state()).toEqual(x);
    expect(store.writes).toBe(1);
  });

  it("prévient les abonnés", async () => {
    const main = createSimHost({ store: memoryStore() });
    const seen: number[] = [];
    main.subscribe((s) => seen.push(s.playTimeMs));
    await main.start();
    await vi.advanceTimersByTimeAsync(2000);
    expect(seen[seen.length - 1]).toBe(2000);
  });

  it("reste arrêté si on l'arrête pendant son démarrage", async () => {
    const potager = createSimHost({ store: memoryStore() });
    const started = potager.start();
    await potager.stop();
    await vi.advanceTimersByTimeAsync(3000);
    await started;
    expect(potager.running).toBe(false);
  });
});
