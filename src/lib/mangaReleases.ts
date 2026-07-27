import type { C411Torrent } from "@/lib/c411";
import type { MangaItem } from "@/lib/mangaItem";
import { normalize } from "@/lib/normalizeTitle";
import { rootTitle } from "@/lib/mangaTitleRoot";
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
  /** Le nom ne matche que la racine du titre, pas un titre complet connu. */
  root: boolean;
}

/** Un titre a essayer sur C411, et s'il s'agit d'une racine deduite. */
export interface TitleCandidate {
  title: string;
  root: boolean;
}

/**
 * Titres a essayer sur C411 pour une oeuvre : le titre francais d'abord (les
 * releases C411 portent le titre de l'edition francaise), puis anglais et
 * romaji, puis les alias valides par l'utilisateur, et enfin leurs racines
 * sans sous-titre. Dedupliques sur leur forme normalisee, un titre complet
 * l'emportant sur une racine identique.
 */
export function candidateTitles(item: MangaItem, aliases: string[] = []): TitleCandidate[] {
  const full = [item.titleFr, item.titleEn, item.titleRomaji, ...aliases]
    .filter((t): t is string => !!t && t.trim().length > 0)
    .map((t) => t.trim());
  const roots = full.map(rootTitle).filter((t): t is string => t !== null);

  const byNormalized = new Map<string, TitleCandidate>();
  for (const title of full) byNormalized.set(normalize(title), { title, root: false });
  for (const title of roots) {
    const n = normalize(title);
    if (!byNormalized.has(n)) byNormalized.set(n, { title, root: true });
  }
  return [...byNormalized.values()];
}

// Un marqueur de tome colle au titre signe une release de l'oeuvre elle-meme.
const VOLUME_MARKER_RE = /^(?:\[|\(|t\s*\d|tomes?\b|vol\b|volumes?\b|integrale?|collection\b)/i;

export function filterMangaReleases(
  torrents: C411Torrent[],
  candidates: TitleCandidate[],
): MangaRelease[] {
  const normalized = candidates.map((c) => ({ n: normalize(c.title), root: c.root }));
  const releases: MangaRelease[] = [];
  for (const t of torrents) {
    const nName = normalize(t.name);
    // Le prefixe le plus long gagne : "Mushoku Tensei Nouvelle Vie T05" doit
    // etre rattache au titre complet, pas a sa racine, sinon le marqueur de
    // tome n'est pas reconnu et la release passe pour un derive.
    const matched = normalized
      .filter((c) => nName === c.n || nName.startsWith(`${c.n} `))
      .sort((a, b) => b.n.length - a.n.length)[0];
    if (!matched) continue;
    const parsed = parseMangaName(t.name);
    releases.push({
      infoHash: t.infoHash,
      torrentName: t.name,
      span: parsed.span,
      format: parsed.format,
      size: t.size,
      seeders: t.seeders,
      exact: VOLUME_MARKER_RE.test(nName.slice(matched.n.length).trim()),
      root: matched.root,
    });
  }
  return releases;
}

/**
 * Rang d'affichage : un tome rattache a un titre complet passe devant le meme
 * tome rattache a une simple racine, lui-meme devant les derives (titre suivi
 * d'autre chose qu'un marqueur de tome).
 */
function rank(r: MangaRelease): number {
  if (!r.exact) return 0;
  return r.root ? 1 : 2;
}

/**
 * Tri d'affichage : les releases de l'oeuvre elle-meme avant les derives, puis
 * les lots les plus complets, puis les mieux seedes.
 */
export function sortMangaReleases(releases: MangaRelease[]): MangaRelease[] {
  return [...releases].sort(
    (a, b) => rank(b) - rank(a) || spanSize(b.span) - spanSize(a.span) || b.seeders - a.seeders,
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
  const candidates = candidateTitles(item, aliases);
  const results = await Promise.allSettled(
    candidates.map(({ title }) => {
      const params = {
        name: title,
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

  const releases = sortMangaReleases(filterMangaReleases([...byHash.values()], candidates));
  return { releases, titles: candidates.map((c) => c.title) };
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
      root: false,
    };
  });
}
