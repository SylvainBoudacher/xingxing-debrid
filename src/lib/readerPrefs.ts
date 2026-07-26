import { LazyStore } from "@tauri-apps/plugin-store";

// Preferences d'affichage du lecteur, communes a toutes les oeuvres. Le sens de
// lecture, lui, depend de l'oeuvre et vit dans son entree de bibliotheque.
const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

export type PageMode = "single" | "double";
export type FitMode = "height" | "width" | "actual";

export interface ReaderPrefs {
  pageMode: PageMode;
  fit: FitMode;
}

const DEFAULTS: ReaderPrefs = { pageMode: "single", fit: "height" };

const KEYS = { pageMode: "reader_page_mode", fit: "reader_fit" } as const;

let cache: ReaderPrefs = DEFAULTS;

export async function loadReaderPrefs(): Promise<ReaderPrefs> {
  const [pageMode, fit] = await Promise.all([
    store.get<PageMode>(KEYS.pageMode),
    store.get<FitMode>(KEYS.fit),
  ]);
  cache = { pageMode: pageMode ?? DEFAULTS.pageMode, fit: fit ?? DEFAULTS.fit };
  return cache;
}

export function getCachedReaderPrefs(): ReaderPrefs {
  return cache;
}

export async function saveReaderPrefs(prefs: ReaderPrefs): Promise<void> {
  cache = prefs;
  await store.set(KEYS.pageMode, prefs.pageMode);
  await store.set(KEYS.fit, prefs.fit);
  await store.save();
}
