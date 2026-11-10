import { LazyStore } from "@tauri-apps/plugin-store";
import { mergeUpdates, type EntryUpdate } from "./merge";
import type { RadarEntry, RadarExpectation } from "./types";

export interface RadarState {
  loaded: boolean;
  entries: RadarEntry[];
  lastCheckAt: number | null;
  checking: boolean;
  defaults: RadarExpectation;
}

export const DEFAULT_EXPECTATION: RadarExpectation = {
  language: "vf",
  resolution: "1080p",
  mode: "soft",
};

const store = new LazyStore("radar.json", { defaults: {}, autoSave: false });

let state: RadarState = {
  loaded: false,
  entries: [],
  lastCheckAt: null,
  checking: false,
  defaults: DEFAULT_EXPECTATION,
};
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;

function update(patch: Partial<RadarState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

async function persist(): Promise<void> {
  await store.set("entries", state.entries);
  await store.set("lastCheckAt", state.lastCheckAt);
  await store.set("defaults", state.defaults);
  await store.save();
}

function commit(patch: Partial<RadarState>): void {
  update(patch);
  void persist();
}

export function getRadarState(): RadarState {
  return state;
}

export function subscribeRadar(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function loadRadar(): Promise<void> {
  loading ??= Promise.all([
    store.get<RadarEntry[]>("entries"),
    store.get<number>("lastCheckAt"),
    store.get<RadarExpectation>("defaults"),
  ]).then(([entries, lastCheckAt, defaults]) => {
    update({
      loaded: true,
      entries: entries ?? [],
      lastCheckAt: lastCheckAt ?? null,
      defaults: defaults ?? DEFAULT_EXPECTATION,
    });
  });
  return loading;
}

export function addRadarEntry(entry: RadarEntry): void {
  if (state.entries.some((e) => e.id === entry.id)) return;
  commit({ entries: [...state.entries, entry] });
}

export function removeRadarEntries(ids: string[]): void {
  const removed = new Set(ids);
  commit({ entries: state.entries.filter((e) => !removed.has(e.id)) });
}

export function setRadarExpectation(id: string, expectation: RadarExpectation): void {
  commit({
    entries: state.entries.map((e) => (e.id === id ? { ...e, expectation, alerts: [] } : e)),
  });
}

export function markRadarSeen(id: string): void {
  if (!state.entries.some((e) => e.id === id && e.alerts.length > 0)) return;
  commit({ entries: state.entries.map((e) => (e.id === id ? { ...e, alerts: [] } : e)) });
}

export function setRadarDefaults(defaults: RadarExpectation): void {
  commit({ defaults });
}

export function setRadarChecking(checking: boolean): void {
  update({ checking });
}

export function applyCheckResult(
  updates: Map<string, EntryUpdate>,
  succeededAt: number | null,
): void {
  commit({
    entries: mergeUpdates(state.entries, updates),
    lastCheckAt: succeededAt ?? state.lastCheckAt,
  });
}

export function unseenAlertCount(radar: RadarState): number {
  return radar.entries.filter((e) => e.alerts.length > 0).length;
}
