import { mapManga, type MangaItem } from "@/lib/mangaItem";
import { queryClient } from "@/lib/queryClient";
import { mangadexKeys, search as mangaSearch } from "@/lib/services/mangadex";
import { useEffect, useState } from "react";

const MIN_LENGTH = 3;
const DEBOUNCE_MS = 300;
const MAX_SUGGESTIONS = 7;

// Auto-complete MangaDex pour la barre de MainPage (mode Mangas). Même
// structure que useTmdbSuggestions : frappe amortie, requêtes périmées
// ignorées, cache TanStack partagé avec la recherche de la page Découverte.
export function useMangaSuggestions(
  query: string,
  enabled: boolean,
): { suggestions: MangaItem[]; loading: boolean } {
  const [suggestions, setSuggestions] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    const active = enabled && q.length >= MIN_LENGTH;

    let cancelled = false;
    const t = setTimeout(
      async () => {
        if (!active) {
          setSuggestions([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const res = await queryClient.fetchQuery({
            queryKey: [...mangadexKeys.search(`${q}|`, 0), [] as string[]],
            queryFn: () => mangaSearch(q, 0, []),
            staleTime: 5 * 60_000,
          });
          if (cancelled) return;
          setSuggestions(res.data.slice(0, MAX_SUGGESTIONS).map(mapManga));
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
  }, [query, enabled]);

  return { suggestions, loading };
}
