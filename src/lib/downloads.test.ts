import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ProgressHandler = (e: { payload: { id: string; downloaded: number; total: number } }) => void;
let onProgress: ProgressHandler | null = null;

vi.mock("@tauri-apps/api/core", () => ({
  // download_to_dir ne se termine jamais : les téléchargements restent actifs.
  invoke: () => new Promise(() => {}),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: async (_event: string, handler: ProgressHandler) => {
    onProgress = handler;
    return () => {};
  },
}));

vi.mock("@tauri-apps/plugin-store", () => ({
  LazyStore: class {
    async get() {
      return undefined;
    }
  },
}));

import { getDownloadsSnapshot, startDownload, subscribeDownloads } from "@/lib/downloads";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("progression des téléchargements", () => {
  it("regroupe les événements en un seul rendu par intervalle", async () => {
    for (const n of [1, 2, 3]) void startDownload(`https://cdn.example/f${n}.mkv`);
    await vi.advanceTimersByTimeAsync(0);
    const ids = getDownloadsSnapshot().map((d) => d.id);
    expect(ids).toHaveLength(3);

    const render = vi.fn();
    subscribeDownloads(render);

    // 3 téléchargements x 10 événements reçus dans le même intervalle.
    for (let step = 1; step <= 10; step++) {
      for (const id of ids) onProgress!({ payload: { id, downloaded: step * 100, total: 1000 } });
    }
    expect(render).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);
    expect(render).toHaveBeenCalledTimes(1);
    expect(getDownloadsSnapshot().map((d) => d.downloaded)).toEqual([1000, 1000, 1000]);
  });
});
