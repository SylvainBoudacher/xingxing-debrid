import { LazyStore } from "@tauri-apps/plugin-store";
import { parseSave } from "../core/save";
import { createStarterSave } from "../core/starter";
import type { GardenSave } from "../core/types";

const KEY = "save";
const store = new LazyStore("garden.json", { defaults: {}, autoSave: false });

const pad = (n: number) => String(n).padStart(2, "0");
function stamp(d = new Date()): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export async function saveGarden(save: GardenSave): Promise<void> {
  await store.set(KEY, save);
  await store.save();
}

export async function loadGarden(): Promise<{ save: GardenSave; recovered: boolean }> {
  // relit le disque : la fenêtre Potager a pu écrire depuis le dernier chargement
  await store.reload();
  const raw = await store.get<unknown>(KEY);
  if (raw == null) {
    const save = createStarterSave();
    await saveGarden(save);
    return { save, recovered: false };
  }
  const parsed = parseSave(raw);
  if (parsed) return { save: parsed, recovered: false };

  const backup = new LazyStore(`garden.corrupt-${stamp()}.json`, { defaults: {}, autoSave: false });
  await backup.set(KEY, raw);
  await backup.save();
  const save = createStarterSave();
  await saveGarden(save);
  return { save, recovered: true };
}

export function createSaveScheduler(delayMs = 1500) {
  let pending: GardenSave | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function flush(): Promise<void> {
    if (timer) clearTimeout(timer);
    timer = null;
    if (!pending) return;
    const save = pending;
    pending = null;
    await saveGarden(save);
  }

  function schedule(save: GardenSave): void {
    pending = save;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void flush(), delayMs);
  }

  return { schedule, flush };
}
