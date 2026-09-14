import { LazyStore } from "@tauri-apps/plugin-store";
import { volumeCovers } from "@/lib/mangaShelf";
import { covers } from "@/lib/services/mangadex";

// Covers MangaDex par oeuvre, gardees sur disque : sans elles, les jaquettes
// des tomes attendent la reponse reseau a chaque ouverture apres un lancement.
// Les images elles-memes sont deja en cache disque WebView.
const store = new LazyStore("manga-covers.json", { defaults: {}, autoSave: false });

// Une cover ajoutee a MangaDex n'a pas besoin d'apparaitre dans la journee.
const REFRESH_MS = 24 * 60 * 60_000;

interface CachedCovers {
  at: number;
  covers: [number, string][];
}

async function fetchAndSave(mangaId: string): Promise<Map<number, string>> {
  const map = volumeCovers(await covers(mangaId));
  await store.set(mangaId, { at: Date.now(), covers: [...map] } satisfies CachedCovers);
  await store.save();
  return map;
}

/**
 * Renvoie tout de suite la version disque si elle existe. Trop vieille, elle
 * est rafraichie en arriere-plan et `onRefresh` recoit la nouvelle version.
 */
export async function loadMangaCovers(
  mangaId: string,
  onRefresh: (map: Map<number, string>) => void,
): Promise<Map<number, string>> {
  const cached = await store.get<CachedCovers>(mangaId);
  if (!cached) return fetchAndSave(mangaId);
  if (Date.now() - cached.at > REFRESH_MS) {
    fetchAndSave(mangaId).then(onRefresh, () => {});
  }
  return new Map(cached.covers);
}
