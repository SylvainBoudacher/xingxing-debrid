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

// Action shortcuts: a single key (no modifier) that triggers a pool action.
export type ActionShortcutAction = "capture" | "vacuum";
export type ActionShortcuts = Record<ActionShortcutAction, string>;

export const DEFAULT_ACTION_SHORTCUTS: ActionShortcuts = {
  capture: "c",
  vacuum: "v",
};

export const ACTION_SHORTCUT_LABELS: Record<ActionShortcutAction, string> = {
  capture: "Capturer un canard",
  vacuum: "Attraper l'aspirateur",
};

const ACTION_STORE_KEY = "action_shortcuts";
export const ACTION_SHORTCUTS_EVENT = "action-shortcuts-changed";

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

export async function loadActionShortcuts(): Promise<ActionShortcuts> {
  const saved = await store.get<Partial<ActionShortcuts>>(ACTION_STORE_KEY);
  return { ...DEFAULT_ACTION_SHORTCUTS, ...saved };
}

export async function saveActionShortcuts(shortcuts: ActionShortcuts): Promise<void> {
  await store.set(ACTION_STORE_KEY, shortcuts);
  await store.save();
  window.dispatchEvent(
    new CustomEvent<ActionShortcuts>(ACTION_SHORTCUTS_EVENT, { detail: shortcuts }),
  );
}
