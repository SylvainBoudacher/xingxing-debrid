import { LazyStore } from "@tauri-apps/plugin-store";

export type Backdrop = "potager" | "mare" | "aucun";
export const BACKDROPS: Backdrop[] = ["potager", "mare", "aucun"];

const KEY = "animated_backdrop";
const MIGRATION_KEY = "garden_default_v1";
const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

const isBackdrop = (v: unknown): v is Backdrop => BACKDROPS.includes(v as Backdrop);

export async function getBackdrop(): Promise<Backdrop> {
  const v = await store.get<string>(KEY);
  return isBackdrop(v) ? v : "potager";
}

export async function saveBackdrop(v: Backdrop): Promise<void> {
  await store.set(KEY, v);
  await store.save();
}

// Le Potager devient le fond par défaut une fois, à la mise à jour ; ensuite le
// choix de l'utilisateur est respecté.
export async function loadBackdrop(): Promise<Backdrop> {
  if (!(await store.get<boolean>(MIGRATION_KEY))) {
    await store.set(KEY, "potager");
    await store.set(MIGRATION_KEY, true);
    await store.save();
    return "potager";
  }
  return getBackdrop();
}
