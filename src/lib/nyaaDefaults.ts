import { LazyStore } from "@tauri-apps/plugin-store";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });
const KEY = "nyaa_defaults";

export interface NyaaDefaults {
  team: string;
  quality: string;
  codec: string;
  language: string;
}

export const EMPTY_NYAA_DEFAULTS: NyaaDefaults = {
  team: "",
  quality: "",
  codec: "",
  language: "",
};

export async function loadNyaaDefaults(): Promise<NyaaDefaults> {
  const v = await store.get<NyaaDefaults>(KEY);
  return { ...EMPTY_NYAA_DEFAULTS, ...(v ?? {}) };
}

export async function saveNyaaDefaults(d: NyaaDefaults): Promise<void> {
  await store.set(KEY, d);
  await store.save();
}
