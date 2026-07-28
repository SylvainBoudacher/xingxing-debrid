import type { MangaRelease } from "@/lib/mangaReleases";
import { parseMangaName } from "@/lib/parseVolume";
import type { SearchResult } from "@/lib/search";

/**
 * Convertit un resultat de recherche C411 en release manga, quand le nom
 * annonce du CBZ. Les resultats Nyaa (identifies par leur magnet) sont
 * ecartes : l'ajout manga passe par le telechargement torrent C411.
 */
export function cbzReleaseFromResult(result: SearchResult): MangaRelease | null {
  if (result.magnet || !result.guid) return null;
  const parsed = parseMangaName(result.title);
  if (parsed.format !== "CBZ") return null;
  return {
    infoHash: result.guid,
    torrentName: result.title,
    span: parsed.span,
    format: parsed.format,
    size: result.size,
    seeders: result.seeders,
    exact: true,
    root: false,
  };
}
