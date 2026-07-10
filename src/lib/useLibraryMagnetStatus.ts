import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LibraryEntry } from "@/lib/library";
import {
  allDebridKeys,
  fetchMagnets,
  isMagnetActive,
  type MagnetEntry,
} from "@/lib/services/allDebrid";

const POLL_MS = 5000;

// Statut AllDebrid des entrées pas encore enrichies (magnet envoyé mais
// débridage pas terminé). Poll tant qu'au moins un magnet suivi est actif,
// puis s'arrête tout seul. Map vide si rien à suivre ou pas de clé.
export function useLibraryMagnetStatus(
  entries: LibraryEntry[],
  apiKey: string | null | undefined,
): Map<number, MagnetEntry> {
  const pendingIds = useMemo(
    () => entries.filter((e) => !e.enriched && e.magnetId != null).map((e) => e.magnetId!),
    [entries],
  );

  const { data } = useQuery({
    queryKey: allDebridKeys.magnets(),
    queryFn: () => fetchMagnets(apiKey ?? ""),
    enabled: !!apiKey && pendingIds.length > 0,
    refetchInterval: (query) => {
      const magnets = query.state.data;
      if (!magnets) return POLL_MS;
      return magnets.some((m) => pendingIds.includes(m.id) && isMagnetActive(m)) ? POLL_MS : false;
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
