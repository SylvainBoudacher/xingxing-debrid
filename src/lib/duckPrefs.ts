import { LazyStore } from "@tauri-apps/plugin-store";

// Same settings file as App: read the duck preferences directly so the launch
// reservation isn't racing the props that App loads asynchronously.
const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

export async function getMaxDucks(): Promise<number> {
  return (await store.get<number>("summer_pool_max_ducks")) ?? 15;
}

// true = un canard enregistré part directement en réserve au lieu de retourner
// nager dans le bassin.
export async function getSaveToReserve(): Promise<boolean> {
  return (await store.get<boolean>("summer_save_to_reserve")) ?? false;
}

export async function setSaveToReserve(v: boolean): Promise<void> {
  await store.set("summer_save_to_reserve", v);
  await store.save();
}
