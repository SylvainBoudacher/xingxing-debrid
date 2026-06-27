import { LazyStore } from "@tauri-apps/plugin-store";

/** Store partagé par les panneaux de paramètres. */
export const settingsStore = new LazyStore("settings.json", { defaults: {}, autoSave: false });
