import { stepSim } from "../core/clock";
import type { PotagerSave } from "../core/types";
import type { SaveStore } from "../storage/potagerStore";

export interface SimHost {
  start(): Promise<void>;
  stop(): Promise<void>;
  state(): PotagerSave | null;
  subscribe(cb: (s: PotagerSave) => void): () => void;
  update(fn: (s: PotagerSave) => PotagerSave): void;
  replace(save: PotagerSave): Promise<void>;
  readonly running: boolean;
  readonly recovered: boolean;
}

interface Options {
  store: SaveStore;
  now?: () => number;
  tickMs?: number;
  saveEveryMs?: number;
}

// Simulation du Potager : le temps de jeu avance tant que l'app est ouverte.
export function createSimHost(opts: Options): SimHost {
  const { store } = opts;
  const now = opts.now ?? Date.now;
  const tickMs = opts.tickMs ?? 1000;
  // court : Cmd+Q et la relance après mise à jour ne laissent pas sauvegarder
  const saveEveryMs = opts.saveEveryMs ?? 3_000;

  let state: PotagerSave | null = null;
  let recovered = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastTick = 0;
  let lastWrite = 0;
  let stopped = false;
  const subscribers = new Set<(s: PotagerSave) => void>();

  const notify = () => state && subscribers.forEach((cb) => cb(state!));

  async function write() {
    if (!state) return;
    lastWrite = now();
    await store.write(state);
  }

  function tick() {
    if (!state) return;
    const t = now();
    state = stepSim(state, t - lastTick, Math.random);
    lastTick = t;
    notify();
    if (t - lastWrite >= saveEveryMs) void write();
  }

  return {
    async start() {
      stopped = false;
      const res = await store.load();
      if (stopped) return;
      state = res.save;
      recovered = res.recovered;
      notify();
      lastTick = now();
      lastWrite = now();
      timer ??= setInterval(tick, tickMs);
    },
    async stop() {
      stopped = true;
      if (timer) clearInterval(timer);
      timer = null;
      await write();
    },
    state: () => state,
    subscribe(cb) {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
    update(fn) {
      if (!state) return;
      state = fn(state);
      notify();
    },
    async replace(save) {
      state = save;
      await write();
      notify();
    },
    get running() {
      return timer !== null;
    },
    get recovered() {
      return recovered;
    },
  };
}
