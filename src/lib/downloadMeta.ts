import { getCachedLibrary, type LibraryEntry } from "@/lib/library";
import { parseRelease } from "@/lib/parseRelease";
import { posterUrl } from "@/lib/posterPreload";
import { releaseBadges } from "@/lib/releaseBadges";

export interface DownloadMeta {
  title: string;
  year?: string;
  posterSrc: string | null;
  badges: string[];
}

// Entrée de bibliothèque qui contient le fichier téléchargé, comparé sur son
// nom de base (les fichiers d'un torrent peuvent être dans des sous-dossiers).
export function findLibraryEntry(filename: string): LibraryEntry | undefined {
  return getCachedLibrary()?.find((e) =>
    e.files.some((f) => (f.name.split("/").pop() ?? f.name) === filename),
  );
}

// Retrouve l'entrée de bibliothèque qui contient le fichier pour afficher sa
// jaquette et son titre ; à défaut, le titre est tiré du nom de fichier.
export function resolveDownloadMeta(filename: string): DownloadMeta {
  const tmdb = findLibraryEntry(filename)?.tmdb;
  return {
    title: tmdb?.title ?? (parseRelease(filename).title || filename),
    year: tmdb?.year || undefined,
    posterSrc: tmdb?.posterPath ? posterUrl(tmdb.posterPath, "w154") : null,
    badges: releaseBadges(filename),
  };
}
