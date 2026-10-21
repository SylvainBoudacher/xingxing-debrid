import { invoke } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";
import { createStarterSave, parseSave, storedSave } from "../core/save";
import type { PotagerSave } from "../core/types";

const KEY = "save";
const FILE = "potager.json";
const store = new LazyStore(FILE, { defaults: {}, autoSave: false });

const pad = (n: number) => String(n).padStart(2, "0");
function stamp(d = new Date()): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export async function savePotager(save: PotagerSave): Promise<void> {
  await store.set(KEY, storedSave(save));
  await store.save();
}

export async function loadPotager(): Promise<{ save: PotagerSave; recovered: boolean }> {
  // relit le disque : l'autre fenêtre a pu écrire depuis le dernier chargement.
  // Le plugin échoue si le fichier manque ou n'est pas du JSON : le second cas est mis de côté.
  try {
    await store.reload();
  } catch {
    const corrupt = await invoke<boolean>("backup_corrupt_store", { name: FILE });
    const save = createStarterSave();
    await savePotager(save);
    return { save, recovered: corrupt };
  }
  const raw = await store.get<unknown>(KEY);
  if (raw == null) {
    const save = createStarterSave();
    await savePotager(save);
    return { save, recovered: false };
  }
  const parsed = parseSave(raw);
  if (parsed) return { save: parsed, recovered: false };

  const backup = new LazyStore(`potager.corrupt-${stamp()}.json`, {
    defaults: {},
    autoSave: false,
  });
  await backup.set(KEY, raw);
  await backup.save();
  const save = createStarterSave();
  await savePotager(save);
  return { save, recovered: true };
}

export interface SaveStore {
  load(): Promise<{ save: PotagerSave; recovered: boolean }>;
  write(save: PotagerSave): Promise<void>;
}

export const potagerStore: SaveStore = { load: loadPotager, write: savePotager };
