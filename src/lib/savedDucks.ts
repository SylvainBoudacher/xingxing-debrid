import { LazyStore } from "@tauri-apps/plugin-store";
import type { Variant } from "@/components/duckTypes";

// Persisted duck collection. Lives in its own store file so it survives app
// updates (tauri-plugin-store data is kept across versions). The full Variant
// is stored so the exact skin can be rebuilt on the next launch.
export interface SavedDuck {
  id: string;
  name: string;
  variant: Variant;
  scale: number;
  savedAt: number;
}

const store = new LazyStore("ducks.json", { defaults: {}, autoSave: false });

export async function getSavedDucks(): Promise<SavedDuck[]> {
  return (await store.get<SavedDuck[]>("ducks")) ?? [];
}

async function persist(list: SavedDuck[]): Promise<SavedDuck[]> {
  await store.set("ducks", list);
  await store.save();
  return list;
}

// Insert the duck, or replace the existing entry with the same id (re-saving
// a duck that is already in the collection).
export async function upsertSavedDuck(duck: SavedDuck): Promise<SavedDuck[]> {
  const list = await getSavedDucks();
  const i = list.findIndex((d) => d.id === duck.id);
  if (i >= 0) list[i] = duck;
  else list.push(duck);
  return persist(list);
}

export async function removeSavedDuck(id: string): Promise<SavedDuck[]> {
  return persist((await getSavedDucks()).filter((d) => d.id !== id));
}

export async function renameSavedDuck(id: string, name: string): Promise<SavedDuck[]> {
  const list = await getSavedDucks();
  const d = list.find((x) => x.id === id);
  if (d) d.name = name;
  return persist(list);
}

// Validate an imported JSON file and keep only well-formed ducks.
export function parseDucksJson(raw: string): SavedDuck[] {
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Format invalide");
  return data
    .filter(
      (e): e is SavedDuck =>
        e &&
        typeof e.id === "string" &&
        typeof e.name === "string" &&
        typeof e.scale === "number" &&
        e.variant &&
        typeof e.variant.body === "string" &&
        typeof e.variant.beak === "string" &&
        typeof e.variant.acc === "string",
    )
    .map((e) => ({
      id: e.id,
      name: e.name,
      variant: e.variant,
      scale: e.scale,
      savedAt: typeof e.savedAt === "number" ? e.savedAt : Date.now(),
    }));
}

// Merge imported ducks into the collection, skipping ids already present.
export async function importSavedDucks(
  incoming: SavedDuck[],
): Promise<{ list: SavedDuck[]; added: number }> {
  const list = await getSavedDucks();
  const ids = new Set(list.map((d) => d.id));
  const added = incoming.filter((d) => !ids.has(d.id));
  const merged = await persist([...list, ...added]);
  return { list: merged, added: added.length };
}
