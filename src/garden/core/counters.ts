import type { GardenSave } from "./types";

export type CounterId =
  | "dug"
  | "sown"
  | "watered"
  | "picked"
  | "pickedBeautiful"
  | "raked"
  | "crowsChased"
  | "pressed"
  | "sachetsOpened"
  | "bloomed"
  | "nightBloom"
  | "brewed"
  | "potionsUsed";

export function bumpBy(save: GardenSave, id: CounterId, n: number): GardenSave {
  if (n <= 0) return save;
  const counters = save.progress.counters;
  return {
    ...save,
    progress: { ...save.progress, counters: { ...counters, [id]: (counters[id] ?? 0) + n } },
  };
}

export const bump = (save: GardenSave, id: CounterId): GardenSave => bumpBy(save, id, 1);
