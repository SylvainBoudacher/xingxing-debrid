import { mapManga, type MangaItem } from "@/lib/mangaItem";
import { queryClient } from "@/lib/queryClient";
import {
  MANGA_PAGE_SIZE,
  feed as mangaFeed,
  mangadexKeys,
  search as mangaSearch,
  type MangaFeed,
  type MangaListResponse,
} from "@/lib/services/mangadex";
import { useCallback, useEffect, useState } from "react";

export const MANGA_FEED_LABELS: Record<MangaFeed, string> = {
  popular: "Populaires",
  top_rated: "Mieux notés",
  latest: "Nouveautés",
};

// Recherche pendant la frappe : sous ce seuil, on retombe sur le feed courant.
const LIVE_SEARCH_MIN = 3;
const LIVE_SEARCH_DEBOUNCE_MS = 350;

export interface MangaFeedState {
  items: MangaItem[];
  loading: boolean;
  loadingMore: boolean;
  error: unknown;
  hasMore: boolean;
  feed: MangaFeed;
  tagIds: string[];
  setFeed: (f: MangaFeed) => void;
  setTagIds: (ids: string[]) => void;
  loadMore: () => void;
  retry: () => void;
}

// `query` est piloté par la page (barre de recherche partagée avec TMDB).
export function useMangaFeed(query: string): MangaFeedState {
  const [feed, setFeed] = useState<MangaFeed>("popular");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Resultat courant etiquete par la requete qui l'a produit : tant que
  // l'etiquette ne correspond pas, la liste est en chargement. Evite un
  // setState synchrone dans l'effet, et affiche toujours la bonne page.
  const [result, setResult] = useState<Result | null>(null);

  // Requete effectivement envoyee : la frappe est amortie pour ne pas lancer un
  // appel par caractere.
  const [activeQuery, setActiveQuery] = useState("");
  useEffect(() => {
    const trimmed = query.trim();
    const next = trimmed.length >= LIVE_SEARCH_MIN ? trimmed : "";
    if (next === activeQuery) return;
    const timer = setTimeout(() => setActiveQuery(next), LIVE_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, activeQuery]);

  const fetchPage = useCallback(
    (p: number): Promise<MangaListResponse> => {
      const key = activeQuery
        ? mangadexKeys.search(`${activeQuery}|${tagIds.join(",")}`, p)
        : mangadexKeys.feed(feed, p);
      return queryClient.fetchQuery({
        queryKey: [...key, tagIds],
        queryFn: () =>
          activeQuery ? mangaSearch(activeQuery, p, tagIds) : mangaFeed(feed, p, tagIds),
        staleTime: 5 * 60_000,
      });
    },
    [activeQuery, feed, tagIds],
  );

  // Etiquette de la requete courante : tout changement de feed, de filtre, de
  // recherche ou de tentative repart de la premiere page.
  const key = `${attempt}|${feed}|${activeQuery}|${tagIds.join(",")}`;

  useEffect(() => {
    let cancelled = false;
    fetchPage(0)
      .then((res) => {
        if (!cancelled) {
          setResult({ key, items: res.data.map(mapManga), total: res.total, page: 0, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) setResult({ key, items: [], total: 0, page: 0, error: err });
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage, key]);

  const ready = result?.key === key;
  const items = ready ? result.items : NO_ITEMS;
  const error = ready ? result.error : null;
  const total = ready ? result.total : 0;
  const hasMore = items.length < total && items.length >= MANGA_PAGE_SIZE;

  const loadMore = useCallback(() => {
    if (!ready || loadingMore || !hasMore) return;
    const nextPage = result.page + 1;
    setLoadingMore(true);
    fetchPage(nextPage)
      .then((res) => {
        // Deduplication : MangaDex peut renvoyer deux fois la meme oeuvre quand
        // le classement bouge entre deux pages.
        setResult((prev) => {
          if (!prev || prev.key !== key) return prev;
          const seen = new Set(prev.items.map((i) => i.id));
          return {
            ...prev,
            items: [...prev.items, ...res.data.map(mapManga).filter((i) => !seen.has(i.id))],
            page: nextPage,
          };
        });
      })
      .catch(() => {
        // Le bouton reste disponible : une page manquee n'invalide pas la liste.
      })
      .finally(() => setLoadingMore(false));
  }, [fetchPage, hasMore, key, loadingMore, ready, result]);

  return {
    items,
    loading: !ready,
    loadingMore,
    error,
    hasMore,
    feed,
    tagIds,
    setFeed,
    setTagIds,
    loadMore,
    retry: () => setAttempt((a) => a + 1),
  };
}

interface Result {
  key: string;
  items: MangaItem[];
  total: number;
  page: number;
  error: unknown;
}

const NO_ITEMS: MangaItem[] = [];
