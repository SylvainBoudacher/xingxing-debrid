import { LazyStore } from "@tauri-apps/plugin-store";

// Affichage des versions dans la fiche d'un film / d'une série :
// cartes par résolution ("quick") ou liste complète avec tri et filtres ("full").
export type ReleasesView = "quick" | "full";

export const releasesViewQueryKey = ["prefs", "releasesView"] as const;

const KEY = "releases_view";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

export async function loadReleasesView(): Promise<ReleasesView> {
  return (await store.get<ReleasesView>(KEY)) ?? "quick";
}

export async function saveReleasesView(view: ReleasesView): Promise<void> {
  await store.set(KEY, view);
  await store.save();
}
