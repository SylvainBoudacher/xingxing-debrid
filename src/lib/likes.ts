import { LazyStore } from "@tauri-apps/plugin-store";

export interface LikedItem {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  originalTitle: string;
  posterPath: string | null;
  year: string;
  voteAverage: number;
  likedAt: number;
}

const store = new LazyStore("likes.json", { defaults: {}, autoSave: false });

export async function getLikes(): Promise<LikedItem[]> {
  return (await store.get<LikedItem[]>("items")) ?? [];
}

export async function saveLikes(items: LikedItem[]): Promise<void> {
  await store.set("items", items);
  await store.save();
}

// Valide un JSON importe et retourne les items exploitables
export function parseLikesJson(raw: string): LikedItem[] {
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Format invalide");
  return data
    .filter(
      (e): e is LikedItem =>
        e &&
        typeof e.id === "number" &&
        (e.mediaType === "movie" || e.mediaType === "tv") &&
        typeof e.title === "string",
    )
    .map((e) => ({
      id: e.id,
      mediaType: e.mediaType,
      title: e.title,
      originalTitle: typeof e.originalTitle === "string" ? e.originalTitle : "",
      posterPath: typeof e.posterPath === "string" ? e.posterPath : null,
      year: typeof e.year === "string" ? e.year : "",
      voteAverage: typeof e.voteAverage === "number" ? e.voteAverage : 0,
      likedAt: typeof e.likedAt === "number" ? e.likedAt : Date.now(),
    }));
}
