import {
  MAX_POOL_PAGE,
  POOL_MIN,
  pickPoolPage,
  reachablePool,
  usablePool,
} from "@/lib/roulettePool";
import {
  WORST_MAX_PAGE,
  WORST_POOL_SIZE,
  letterboxdPool,
  type RouletteSource,
} from "@/lib/rouletteSource";
import {
  discoverByGenres,
  discoverWorst,
  tmdbKeys,
  type TmdbListResponse,
} from "@/lib/services/tmdb";
import { cachedTmdb } from "@/lib/tmdbCache";
import type { TmdbItem } from "@/lib/tmdbItem";

type PageFetcher = (page: number) => Promise<TmdbListResponse>;

// Les deux viviers TMDB ne different que par leur requete et leur profondeur.
function pageFetcher(source: RouletteSource, genreIds: number[], apiKey: string): PageFetcher {
  return source === "worst"
    ? (page) => cachedTmdb(tmdbKeys.worst(page), () => discoverWorst(page, apiKey))
    : (page) =>
        cachedTmdb(tmdbKeys.roulette(genreIds, page), () =>
          discoverByGenres(genreIds, page, apiKey),
        );
}

function maxPageOf(source: RouletteSource): number {
  return source === "worst" ? WORST_MAX_PAGE : MAX_POOL_PAGE;
}

// Deux pages consecutives, soit ~40 films apres filtrage : assez pour que le
// ruban ne tourne pas sur les memes jaquettes. Trop court (vivier de niche), on
// retombe sur la page 1, la plus fournie.
async function samplePages(fetchPage: PageFetcher, maxPage: number): Promise<TmdbItem[]> {
  const first = await fetchPage(1);
  const page = pickPoolPage(first.total_pages, Math.random(), maxPage);
  const [a, b] =
    page === 1
      ? [first, await fetchPage(2)]
      : await Promise.all([fetchPage(page), fetchPage(page + 1)]);

  const pool = usablePool([...a.results, ...b.results]);
  return pool.length >= POOL_MIN ? pool : usablePool(first.results);
}

export function loadVivier(
  source: RouletteSource,
  genreIds: number[],
  apiKey: string,
): Promise<TmdbItem[]> {
  if (source === "letterboxd") return Promise.resolve(letterboxdPool());
  return samplePages(pageFetcher(source, genreIds, apiKey), maxPageOf(source));
}

export interface VivierPreview {
  count: number;
  preview: TmdbItem[];
}

// La page 1 sert au compteur et a l'apercu, et le tirage la relit depuis le
// cache : changer de genre ne coute pas de requete supplementaire. Reserve aux
// viviers TMDB, celui de Letterboxd etant deja en memoire.
export async function loadPreview(
  source: Exclude<RouletteSource, "letterboxd">,
  genreIds: number[],
  apiKey: string,
): Promise<VivierPreview> {
  const first = await pageFetcher(source, genreIds, apiKey)(1);
  const count =
    source === "worst"
      ? Math.min(first.total_results, WORST_POOL_SIZE)
      : reachablePool(first.total_pages, first.total_results);
  return { count, preview: usablePool(first.results) };
}
