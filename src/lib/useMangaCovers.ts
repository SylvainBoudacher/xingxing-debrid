import { volumeCovers } from "@/lib/mangaShelf";
import { covers, mangadexKeys } from "@/lib/services/mangadex";
import { useQuery } from "@tanstack/react-query";

// Une cover ajoutee a MangaDex n'a pas besoin d'apparaitre dans l'heure.
const COVERS_STALE_MS = 24 * 60 * 60_000;
const EMPTY = new Map<number, string>();

/** Covers MangaDex par numero de tome. Vide tant qu'elles n'ont pas repondu. */
export function useMangaCovers(mangaId: string): Map<number, string> {
  const { data } = useQuery({
    queryKey: mangadexKeys.covers(mangaId),
    staleTime: COVERS_STALE_MS,
    queryFn: () => covers(mangaId),
    select: volumeCovers,
  });
  return data ?? EMPTY;
}
