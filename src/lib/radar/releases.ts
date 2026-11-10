import {
  filterMovieReleases,
  filterTvReleases,
  searchC411,
  type Occupant,
} from "@/lib/discoverReleases";
import type { C411Torrent } from "@/lib/c411";
import { normalize } from "@/lib/normalizeTitle";
import type { RadarEntry, RadarRelease } from "./types";

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// La recherche C411 matche par sous-chaîne : sans ces filtres, "Dark" remonterait
// "Dark Matter" ou "Into the Dark" et déclencherait de fausses alertes. Le nom
// commence par le titre, parfois suivi du titre original.
function releasePrefix(nTitles: string[]): string {
  const titles = nTitles.map(escapeRegExp).join("|");
  return `^(?:${titles})(?: (?:${titles}))?`;
}

const normalizedName = (name: string) => normalize(name.replace(/^\s*\[[^\]]*\]\s*/, ""));

export function isExactSeriesRelease(name: string, nTitles: string[]): boolean {
  const pattern = `${releasePrefix(nTitles)}(?: (?:19|20)\\d\\d)? (?:s\\d|saison|season)`;
  return new RegExp(pattern).test(normalizedName(name));
}

export function isExactMovieRelease(name: string, nTitles: string[], year: string): boolean {
  const after = year ? ` (?:${year}|${Number(year) + 1})\\b` : "(?: |$)";
  return new RegExp(`${releasePrefix(nTitles)}${after}`).test(normalizedName(name));
}

function filterForEntry(entry: RadarEntry, torrents: C411Torrent[], nTitles: string[]): Occupant[] {
  if (entry.season === null) {
    return filterMovieReleases(torrents, nTitles, entry.item).filter((o) =>
      isExactMovieRelease(o.torrentName, nTitles, entry.item.year),
    );
  }
  return filterTvReleases(torrents, nTitles, entry.season).filter((o) =>
    isExactSeriesRelease(o.torrentName, nTitles),
  );
}

export async function fetchRadarReleases(
  entry: RadarEntry,
  c411Key: string,
): Promise<RadarRelease[]> {
  // Tri par date en plus du tri par sources : un épisode tout juste sorti a peu
  // de sources. Une ancienne release qui remonte au classement des sources ne
  // figure pas dans les dernières publications, et n'alerte donc pas.
  const [bySeeders, byDate] = await Promise.all([
    searchC411(entry.item, c411Key, "seeders"),
    searchC411(entry.item, c411Key, "publishedAt"),
  ]);
  const byHash = new Map<string, C411Torrent>();
  for (const t of [...bySeeders.torrents, ...byDate.torrents]) byHash.set(t.infoHash, t);
  const recent = new Set(byDate.torrents.map((t) => t.infoHash));
  return filterForEntry(entry, [...byHash.values()], bySeeders.nTitles).map((o) => ({
    ...o,
    recent: recent.has(o.infoHash),
  }));
}
