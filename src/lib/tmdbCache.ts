import { queryClient } from "@/lib/queryClient";

// Les listes TMDB bougent peu : cache 10 min pour couper les refetch au
// changement d'onglet / retour sur une recherche deja vue.
export const TMDB_STALE_MS = 10 * 60_000;

export function cachedTmdb<T>(queryKey: readonly unknown[], queryFn: () => Promise<T>): Promise<T> {
  return queryClient.fetchQuery({ queryKey, queryFn, staleTime: TMDB_STALE_MS });
}
