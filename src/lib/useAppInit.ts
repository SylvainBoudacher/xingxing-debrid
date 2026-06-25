import { useEffect, useState } from "react";
import { getApiKey } from "@/lib/apiKeys";
import { getLikes, type LikedItem } from "@/lib/likes";
import { queryClient } from "@/lib/queryClient";
import { LazyStore } from "@tauri-apps/plugin-store";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import {
  tmdbKeys,
  topRated as tmdbTopRated,
  discoverAnimation as tmdbDiscoverAnimation,
} from "@/lib/services/tmdb";
import { allDebridKeys, fetchMagnets } from "@/lib/services/allDebrid";
import type { ViewMode } from "@/pages/PreferencesPage";

export type WindowLaunchMode = "small" | "large" | "maximized";

const TMDB_STALE_MS = 10 * 60_000;
const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

export interface AppPrefs {
  /** Mode d'affichage de la recherche (simple / detailed) */
  searchViewMode: ViewMode;
  /** Mode d'affichage de la liste de magnets */
  viewMode: ViewMode;
  /** Dernière version de patch notes vue — pour le badge de notification */
  patchnotesSeen: string | null;
  /** Masquer les fichiers .nfo dans la liste des fichiers */
  hideNfoFiles: boolean;
  /** Ne pas inclure les .nfo dans le téléchargement global */
  skipNfoDownload: boolean;
}

export interface AppInitResult {
  /** true tant que le chargement initial est en cours */
  loading: boolean;
  tmdbKey: string | null;
  c411Key: string | null;
  allDebridKey: string | null;
  likes: LikedItem[];
  /** Préférences UI lues pendant le splash — zéro latence à l'ouverture des pages */
  prefs: AppPrefs;
  /** Met à jour les clés en mémoire après une sauvegarde (sans redémarrage). */
  applyKeys: (keys: { c411Key: string; allDebridKey: string; tmdbKey: string }) => void;
}

const DEFAULT_PREFS: AppPrefs = {
  searchViewMode: "simple",
  viewMode: "simple",
  patchnotesSeen: null,
  hideNfoFiles: true,
  skipNfoDownload: true,
};

/**
 * Exécuté une seule fois au montage de l'App.
 *
 * - Nouvel utilisateur (setup incomplet) : ferme le splash immédiatement,
 *   aucun prefetch ni délai.
 *
 * - Utilisateur connu :
 *   Phase 1 — bloquante (nécessaire avant d'afficher quoi que ce soit) :
 *     · Lecture des 3 clés API + likes + préférences UI
 *     · Prefetch TMDB page 1 (top_rated movies/tv + animations)
 *     · Prefetch magnets AllDebrid
 *
 *   Phase 2 — fire-and-forget (remplit le cache pendant que le splash
 *   tourne encore, sans rallonger le délai minimum) :
 *     · TMDB page 2 de chaque section (top_rated + animations × movie/tv)
 *     → Quand l'utilisateur scrolle sur DiscoverPage, les données sont déjà là.
 *
 *   Délai minimum de 2 s garanti sur la phase 1 uniquement.
 *
 * Toutes les erreurs réseau sont avalées pour ne jamais bloquer le démarrage.
 */
