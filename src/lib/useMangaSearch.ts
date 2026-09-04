import { mapManga, type MangaItem } from "@/lib/mangaItem";
import { toastNetworkError } from "@/lib/networkError";
import { queryClient } from "@/lib/queryClient";
import { mangadexKeys, search as mangaSearch } from "@/lib/services/mangadex";
import { useEffect, useState } from "react";

const MIN_LENGTH = 2;
const DEBOUNCE_MS = 400;

/**
 * Recherche MangaDex amortie, pour les modales ou l'utilisateur tape le titre
 * d'une œuvre. `results` reste null tant qu'aucune recherche n'a abouti, ce
 * qui distingue "pas encore cherche" de "aucun résultat".
 */
export function useMangaSearch(query: string): { results: MangaItem[] | null; loading: boolean } {
  const [results, setResults] = useState<MangaItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    const active = trimmed.length >= MIN_LENGTH;

    let cancelled = false;
    // Tout passe par le timer, y compris la remise a zero : poser un etat
    // pendant le rendu de l'effet declencherait un rendu en cascade.
    const timer = setTimeout(
      async () => {
        if (!active) {
          setResults(null);
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const res = await queryClient.fetchQuery({
            queryKey: [...mangadexKeys.search(`${trimmed}|`, 0), [] as string[]],
            queryFn: () => mangaSearch(trimmed, 0, []),
            staleTime: 5 * 60_000,
          });
          if (!cancelled) setResults(res.data.map(mapManga));
        } catch (err) {
          if (!cancelled) toastNetworkError(err);
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      active ? DEBOUNCE_MS : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { results, loading };
}
