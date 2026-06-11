import { LazyStore } from "@tauri-apps/plugin-store";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

export type Theme = "light" | "dark";

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export async function getTheme(): Promise<Theme> {
  const t = await store.get<Theme>("theme");
  return t === "light" ? "light" : "dark";
}

export async function setTheme(theme: Theme) {
  applyTheme(theme);
  await store.set("theme", theme);
  await store.save();
}
