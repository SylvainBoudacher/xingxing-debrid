import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStarterSave } from "../core/save";
import type { PotagerSave } from "../core/types";
import type { SaveStore } from "../storage/potagerStore";
import type { Channel, HandoffMsg } from "./channel";
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

// comme un emit Tauri : chaque message revient aussi à son émetteur
function memoryBus() {
  const listeners = new Set<(m: HandoffMsg) => void>();
  const channel = (): Channel => ({
    post: (m) => listeners.forEach((l) => queueMicrotask(() => l(m))),
    on: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  });
  return { channel };
}

beforeEach(() => vi.useFakeTimers({ now: 0 }));
afterEach(() => vi.useRealTimers());

describe("hôte de simulation", () => {
  it("fait avancer le temps de jeu à chaque tick", async () => {
    const main = createSimHost({
      role: "main",
      store: memoryStore(),
      channel: memoryBus().channel(),
    });
    await main.start();
    await vi.advanceTimersByTimeAsync(3000);
    expect(main.state()?.playTimeMs).toBe(3000);
  });

  it("écrit au plus toutes les 3 secondes", async () => {
    const store = memoryStore();
    const main = createSimHost({ role: "main", store, channel: memoryBus().channel() });
    await main.start();
    await vi.advanceTimersByTimeAsync(2000);
    expect(store.writes).toBe(0);
    await vi.advanceTimersByTimeAsync(1500);
    expect(store.writes).toBe(1);
  });

  it("cède la main au Potager qui la réclame", async () => {
    const store = memoryStore();
    const bus = memoryBus();
    const main = createSimHost({ role: "main", store, channel: bus.channel() });
    const potager = createSimHost({ role: "potager", store, channel: bus.channel() });
    await main.start();
    await vi.advanceTimersByTimeAsync(2000);
    await potager.start();
    expect(main.running).toBe(false);
    expect(potager.running).toBe(true);
    expect(store.writes).toBe(1);
    expect(potager.state()?.playTimeMs).toBe(2000);
  });

  it("reprend l'état du Potager sans compter la pause", async () => {
    const store = memoryStore();
    const bus = memoryBus();
    const main = createSimHost({ role: "main", store, channel: bus.channel() });
    const potager = createSimHost({ role: "potager", store, channel: bus.channel() });
    await main.start();
    await vi.advanceTimersByTimeAsync(3000);
    await potager.start();
    await vi.advanceTimersByTimeAsync(2000);
    await potager.stop();
    await vi.advanceTimersByTimeAsync(0);
    expect(main.running).toBe(true);
    expect(main.state()?.playTimeMs).toBe(5000);
    await vi.advanceTimersByTimeAsync(1000);
    expect(main.state()?.playTimeMs).toBe(6000);
  });

  it("charge quand même si personne ne répond à la réclamation", async () => {
    const potager = createSimHost({
      role: "potager",
      store: memoryStore(),
      channel: memoryBus().channel(),
    });
    const started = potager.start();
    await vi.advanceTimersByTimeAsync(1999);
    expect(potager.running).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await started;
    expect(potager.running).toBe(true);
  });

  it("ignore ses propres messages", async () => {
    const bus = memoryBus();
    const main = createSimHost({ role: "main", store: memoryStore(), channel: bus.channel() });
    await main.start();
    bus.channel().post({ type: "claim", from: "main", id: "x" });
    await vi.advanceTimersByTimeAsync(0);
    expect(main.running).toBe(true);
  });

  it("remplace l'état et l'écrit tout de suite", async () => {
    const store = memoryStore();
    const main = createSimHost({ role: "main", store, channel: memoryBus().channel() });
    await main.start();
    const x = { ...createStarterSave(), playTimeMs: 777 };
    await main.replace(x);
    expect(main.state()).toEqual(x);
    expect(store.writes).toBe(1);
  });

  it("n'écrit pas l'état périmé de la fenêtre principale en pause", async () => {
    const store = memoryStore();
    const bus = memoryBus();
    const main = createSimHost({ role: "main", store, channel: bus.channel() });
    const potager = createSimHost({ role: "potager", store, channel: bus.channel() });
    await main.start();
    await potager.start();
    await vi.advanceTimersByTimeAsync(4000);
    const before = store.writes;
    await main.stop();
    expect(store.writes).toBe(before);
    await potager.stop();
    expect(store.data?.playTimeMs).toBe(4000);
  });

  it("prévient les abonnés", async () => {
    const main = createSimHost({
      role: "main",
      store: memoryStore(),
      channel: memoryBus().channel(),
    });
    const seen: number[] = [];
    main.subscribe((s) => seen.push(s.playTimeMs));
    await main.start();
    await vi.advanceTimersByTimeAsync(2000);
    expect(seen[seen.length - 1]).toBe(2000);
  });

  it("reste arrêté si on l'arrête pendant son démarrage", async () => {
    const potager = createSimHost({
      role: "potager",
      store: memoryStore(),
      channel: memoryBus().channel(),
    });
    const started = potager.start();
    await potager.stop();
    await vi.advanceTimersByTimeAsync(3000);
    await started;
    expect(potager.running).toBe(false);
  });

  it("ignore la fermeture tardive d'une ancienne fenêtre Potager", async () => {
    const store = memoryStore();
    const bus = memoryBus();
    const main = createSimHost({ role: "main", store, channel: bus.channel() });
    await main.start();
    const first = createSimHost({ role: "potager", store, channel: bus.channel() });
    const second = createSimHost({ role: "potager", store, channel: bus.channel() });
    const firstStart = first.start();
    const secondStart = second.start();
    await first.stop();
    await vi.advanceTimersByTimeAsync(0);
    await Promise.all([firstStart, secondStart]);
    expect(second.running).toBe(true);
    expect(main.running).toBe(false);
  });

  it("reprend l'état transmis à la fermeture même si l'écriture n'aboutit pas", async () => {
    const store = memoryStore();
    const bus = memoryBus();
    const main = createSimHost({ role: "main", store, channel: bus.channel() });
    // page qui se ferme : l'écriture du Potager ne se termine jamais
    const dying: SaveStore = { load: store.load, write: () => new Promise(() => {}) };
    const potager = createSimHost({ role: "potager", store: dying, channel: bus.channel() });
    await main.start();
    await potager.start();
    await vi.advanceTimersByTimeAsync(4000);
    void potager.stop();
    await vi.advanceTimersByTimeAsync(0);
    expect(main.running).toBe(true);
    expect(main.state()?.playTimeMs).toBe(4000);
  });

  it("retrouve le Potager ouvert après un rechargement de la fenêtre principale", async () => {
    const store = memoryStore();
    const bus = memoryBus();
    const before = createSimHost({ role: "main", store, channel: bus.channel() });
    const potager = createSimHost({ role: "potager", store, channel: bus.channel() });
    await before.start();
    await potager.start();
    await before.stop();
    const reloaded = createSimHost({ role: "main", store, channel: bus.channel() });
    await reloaded.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(reloaded.running).toBe(false);
    await vi.advanceTimersByTimeAsync(3000);
    await potager.stop();
    await vi.advanceTimersByTimeAsync(0);
    expect(reloaded.running).toBe(true);
    expect(reloaded.state()?.playTimeMs).toBe(3000);
  });
});
