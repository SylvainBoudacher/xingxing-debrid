import { stepSim } from "../core/clock";
import type { PotagerSave } from "../core/types";
import type { SaveStore } from "../storage/potagerStore";
import type { Channel, HandoffMsg, HostRole } from "./channel";

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
  role: HostRole;
  store: SaveStore;
  channel: Channel;
  now?: () => number;
  tickMs?: number;
  saveEveryMs?: number;
  claimTimeoutMs?: number;
}

// Une seule simulation fait foi : celle de la fenêtre principale, sauf pendant que la
// fenêtre Potager est ouverte (elle la réclame, la principale écrit puis se met en pause).
export function createSimHost(opts: Options): SimHost {
  const { role, store, channel } = opts;
  const now = opts.now ?? Date.now;
  const tickMs = opts.tickMs ?? 1000;
  // court : Cmd+Q et la relance après mise à jour ne laissent pas sauvegarder
  const saveEveryMs = opts.saveEveryMs ?? 3_000;
  const claimTimeoutMs = opts.claimTimeoutMs ?? 2000;

  let state: PotagerSave | null = null;
  let recovered = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastTick = 0;
  let lastWrite = 0;
  let paused = false;
  let stopped = false;
  // fenêtre Potager qui a la main, côté fenêtre principale
  let owner: string | null = null;
  const id = Math.random().toString(36).slice(2);
  let off: (() => void) | null = null;
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

  function run() {
    lastTick = now();
    lastWrite = now();
    timer ??= setInterval(tick, tickMs);
  }

  function halt() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  async function load() {
    const res = await store.load();
    state = res.save;
    recovered = res.recovered;
    notify();
  }

  async function onMessage(msg: HandoffMsg) {
    if (msg.from === role) return;
    if (role === "potager") {
      if (msg.type === "query" && timer) channel.post({ type: "claim", from: role, id });
      return;
    }
    if (msg.type === "claim") {
      owner = msg.id;
      if (!paused) {
        paused = true;
        halt();
        await write();
      }
      channel.post({ type: "released", from: role, id });
    } else if (msg.type === "closed" && paused && msg.id === owner) {
      owner = null;
      paused = false;
      if (msg.save) {
        state = msg.save;
        notify();
        await write();
      } else await load();
      if (!paused && !stopped) run();
    }
  }

  async function claim() {
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(done, claimTimeoutMs);
      const stopListening = channel.on((m) => m.type === "released" && m.from !== role && done());
      function done() {
        clearTimeout(timeout);
        stopListening();
        resolve();
      }
      channel.post({ type: "claim", from: role, id });
    });
  }

  return {
    async start() {
      stopped = false;
      off = channel.on((m) => void onMessage(m));
      if (role === "main") channel.post({ type: "query", from: role, id });
      if (role === "potager") await claim();
      if (stopped) return;
      await load();
      if (!stopped && !paused) run();
    },
    async stop() {
      stopped = true;
      halt();
      off?.();
      off = null;
      if (paused) return;
      if (role === "potager")
        channel.post({ type: "closed", from: role, id, save: state ?? undefined });
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
