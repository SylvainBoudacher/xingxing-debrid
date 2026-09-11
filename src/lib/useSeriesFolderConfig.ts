import {
  getCachedSeriesFolders,
  loadSeriesFolders,
  saveSeriesFolderConfig,
  type SeriesFolderConfig,
} from "@/lib/seriesFolders";
import { useEffect, useState } from "react";

// Dossiers personnalisés d'une série (null tant qu'elle n'en a pas). Sans id
// TMDB (film, entrée brute), il n'y en a jamais.
export function useSeriesFolderConfig(tmdbId: number | null) {
  const [config, setConfig] = useState<SeriesFolderConfig | null>(() =>
    tmdbId === null ? null : (getCachedSeriesFolders()?.[String(tmdbId)] ?? null),
  );

  useEffect(() => {
    if (tmdbId === null || getCachedSeriesFolders()) return;
    let active = true;
    void loadSeriesFolders().then((map) => {
      if (active) setConfig(map[String(tmdbId)] ?? null);
    });
    return () => {
      active = false;
    };
  }, [tmdbId]);

  function update(next: SeriesFolderConfig) {
    setConfig(next);
    if (tmdbId !== null) void saveSeriesFolderConfig(tmdbId, next);
  }

  return [config, update] as const;
}
