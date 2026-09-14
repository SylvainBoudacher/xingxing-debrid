import { loadMangaCovers } from "@/lib/mangaCoversCache";
import { mangadexKeys } from "@/lib/services/mangadex";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const EMPTY = new Map<number, string>();

/** Covers MangaDex par numero de tome. Vide tant qu'elles n'ont pas repondu. */
export function useMangaCovers(mangaId: string): Map<number, string> {
  const queryClient = useQueryClient();
  const queryKey = mangadexKeys.covers(mangaId);
  const { data } = useQuery({
    queryKey,
    // Le cache disque gere lui-meme le rafraichissement.
    staleTime: Infinity,
    queryFn: () => loadMangaCovers(mangaId, (map) => queryClient.setQueryData(queryKey, map)),
  });
  return data ?? EMPTY;
}
