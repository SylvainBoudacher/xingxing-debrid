/** Page ouverte au démarrage de l'application. */
export type StartupPage = "main" | "discover" | "library";

export const STARTUP_PAGE_KEY = "startup_page";

export const DEFAULT_STARTUP_PAGE: StartupPage = "main";

interface ReadableStore {
  get<T>(key: string): Promise<T | null | undefined>;
}

export async function loadStartupPage(store: ReadableStore): Promise<StartupPage> {
  const v = await store.get<StartupPage>(STARTUP_PAGE_KEY);
  return v === "discover" || v === "library" ? v : DEFAULT_STARTUP_PAGE;
}