export function useAppInit(): AppInitResult {
  const [loading, setLoading] = useState(true);
  const [tmdbKey, setTmdbKey] = useState<string | null>(null);
  const [c411Key, setC411Key] = useState<string | null>(null);
  const [allDebridKey, setAllDebridKey] = useState<string | null>(null);
  const [likes, setLikes] = useState<LikedItem[]>([]);
  const [prefs, setPrefs] = useState<AppPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // ── Taille de fenêtre au lancement ────────────────────────────────────
      const windowMode = await store.get<WindowLaunchMode>("window_launch_mode");
      if (windowMode) {
        const win = getCurrentWindow();
        if (windowMode === "maximized") {
          await win.maximize();
        } else {
          const [w, h] = windowMode === "small" ? [1100, 720] : [1720, 1052];
          await win.setSize(new LogicalSize(w, h));
          await win.center();
        }
      }

      // ── Vérification du setup ──────────────────────────────────────────────
      const [setupComplete, welcomeSeen] = await Promise.all([
        store.get<boolean>("setup_complete"),
        store.get<boolean>("welcome_v1_seen"),
      ]);

      if (cancelled) return;

      if (!setupComplete || !welcomeSeen) {
        // Nouvel utilisateur → pas de splash, pas de prefetch
        setLoading(false);
        return;
      }

      const MIN_SPLASH_MS = 2_000;
      const splashStart = Date.now();

      // ── Phase 1 : lecture parallèle de tout ce qu'on peut ─────────────────
      const [
        tmdbKeyValue,
        allDebridKeyValue,
        c411KeyValue,
        likesData,
        searchViewMode,
        viewMode,
        patchnotesSeen,
        hideNfoFiles,
        skipNfoDownload,
      ] = await Promise.all([
        getApiKey("tmdb_api_key"),
        getApiKey("alldebrid_api_key"),
        getApiKey("c411_api_key"),
        getLikes(),
        store.get<ViewMode>("search_view_mode"),
        store.get<ViewMode>("view_mode"),
        store.get<string>("patchnotes_seen"),
        store.get<boolean>("hide_nfo_files"),
        store.get<boolean>("skip_nfo_download"),
      ]);

      if (cancelled) return;

      // Mise à jour de l'état en une seule passe
      if (likesData.length > 0) setLikes(likesData);
      if (c411KeyValue) setC411Key(c411KeyValue);
      if (allDebridKeyValue) setAllDebridKey(allDebridKeyValue);
      if (tmdbKeyValue) setTmdbKey(tmdbKeyValue);

      setPrefs({
        searchViewMode: searchViewMode ?? "simple",
        viewMode: viewMode ?? "simple",
        patchnotesSeen: patchnotesSeen ?? null,
        hideNfoFiles: hideNfoFiles ?? true,
        skipNfoDownload: skipNfoDownload ?? true,
      });

      // ── Phase 1 : prefetch page 1 (bloquant) ──────────────────────────────
      const prefetchPage1: Promise<unknown>[] = [];

      if (tmdbKeyValue) {
        prefetchPage1.push(
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
        prefetchPage1.push(
          queryClient.prefetchQuery({
            queryKey: allDebridKeys.magnets(),
            queryFn: () => fetchMagnets(allDebridKeyValue),
            staleTime: 60_000,
          }),
        );
      }

      if (prefetchPage1.length > 0) {
        await Promise.allSettled(prefetchPage1);
      }

      if (cancelled) return;

      // ── Phase 2 : prefetch page 2 TMDB — fire-and-forget ──────────────────
      // Lancé sans await : remplit le cache pendant le reste du splash
      // (délai minimum restant) sans jamais le rallonger.
      if (tmdbKeyValue) {
        Promise.allSettled([
          queryClient.prefetchQuery({
            queryKey: tmdbKeys.topRated("movie", 2),
            queryFn: () => tmdbTopRated("movie", 2, tmdbKeyValue),
            staleTime: TMDB_STALE_MS,
          }),
          queryClient.prefetchQuery({
            queryKey: tmdbKeys.topRated("tv", 2),
            queryFn: () => tmdbTopRated("tv", 2, tmdbKeyValue),
            staleTime: TMDB_STALE_MS,
          }),
          queryClient.prefetchQuery({
            queryKey: tmdbKeys.discoverAnimation("movie", 2),
            queryFn: () => tmdbDiscoverAnimation("movie", 2, tmdbKeyValue),
            staleTime: TMDB_STALE_MS,
          }),
          queryClient.prefetchQuery({
            queryKey: tmdbKeys.discoverAnimation("tv", 2),
            queryFn: () => tmdbDiscoverAnimation("tv", 2, tmdbKeyValue),
            staleTime: TMDB_STALE_MS,
          }),
        ]);
      }

      // ── Délai minimum du splash ────────────────────────────────────────────
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

  function applyKeys(keys: { c411Key: string; allDebridKey: string; tmdbKey: string }) {
    setC411Key(keys.c411Key);
    setAllDebridKey(keys.allDebridKey);
    setTmdbKey(keys.tmdbKey);
  }

  return { loading, tmdbKey, c411Key, allDebridKey, likes, prefs, applyKeys };
}
