import { queryClient } from "@/lib/queryClient";
import { searchMulti as tmdbSearchMulti, tmdbKeys } from "@/lib/services/tmdb";
import { mapTmdb, type MediaType, type TmdbItem } from "@/lib/tmdbItem";
import { useEffect, useState } from "react";

const MIN_LENGTH = 4;
const DEBOUNCE_MS = 250;
const MAX_SUGGESTIONS = 7;

// Auto-complete TMDB pour la barre de MainPage (mode Films & Séries). Debounce
// la frappe, ignore les requêtes périmées, et réutilise le cache TanStack
// (mêmes clés que la recherche générale de la page Découverte).
export function useTmdbSuggestions(
  query: string,
  enabled: boolean,
  apiKey: string | null | undefined,
): { suggestions: TmdbItem[]; loading: boolean } {
  const [suggestions, setSuggestions] = useState<TmdbItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    const active = enabled && !!apiKey && q.length >= MIN_LENGTH;

    let cancelled = false;
    // Tous les setState sont dans le callback (asynchrone) : rien de synchrone
    // dans le corps de l'effet. Cas inactif => on vide vite (timeout 0).
    const t = setTimeout(
      async () => {
        if (!active) {
          setSuggestions([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const list = await queryClient.fetchQuery({
            queryKey: tmdbKeys.searchMulti(q, 1),
            queryFn: () => tmdbSearchMulti(q, 1, apiKey!),
            staleTime: 60_000,
          });
          if (cancelled) return;
          setSuggestions(
            list.results
              .filter((r) => r.media_type === "movie" || r.media_type === "tv")
              .slice(0, MAX_SUGGESTIONS)
              .map((r) => mapTmdb(r, r.media_type as MediaType)),
          );
        } catch {
          if (!cancelled) setSuggestions([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      active ? DEBOUNCE_MS : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, enabled, apiKey]);

  return { suggestions, loading };
}
