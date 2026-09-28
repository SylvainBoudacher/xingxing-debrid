import { getCachedLibrary } from "@/lib/library";
import { parseRelease } from "@/lib/parseRelease";
import { posterUrl } from "@/lib/posterPreload";
import { releaseBadges } from "@/lib/releaseBadges";

export interface DownloadMeta {
  title: string;
  year?: string;
  posterSrc: string | null;
  badges: string[];
}

// Retrouve l'entrée de bibliothèque qui contient le fichier pour afficher sa
// jaquette et son titre ; à défaut, le titre est tiré du nom de fichier.
export function resolveDownloadMeta(filename: string): DownloadMeta {
  const entry = getCachedLibrary()?.find((e) =>
    e.files.some((f) => (f.name.split("/").pop() ?? f.name) === filename),
  );
  const tmdb = entry?.tmdb;
  return {
    title: tmdb?.title ?? (parseRelease(filename).title || filename),
    year: tmdb?.year || undefined,
    posterSrc: tmdb?.posterPath ? posterUrl(tmdb.posterPath, "w154") : null,
    badges: releaseBadges(filename),
  };
}
