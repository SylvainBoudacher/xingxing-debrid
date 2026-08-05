import { getLikes, saveLikes, type LikedItem } from "@/lib/likes";
import type { TmdbItem } from "@/lib/tmdbItem";
import { useCallback, useEffect, useMemo, useState } from "react";

// Favoris partagés par la découverte et la bibliothèque : liste persistée,
// index par clé `mediaType-id` et bascule d'un item.
export function useLikes(initial?: LikedItem[] | null) {
  const [likes, setLikes] = useState<LikedItem[]>(initial ?? []);

  useEffect(() => {
    if (initial) return;
    void getLikes().then(setLikes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const likedKeys = useMemo(() => new Set(likes.map((l) => `${l.mediaType}-${l.id}`)), [likes]);

  // Stables (useCallback) pour que React.memo sur DiscoverPosterCard tienne
  // quand la grille grossit au scroll infini.
  const toggleLike = useCallback(
    (item: TmdbItem) => {
      const key = `${item.mediaType}-${item.id}`;
      const next = likedKeys.has(key)
        ? likes.filter((l) => `${l.mediaType}-${l.id}` !== key)
        : [{ ...item, likedAt: Date.now() }, ...likes];
      setLikes(next);
      saveLikes(next);
    },
    [likes, likedKeys],
  );

  return { likes, setLikes, likedKeys, toggleLike };
}
