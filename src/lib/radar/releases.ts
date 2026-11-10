import {
  filterMovieReleases,
  filterTvReleases,
  searchC411,
  type Occupant,
} from "@/lib/discoverReleases";
import type { C411Torrent } from "@/lib/c411";
import { normalize } from "@/lib/normalizeTitle";
import type { RadarEntry } from "./types";

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// La recherche C411 matche par sous-chaîne : sans ce filtre, "Dark" remonterait
// les sorties de "Dark Matter" et déclencherait de fausses alertes.
export function isExactSeriesRelease(name: string, nTitles: string[]): boolean {
  const nName = normalize(name);
  return nTitles.some((title) =>
    new RegExp(`(?:^| )${escapeRegExp(title)}(?: (?:19|20)\\d\\d)? (?:s\\d|saison|season)`).test(
      nName,
    ),
  );
}

export async function fetchRadarReleases(entry: RadarEntry, c411Key: string): Promise<Occupant[]> {
  // Tri par date en plus du tri par sources : un épisode tout juste sorti a peu
  // de sources et n'apparaîtrait pas dans les premiers résultats.
  const [bySeeders, byDate] = await Promise.all([
    searchC411(entry.item, c411Key, "seeders"),
    searchC411(entry.item, c411Key, "publishedAt"),
  ]);
  const byHash = new Map<string, C411Torrent>();
  for (const t of [...bySeeders.torrents, ...byDate.torrents]) byHash.set(t.infoHash, t);
  const torrents = [...byHash.values()];
  const { nTitles } = bySeeders;
  if (entry.season === null) return filterMovieReleases(torrents, nTitles, entry.item);
  return filterTvReleases(torrents, nTitles, entry.season).filter((o) =>
    isExactSeriesRelease(o.torrentName, nTitles),
  );
}
