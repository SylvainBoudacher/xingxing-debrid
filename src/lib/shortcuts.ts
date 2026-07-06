import { LazyStore } from "@tauri-apps/plugin-store";

export type NavShortcutAction = "main" | "discover" | "library";
export type NavShortcuts = Record<NavShortcutAction, string>;

export const DEFAULT_NAV_SHORTCUTS: NavShortcuts = {
  main: "v",
  discover: "b",
  library: "n",
};

export const NAV_SHORTCUT_LABELS: Record<NavShortcutAction, string> = {
  main: "Accueil",
  discover: "Découverte",
  library: "Ma bibliothèque",
};

const STORE_KEY = "nav_shortcuts";
export const NAV_SHORTCUTS_EVENT = "nav-shortcuts-changed";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

export async function loadNavShortcuts(): Promise<NavShortcuts> {
  const saved = await store.get<Partial<NavShortcuts>>(STORE_KEY);
  return { ...DEFAULT_NAV_SHORTCUTS, ...saved };
}

export async function saveNavShortcuts(shortcuts: NavShortcuts): Promise<void> {
  await store.set(STORE_KEY, shortcuts);
  await store.save();
  window.dispatchEvent(new CustomEvent<NavShortcuts>(NAV_SHORTCUTS_EVENT, { detail: shortcuts }));
}
