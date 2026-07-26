import { LazyStore } from "@tauri-apps/plugin-store";

// Titres C411 valides manuellement pour une oeuvre MangaDex. MangaDex ne
// connait pas toujours le titre de l'edition francaise : sans cet alias, la
// recherche automatique echouerait a chaque ouverture de la fiche.
const STORE_KEY = "manga_aliases";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

type AliasMap = Record<string, string[]>;

let cache: AliasMap | null = null;

export async function loadAliases(): Promise<AliasMap> {
  cache = (await store.get<AliasMap>(STORE_KEY)) ?? {};
  return cache;
}

export function getCachedAliases(): AliasMap {
  return cache ?? {};
}

export function aliasesFor(mangaId: string): string[] {
  return getCachedAliases()[mangaId] ?? [];
}

export async function addAlias(mangaId: string, title: string): Promise<void> {
  const trimmed = title.trim();
  if (!trimmed) return;
  const map = cache ?? (await loadAliases());
  const existing = map[mangaId] ?? [];
  if (existing.some((a) => a.toLowerCase() === trimmed.toLowerCase())) return;
  cache = { ...map, [mangaId]: [...existing, trimmed] };
  await store.set(STORE_KEY, cache);
  await store.save();
}

export async function removeAlias(mangaId: string, title: string): Promise<void> {
  const map = cache ?? (await loadAliases());
  const kept = (map[mangaId] ?? []).filter((a) => a !== title);
  cache = { ...map, [mangaId]: kept };
  if (kept.length === 0) delete cache[mangaId];
  await store.set(STORE_KEY, cache);
  await store.save();
}
