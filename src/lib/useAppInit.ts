import { useEffect, useState } from "react";
import { getApiKey } from "@/lib/apiKeys";
import { getLikes, type LikedItem } from "@/lib/likes";
import { queryClient } from "@/lib/queryClient";
import {
  tmdbKeys,
  topRated as tmdbTopRated,
  discoverAnimation as tmdbDiscoverAnimation,
} from "@/lib/services/tmdb";

const TMDB_STALE_MS = 10 * 60_000;

export interface AppInitResult {
  /** true tant que le chargement initial est en cours */
  loading: boolean;
  tmdbKey: string | null;
  likes: LikedItem[];
}

/**
 * Exécuté une seule fois au montage de l'App.
 * - Lit les clés API et les paramètres depuis le store Tauri
 * - Si une clé TMDB est présente, précharge les 4 sections de la page Découverte
 *   dans le queryClient (films, séries, animations film, animations série)
 * - Charge la liste locale des likes
 *
 * Le prefetch est fire-and-forget pour les erreurs réseau : si ça échoue
 * l'app s'ouvre quand même et la DiscoverPage affichera l'erreur normalement.
 */
export function useAppInit(): AppInitResult {
  const [loading, setLoading] = useState(true);
  const [tmdbKey, setTmdbKey] = useState<string | null>(null);
  const [likes, setLikes] = useState<LikedItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const MIN_SPLASH_MS = 2_000;
      const splashStart = Date.now();

      // 1. Lecture des clés et des likes en parallèle
      const [tmdbKeyValue, likesData] = await Promise.all([
        getApiKey("tmdb_api_key"),
        getLikes(),
      ]);

      if (cancelled) return;

      if (likesData.length > 0) {
        setLikes(likesData);
      }

      if (tmdbKeyValue) {
        setTmdbKey(tmdbKeyValue);

        // 2. Précharge les 4 sections en parallèle.
        //    On swallow les erreurs pour ne pas bloquer le démarrage.
        await Promise.allSettled([
          queryClient.prefetchQuery({
            queryKey: tmdbKeys.topRated("movie", 1),
            queryFn: () => tmdbTopRated("movie", 1, tmdbKeyValue),
            staleTime: TMDB_STALE_MS,
          }),
          queryClient.prefetchQuery({
            queryKey: tmdbKeys.topRated("tv", 1),
            queryFn: () => tmdbTopRated("tv", 1, tmdbKeyValue),
            staleTime: TMDB_STALE_MS,
          }),
          queryClient.prefetchQuery({
            queryKey: tmdbKeys.discoverAnimation("movie", 1),
            queryFn: () => tmdbDiscoverAnimation("movie", 1, tmdbKeyValue),
            staleTime: TMDB_STALE_MS,
          }),
          queryClient.prefetchQuery({
            queryKey: tmdbKeys.discoverAnimation("tv", 1),
            queryFn: () => tmdbDiscoverAnimation("tv", 1, tmdbKeyValue),
            staleTime: TMDB_STALE_MS,
          }),
        ]);
      }

      if (cancelled) return;

      // 3. Garantit que le splash est visible au moins MIN_SPLASH_MS
      const elapsed = Date.now() - splashStart;
      const remaining = MIN_SPLASH_MS - elapsed;
      if (remaining > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, remaining));
      }

      if (cancelled) return;
      setLoading(false);
    }

    init().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, tmdbKey, likes };
}
