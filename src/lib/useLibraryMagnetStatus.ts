import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { LibraryEntry } from "@/lib/library";
import {
  allDebridKeys,
  fetchMagnetStatuses,
  isMagnetActive,
  type MagnetEntry,
} from "@/lib/services/allDebrid";

const POLL_MS = 5000;

// Statut AllDebrid des entrées pas encore enrichies (magnet envoyé mais
// débridage pas terminé). Seuls ces magnets sont interrogés, pas la liste
// complète du compte. Poll tant qu'au moins l'un d'eux est actif, puis
// s'arrête tout seul. Map vide si rien à suivre ou pas de clé.
export function useLibraryMagnetStatus(
  entries: LibraryEntry[],
  apiKey: string | null | undefined,
): Map<number, MagnetEntry> {
  const pendingIds = useMemo(
    () =>
      entries
        .filter((e) => !e.enriched && e.magnetId != null)
        .map((e) => e.magnetId!)
        .sort((a, b) => a - b),
    [entries],
  );

  const { data } = useQuery({
    queryKey: allDebridKeys.magnetStatuses(pendingIds),
    queryFn: () => fetchMagnetStatuses(apiKey ?? "", pendingIds),
    enabled: !!apiKey && pendingIds.length > 0,
    // Quand un magnet sort de la liste suivie, la clé change : les statuts des
    // autres restent affichés pendant le nouvel appel.
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      const magnets = query.state.data;
      if (!magnets) return POLL_MS;
      return magnets.some(isMagnetActive) ? POLL_MS : false;
    },
  });

  return useMemo(() => {
    const map = new Map<number, MagnetEntry>();
    if (!data) return map;
    const ids = new Set(pendingIds);
    for (const m of data) if (ids.has(m.id)) map.set(m.id, m);
    return map;
  }, [data, pendingIds]);
}
