import { LazyStore } from "@tauri-apps/plugin-store";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

export type Theme = "light" | "dark";
export type ThemePref = Theme | "system";

const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
let currentPref: ThemePref = "dark";
const prefListeners = new Set<() => void>();

systemDark.addEventListener("change", () => {
  if (currentPref === "system") applyTheme(systemDark.matches ? "dark" : "light");
});

export function getCurrentThemePref() {
  return currentPref;
}

export function subscribeThemePref(onChange: () => void) {
  prefListeners.add(onChange);
  return () => {
    prefListeners.delete(onChange);
  };
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

// "system" suit l'OS en direct ; un choix explicite coupe le suivi.
export function applyThemePref(pref: ThemePref) {
  currentPref = pref;
  prefListeners.forEach((fn) => fn());
  applyTheme(pref === "system" ? (systemDark.matches ? "dark" : "light") : pref);
}

export function parseThemePref(v: unknown): ThemePref {
  return v === "light" || v === "system" ? v : "dark";
}

export async function getThemePref(): Promise<ThemePref> {
  return parseThemePref(await store.get("theme"));
}

export async function setThemePref(pref: ThemePref) {
  applyThemePref(pref);
  await store.set("theme", pref);
  await store.save();
}
