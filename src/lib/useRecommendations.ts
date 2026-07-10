import { getCachedLibrary, loadLibrary } from "@/lib/library";
import type { LikedItem } from "@/lib/likes";
import {
  pickSeeds,
  scoreRecommendations,
  ownedTmdbKeys,
  type SeedList,
} from "@/lib/recommendations";
import { tmdbKeys, recommendations as tmdbRecommendations } from "@/lib/services/tmdb";
import { cachedTmdb } from "@/lib/tmdbCache";
import { mapTmdb, type TmdbItem } from "@/lib/tmdbItem";
import { useState } from "react";

// Recommandations "Pour vous" : graines = likes + bibliotheque, un appel
// /recommendations par graine (mis en cache TanStack), puis scoring croise.
export function useRecommendations(tmdbKey: string | null | undefined, likes: LikedItem[]) {
  const [recos, setRecos] = useState<TmdbItem[]>([]);
  const [because, setBecause] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!tmdbKey) return;
    setLoading(true);
    setError(null);
    try {
      const library = getCachedLibrary() ?? (await loadLibrary());
      const seeds = pickSeeds(likes, library);
      if (seeds.length === 0) {
        setRecos([]);
        setBecause(new Map());
        return;
      }
      const lists: SeedList[] = await Promise.all(
        seeds.map(async (seed) => ({
          seed,
          results: (
            await cachedTmdb(tmdbKeys.recommendations(seed.mediaType, seed.id), () =>
              tmdbRecommendations(seed.mediaType, seed.id, tmdbKey),
            )
          ).results,
        })),
      );
      const scored = scoreRecommendations(lists, ownedTmdbKeys(library));
      setRecos(scored.map((s) => mapTmdb(s.result, s.mediaType)));
      setBecause(new Map(scored.map((s) => [`${s.mediaType}-${s.result.id}`, s.becauseOf])));
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return { recos, because, loading, error, load };
}
