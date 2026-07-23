import { type LibraryEntry } from "@/lib/library";
import { detail as tmdbDetail, tmdbKeys, type TmdbMediaType } from "@/lib/services/tmdb";
import { cachedTmdb } from "@/lib/tmdbCache";
import { useEffect, useRef } from "react";

const BATCH = 10;

// Complète `tmdb.genreIds` des entrées enregistrées avant que le champ existe.
// Best-effort : une fiche TMDB injoignable est simplement ignorée (l'entrée
// tombera dans "Autres"), et n'est pas redemandée pendant la session.
export function useLibraryGenres(
  entries: LibraryEntry[],
  tmdbKey: string | null | undefined,
  enabled: boolean,
  onResolved: (genresById: Map<string, number[]>) => void,
) {
  const attempted = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || !tmdbKey) return;

    const missing = new Map<string, { mediaType: TmdbMediaType; id: number }>();
    for (const e of entries) {
      if (!e.tmdb || e.tmdb.genreIds?.length) continue;
      const key = `${e.tmdb.mediaType}:${e.tmdb.id}`;
      if (attempted.current.has(key)) continue;
      missing.set(key, { mediaType: e.tmdb.mediaType, id: e.tmdb.id });
    }
    if (missing.size === 0) return;

    let active = true;
    const targets = [...missing];
    for (const [key] of targets) attempted.current.add(key);

    void (async () => {
      const resolved = new Map<string, number[]>();
      for (let i = 0; i < targets.length; i += BATCH) {
        await Promise.all(
          targets.slice(i, i + BATCH).map(async ([key, { mediaType, id }]) => {
            try {
              const data = await cachedTmdb(tmdbKeys.detail(mediaType, id), () =>
                tmdbDetail(mediaType, id, tmdbKey),
              );
              const ids = data.genres?.map((g) => g.id) ?? [];
              if (ids.length > 0) resolved.set(key, ids);
            } catch {
              // hors-ligne ou fiche supprimée : on laisse l'entrée sans genre
            }
          }),
        );
        if (!active) return;
      }
      if (resolved.size > 0) onResolved(resolved);
    })();

    return () => {
      active = false;
    };
    // onResolved est stable côté appelant (setEntries + persistance).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, tmdbKey, enabled]);
}
