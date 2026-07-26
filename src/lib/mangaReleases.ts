import type { C411Torrent } from "@/lib/c411";
import type { MangaItem } from "@/lib/mangaItem";
import { normalize } from "@/lib/normalizeTitle";
import { parseMangaName, spanSize, type ReleaseFormat, type VolumeSpan } from "@/lib/parseVolume";
import { queryClient } from "@/lib/queryClient";
import { c411Keys, searchTorrents } from "@/lib/services/c411";

/** Sous-categorie C411 "manga" (categorie 2 "ebook"). */
export const MANGA_SUBCATEGORY = 15;

export interface MangaRelease {
  infoHash: string;
  torrentName: string;
  span: VolumeSpan | null;
  format: ReleaseFormat | null;
  size: number;
  seeders: number;
  /**
   * Le titre est immediatement suivi d'un marqueur de tome ou d'une integrale.
   * Distingue "Naruto T05" d'un spin-off comme "Naruto Gaiden T01", que le
   * seul prefixe ne suffit pas a ecarter.
   */
  exact: boolean;
}

/**
 * Titres a essayer sur C411 pour une oeuvre : le titre francais d'abord (les
 * releases C411 portent le titre de l'edition francaise), puis anglais et
 * romaji, puis les alias valides par l'utilisateur. Dedupliques sur leur forme
 * normalisee.
 */
export function candidateTitles(item: MangaItem, aliases: string[] = []): string[] {
  const raw = [item.titleFr, item.titleEn, item.titleRomaji, ...aliases].filter(
    (t): t is string => !!t && t.trim().length > 0,
  );
  return [...new Map(raw.map((t) => [normalize(t), t.trim()])).values()];
}

// Un marqueur de tome colle au titre signe une release de l'oeuvre elle-meme.
const VOLUME_MARKER_RE = /^(?:\[|\(|t\s*\d|tomes?\b|vol\b|volumes?\b|integrale?|collection\b)/i;

export function filterMangaReleases(torrents: C411Torrent[], nTitles: string[]): MangaRelease[] {
  const releases: MangaRelease[] = [];
  for (const t of torrents) {
    const nName = normalize(t.name);
    const matched = nTitles.find((nt) => nName === nt || nName.startsWith(`${nt} `));
    if (!matched) continue;
    const parsed = parseMangaName(t.name);
    releases.push({
      infoHash: t.infoHash,
      torrentName: t.name,
      span: parsed.span,
      format: parsed.format,
      size: t.size,
      seeders: t.seeders,
      exact: VOLUME_MARKER_RE.test(nName.slice(matched.length).trim()),
    });
  }
  return releases;
}

/**
 * Tri d'affichage : les releases de l'oeuvre elle-meme avant les derives, puis
 * les lots les plus complets, puis les mieux seedes.
 */
export function sortMangaReleases(releases: MangaRelease[]): MangaRelease[] {
  return [...releases].sort(
    (a, b) =>
      Number(b.exact) - Number(a.exact) ||
      spanSize(b.span) - spanSize(a.span) ||
      b.seeders - a.seeders,
  );
}

export function mangaReleasesQueryKey(mangaId: string) {
  return ["manga-releases", mangaId] as const;
}

/**
 * Recherche C411 restreinte a la sous-categorie manga, une requete par titre
 * candidat, dedupliquee par infoHash. Le meme schema que searchC411 cote
 * films : les erreurs remontent telles quelles pour que NetworkErrorState
 * puisse les afficher.
 */
export async function searchMangaReleases(
  item: MangaItem,
  aliases: string[],
  c411Key: string,
): Promise<{ releases: MangaRelease[]; titles: string[] }> {
  const titles = candidateTitles(item, aliases);
  const results = await Promise.allSettled(
    titles.map((name) => {
      const params = {
        name,
        page: 1,
        perPage: 50,
        sortBy: "seeders",
        sortOrder: "desc" as const,
        subcategory: MANGA_SUBCATEGORY,
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

  const releases = sortMangaReleases(
    filterMangaReleases([...byHash.values()], titles.map(normalize)),
  );
  return { releases, titles };
}

/** Recherche libre sur la sous-categorie manga, pour l'arbitrage manuel. */
export async function searchMangaByName(query: string, c411Key: string): Promise<MangaRelease[]> {
  const params = {
    name: query,
    page: 1,
    perPage: 50,
    sortBy: "seeders",
    sortOrder: "desc" as const,
    subcategory: MANGA_SUBCATEGORY,
  };
  const res = await queryClient.fetchQuery({
    queryKey: c411Keys.search(params),
    queryFn: () => searchTorrents(params, c411Key),
    staleTime: 60_000,
  });
  return res.data.map((t) => {
    const parsed = parseMangaName(t.name);
    return {
      infoHash: t.infoHash,
      torrentName: t.name,
      span: parsed.span,
      format: parsed.format,
      size: t.size,
      seeders: t.seeders,
      exact: true,
    };
  });
}
