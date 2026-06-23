import { useEffect, useState } from "react";
import { getApiKey } from "@/lib/apiKeys";
import { getLikes, type LikedItem } from "@/lib/likes";
import { queryClient } from "@/lib/queryClient";
import { LazyStore } from "@tauri-apps/plugin-store";
import {
  tmdbKeys,
  topRated as tmdbTopRated,
  discoverAnimation as tmdbDiscoverAnimation,
} from "@/lib/services/tmdb";
import { allDebridKeys, fetchMagnets } from "@/lib/services/allDebrid";

const TMDB_STALE_MS = 10 * 60_000;
const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

export interface AppInitResult {
  /** true tant que le chargement initial est en cours */
  loading: boolean;
  tmdbKey: string | null;
  likes: LikedItem[];
}

/**
 * Exécuté une seule fois au montage de l'App.
 *
 * - Si le setup n'est pas terminé (nouvel utilisateur ou config incomplète) :
 *   on ferme le splash immédiatement sans prefetch ni délai.
 * - Si le setup est complet :
 *   - Précharge les sections TMDB si la clé TMDB est présente
 *   - Précharge les magnets si la clé AllDebrid est présente
 *   - Garantit un splash d'au moins 2s
 *
 * Les erreurs réseau sont ignorées (fire-and-forget) pour ne jamais bloquer le démarrage.
 */
export function useAppInit(): AppInitResult {
  const [loading, setLoading] = useState(true);
  const [tmdbKey, setTmdbKey] = useState<string | null>(null);
  const [likes, setLikes] = useState<LikedItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 1. Vérifie d'abord si le setup est terminé.
      //    Nouvel utilisateur ou config incomplète → on saute tout le prefetch.
      const [setupComplete, welcomeSeen] = await Promise.all([
        store.get<boolean>("setup_complete"),
        store.get<boolean>("welcome_v1_seen"),
      ]);

      if (cancelled) return;

      if (!setupComplete || !welcomeSeen) {
        // Pas de splash, pas de prefetch — on envoie directement sur SetupPage
        setLoading(false);
        return;
      }

      const MIN_SPLASH_MS = 2_000;
      const splashStart = Date.now();

      // 2. Lecture des clés et des likes en parallèle
      const [tmdbKeyValue, allDebridKeyValue, likesData] = await Promise.all([
        getApiKey("tmdb_api_key"),
        getApiKey("alldebrid_api_key"),
        getLikes(),
      ]);

      if (cancelled) return;

      if (likesData.length > 0) {
        setLikes(likesData);
      }

      // 3. Prefetch uniquement si les clés sont présentes
      const prefetchJobs: Promise<unknown>[] = [];

      if (tmdbKeyValue) {
        setTmdbKey(tmdbKeyValue);
        prefetchJobs.push(
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
        );
      }

      if (allDebridKeyValue) {
        prefetchJobs.push(
          queryClient.prefetchQuery({
            queryKey: allDebridKeys.magnets(),
            queryFn: () => fetchMagnets(allDebridKeyValue),
            staleTime: 60_000,
          }),
        );
      }

      // Swallow toutes les erreurs réseau pour ne pas bloquer le démarrage
      if (prefetchJobs.length > 0) {
        await Promise.allSettled(prefetchJobs);
      }

      if (cancelled) return;

      // 4. Garantit que le splash est visible au moins MIN_SPLASH_MS
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
