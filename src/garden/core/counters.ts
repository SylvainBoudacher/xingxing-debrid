import type { GardenSave } from "./types";

export type CounterId = "dug" | "sown" | "watered" | "picked" | "raked" | "crowsChased";

export function bump(save: GardenSave, id: CounterId): GardenSave {
  const counters = save.progress.counters;
  return {
    ...save,
    progress: { ...save.progress, counters: { ...counters, [id]: (counters[id] ?? 0) + 1 } },
  };
}
