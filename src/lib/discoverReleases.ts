import type { C411Torrent } from "@/lib/c411";
import { normalize } from "@/lib/normalizeTitle";
import { type ReleaseScope } from "@/lib/parseRelease";
import { parseReleaseTags, type ReleaseTags } from "@/lib/releaseTags";
import { queryClient } from "@/lib/queryClient";
import { c411Keys, searchTorrents } from "@/lib/services/c411";
import type { MediaType, TmdbItem } from "@/lib/tmdbItem";

export interface Occupant extends ReleaseTags {
  infoHash: string;
  fileSize: number;
  seeders: number;
  torrentName: string;
}

export function scopeLabel(scope: ReleaseScope): string {
  if (scope.kind === "episode")
    return `S${scope.season} E${String(scope.episode).padStart(2, "0")}`;
  if (scope.kind === "season") return `Saison ${scope.season}`;
  return "Intégrale";
}

const SERIES_SLUGS = new Set(["serie-tv", "serie-documentaire", "emission-tv", "animation-serie"]);

export { normalize };

function toOccupant(t: C411Torrent): Occupant {
  return {
    infoHash: t.infoHash,
    torrentName: t.name,
    fileSize: t.size,
    seeders: t.seeders,
    ...parseReleaseTags(t.name),
  };
}

export const RESOLUTION_RANK: Record<string, number> = {
  "4320p": 5,
  "4K": 4,
  "2160p": 4,
  "1080p": 3,
  "720p": 2,
  "480p": 1,
};

// Integrale et packs saison d'abord, puis les episodes par ordre croissant
function scopeRank(scope: ReleaseScope | null): number {
  if (scope === null) return 2;
  if (scope.kind === "complete") return 0;
  if (scope.kind === "season") return 1;
  return 3;
}

function episodeNumber(scope: ReleaseScope | null): number {
  return scope?.kind === "episode" ? scope.episode : 0;
}

// Intégrale et packs saison d'abord, puis les épisodes croissants
export function compareScope(a: Occupant, b: Occupant): number {
  return scopeRank(a.scope) - scopeRank(b.scope) || episodeNumber(a.scope) - episodeNumber(b.scope);
}

export function sortOccupants(occupants: Occupant[]): Occupant[] {
  return [...occupants].sort(
    (a, b) =>
      compareScope(a, b) ||
      (RESOLUTION_RANK[b.resolution ?? ""] ?? 0) - (RESOLUTION_RANK[a.resolution ?? ""] ?? 0) ||
      b.fileSize - a.fileSize,
  );
}

export function filterMovieReleases(
  torrents: C411Torrent[],
  nTitles: string[],
  item: TmdbItem,
): Occupant[] {
  const nextYear = item.year ? String(Number(item.year) + 1) : "";
  const occupants: Occupant[] = [];
  for (const t of torrents) {
    if (t.category?.id !== 1) continue;
    if (SERIES_SLUGS.has(t.subcategory?.slug ?? "")) continue;
    const nName = normalize(t.name);
    if (!nTitles.some((nt) => nName.includes(nt))) continue;
    if (item.year && !nName.includes(item.year) && !nName.includes(nextYear)) continue;
    occupants.push(toOccupant(t));
  }
  return occupants;
}

export type SeasonSelection = number | "complete";

export function filterTvReleases(
  torrents: C411Torrent[],
  nTitles: string[],
  season: SeasonSelection | null,
): Occupant[] {
  // Matche "S01", "S01E05", "Saison 1" pour une saison donnee
  const seasonRe =
    typeof season === "number"
      ? new RegExp(`\\bs0*${season}(?:e\\d+)?\\b|\\bsaison 0*${season}\\b|\\bseason 0*${season}\\b`)
      : null;
  const anySeasonRe = /\bs\d{1,2}(?:e\d+)?\b|\bsaison \d+\b|\bseason \d+\b/;
  const completeRe = /\bintegrale\b|\bcomplete\b|\bcomplet\b/;
  const occupants: Occupant[] = [];
  for (const t of torrents) {
    if (t.category?.id !== 1) continue;
    if (!SERIES_SLUGS.has(t.subcategory?.slug ?? "")) continue;
    const nName = normalize(t.name);
    if (!nTitles.some((nt) => nName.includes(nt))) continue;
    // "Integrale" = toutes les saisons dans un seul torrent : aucun numero de
    // saison dans le nom. Les packs d'une saison unique restent dans leur saison.
    const isComplete = completeRe.test(nName) && !anySeasonRe.test(nName);
    if (season === "complete") {
      if (!isComplete) continue;
    } else if (seasonRe && (isComplete || !seasonRe.test(nName))) continue;
    occupants.push(toOccupant(t));
  }
  return occupants;
}

export function releasesQueryKey(mediaType: MediaType, id: number, season: SeasonSelection | null) {
  return ["c411-releases", mediaType, id, season] as const;
}

// Recherche C411 par titre francais et titre original, dedupliquee par infoHash
export async function searchC411(
  item: TmdbItem,
  c411Key: string,
): Promise<{ torrents: C411Torrent[]; nTitles: string[] }> {
  const titles = [item.title, item.originalTitle].filter(Boolean);
  const queries = [...new Map(titles.map((t) => [normalize(t), t])).values()];
  const results = await Promise.allSettled(
    queries.map((q) => {
      const params = {
        name: q,
        page: 1,
        perPage: 50,
        sortBy: "seeders",
        sortOrder: "desc" as const,
      };
      return queryClient.fetchQuery({
        queryKey: c411Keys.search(params),
        queryFn: () => searchTorrents(params, c411Key),
        staleTime: 60_000,
      });
    }),
  );
  const byHash = new Map<string, C411Torrent>();
  for (const r of results) {
    if (r.status === "rejected") throw r.reason;
    for (const t of r.value.data) {
      if (!byHash.has(t.infoHash)) byHash.set(t.infoHash, t);
    }
  }
  return { torrents: [...byHash.values()], nTitles: queries.map(normalize) };
}
