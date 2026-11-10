import { episodeOf, seasonsOf, type LibraryEntry } from "@/lib/library";
import { normalize } from "@/lib/normalizeTitle";
import { parseReleaseScope } from "@/lib/parseRelease";
import { releaseContents } from "./evaluate";
import type { ContentKey, RadarEntry } from "./types";

function nameMatches(library: LibraryEntry, entry: RadarEntry): boolean {
  const name = normalize(library.title);
  const titles = [entry.item.title, entry.item.originalTitle].filter(Boolean).map(normalize);
  if (!titles.some((t) => name.includes(t))) return false;
  return entry.season !== null || !entry.item.year || name.includes(entry.item.year);
}

function contentsOf(matches: LibraryEntry[], entry: RadarEntry): Set<ContentKey> {
  if (matches.length === 0) return new Set();
  if (entry.season === null) return new Set(["movie"]);
  const contents = new Set<ContentKey>();
  for (const { season, items } of seasonsOf(matches)) {
    if (season !== entry.season) continue;
    for (const { file } of items) {
      const episode = episodeOf(file.name);
      if (episode !== null) contents.add(`e${episode}`);
    }
  }
  for (const library of matches) {
    if (library.files.length > 0) continue;
    const scope = parseReleaseScope(library.releaseName ?? library.title);
    for (const c of releaseContents(scope, entry.season, entry.aired)) contents.add(c);
  }
  return contents;
}

export function ownedContents(
  entry: RadarEntry,
  library: LibraryEntry[],
): { certain: Set<ContentKey>; uncertain: Set<ContentKey> } {
  const { id, mediaType } = entry.item;
  const certain = contentsOf(
    library.filter((l) => l.tmdb?.id === id && l.tmdb.mediaType === mediaType),
    entry,
  );
  const named = contentsOf(
    library.filter((l) => !l.tmdb && nameMatches(l, entry)),
    entry,
  );
  return { certain, uncertain: new Set([...named].filter((c) => !certain.has(c))) };
}
