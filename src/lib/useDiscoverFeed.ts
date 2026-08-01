import { NetworkError } from "@/lib/networkError";
import { queryClient } from "@/lib/queryClient";
import {
  ANIMATION_GENRE_ID,
  tmdbKeys,
  type TmdbRawResult,
  type TmdbListResponse,
  type TmdbFeed,
  feed as tmdbFeed,
  search as tmdbSearch,
  discoverAnimation as tmdbDiscoverAnimation,
  searchMulti as tmdbSearchMulti,
  findByImdb as tmdbFindByImdb,
} from "@/lib/services/tmdb";
import { LETTERBOXD_FEED, LETTERBOXD_TOTAL_PAGES, letterboxdPage } from "@/lib/letterboxdFeed";
import { cachedTmdb } from "@/lib/tmdbCache";
import { mapTmdb, type MediaType, type TmdbItem } from "@/lib/tmdbItem";
import { useEffect, useRef, useState, type FormEvent } from "react";

// "all" = état de recherche générale (multi films + séries). Ce n'est pas un
// onglet cliquable : les onglets restent dédiés à la navigation de découverte.
export type BrowseType = MediaType | "animation" | "all";
export type DiscoverTab = BrowseType | "likes" | "recos" | "manga";

// Sources proposées sous les onglets Films / Séries, dans l'ordre d'affichage.
// "letterboxd" n'est pas une source TMDB : c'est le classement figé du bundle,
// réservé à l'onglet Films (voir feedsFor).
export type DiscoverFeed = TmdbFeed | typeof LETTERBOXD_FEED;
export const FEED_LABELS: Record<DiscoverFeed, string> = {
  top_rated: "Mieux notés",
  trending: "Tendances",
  now_playing: "Sorties récentes",
  letterboxd: "Top Letterboxd",
};
export const FEEDS = Object.keys(FEED_LABELS) as DiscoverFeed[];

export function feedsFor(type: DiscoverTab): DiscoverFeed[] {
  return type === "movie" ? FEEDS : FEEDS.filter((f) => f !== LETTERBOXD_FEED);
}

// Filtres d'affinage de la recherche générale : "all" garde le multi
// films + séries, movie/tv relancent la recherche sur l'endpoint dédié.
export type SearchFilter = MediaType | "all";
export const SEARCH_FILTER_LABELS: Record<SearchFilter, string> = {
  all: "Tout",
  movie: "Films",
  tv: "Séries",
};
export const SEARCH_FILTERS = Object.keys(SEARCH_FILTER_LABELS) as SearchFilter[];

// Live-search de la grille : la recherche se lance pendant la frappe (debounce),
// les resultats remplissent le quadrillage des jaquettes. Passer sous le seuil
// restaure le feed de navigation en cours.
const LIVE_SEARCH_MIN = 3;
const LIVE_SEARCH_DEBOUNCE_MS = 300;

const IMDB_ID_RE = /^tt\d{5,10}$/i;

// L'onglet Animations fusionne deux listes TMDB (films + séries). Sur "Mieux
// notés" la note donne un ordre global cohérent ; sur les autres sources l'ordre
// TMDB de chaque liste fait foi, on les entrelace pour ne pas afficher tous les
// films puis toutes les séries.
function mergeAnimation(movies: TmdbItem[], tvs: TmdbItem[], f: TmdbFeed): TmdbItem[] {
  if (f === "top_rated") return [...movies, ...tvs].sort((a, b) => b.voteAverage - a.voteAverage);
  const out: TmdbItem[] = [];
  for (let i = 0; i < Math.max(movies.length, tvs.length); i++) {
    if (movies[i]) out.push(movies[i]);
    if (tvs[i]) out.push(tvs[i]);
  }
  return out;
}

// Lecture synchrone du cache TanStack pour une source "top" (préchauffée au
// démarrage par useAppInit). Renvoie null si froid → l'appelant retombe sur un
// fetch réseau. Évite le flash de spinner et le re-render asynchrone au switch.
// Repli TMDB des sources non-TMDB : les onglets Séries / Animations n'exposent
// pas "Top Letterboxd", et la recherche générale ignore la source courante.
function tmdbFeedOf(f: DiscoverFeed): TmdbFeed {
  return f === LETTERBOXD_FEED ? "top_rated" : f;
}

function readTopFromCache(
  type: MediaType | "animation",
  feed: DiscoverFeed,
): { items: TmdbItem[]; totalPages: number } | null {
  const f = tmdbFeedOf(feed);
  if (type === "animation") {
    const movies = queryClient.getQueryData<TmdbListResponse>(
      tmdbKeys.discoverAnimation(f, "movie", 1),
    );
    const tvs = queryClient.getQueryData<TmdbListResponse>(tmdbKeys.discoverAnimation(f, "tv", 1));
    if (!movies || !tvs) return null;
    return {
      items: mergeAnimation(
        movies.results.map((r) => mapTmdb(r, "movie")),
        tvs.results.map((r) => mapTmdb(r, "tv")),
        f,
      ),
      totalPages: Math.max(movies.total_pages, tvs.total_pages),
    };
  }
  const cached = queryClient.getQueryData<TmdbListResponse>(tmdbKeys.feed(f, type, 1));
  if (!cached) return null;
  return {
    items: cached.results.map((r) => mapTmdb(r, type)),
    totalPages: cached.total_pages,
  };
}

// État de la grille Découverte : feed de navigation (onglets + sources),
// recherche générale live et scroll infini.
export function useDiscoverFeed(
  tmdbKey: string | null | undefined,
  initialQuery?: string,
  initialTab?: DiscoverTab,
) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [mediaType, setMediaType] = useState<DiscoverTab>(initialTab ?? "movie");
  const [feed, setFeed] = useState<DiscoverFeed>("top_rated");
  const [items, setItems] = useState<TmdbItem[]>([]);
  const [mode, setMode] = useState<"top" | "search">("top");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  // Filtre des résultats actuellement affichés : mis à jour quand la réponse
  // arrive (comme searchedQuery), pour que la grille n'anime qu'une fois.
  const [searchedFilter, setSearchedFilter] = useState<SearchFilter>("all");
  const [tmdbPage, setTmdbPage] = useState(1);
  const [tmdbTotalPages, setTmdbTotalPages] = useState(1);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [moviesError, setMoviesError] = useState<string | null>(null);
  // Clé présente mais refusée par TMDB (401) : même écran que la clé
  // manquante, avec un message adapté, au lieu d'une erreur brute dans la grille.
  const [tmdbKeyInvalid, setTmdbKeyInvalid] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  // Numéro de la dernière requête de grille : les réponses d'une requête
  // dépassée (frappe rapide, réseau lent) sont ignorées au lieu d'écraser
  // les résultats plus récents.
  const fetchSeqRef = useRef(0);
  // Dernier onglet de navigation choisi : sert à revenir au bon feed quand on
  // efface une recherche générale (qui, elle, n'est rattachée à aucun onglet).
  const lastBrowseTypeRef = useRef<MediaType | "animation">("movie");

  // Live-search : chaque frappe relance la recherche generale (debounce) et
  // remplit la grille. Sous le seuil, on restaure le feed de navigation.
  useEffect(() => {
    if (!tmdbKey) return;
    const q = query.trim();
    if (q.length >= LIVE_SEARCH_MIN) {
      // Deja affiche (recherche en cours ou terminee) : rien a relancer.
      if (mode === "search" && q === searchedQuery) return;
      const t = setTimeout(() => startGeneralSearch(q), LIVE_SEARCH_DEBOUNCE_MS);
      return () => clearTimeout(t);
    }
    if (mode === "search") {
      restoreBrowse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tmdbKey, mode, searchedQuery, feed]);

  // Scroll infini : charge la page suivante quand la sentinelle entre dans le
  // viewport. Le garde `loadingMovies` évite les déclenchements multiples (la
  // requête en cours coupe l'observer, qui se reconnecte une fois finie).
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !tmdbKey || mediaType === "likes" || mediaType === "recos" || mediaType === "manga")
      return;
    if (loadingMovies || items.length === 0 || tmdbPage >= tmdbTotalPages) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchItems(
            mode,
            searchedQuery,
            tmdbPage + 1,
            mode === "search" ? searchFilter : mediaType,
            feed,
          );
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tmdbKey,
    mediaType,
    feed,
    mode,
    searchedQuery,
    searchFilter,
    loadingMovies,
    tmdbPage,
    tmdbTotalPages,
    items.length,
  ]);

  // Affiche une source "top" depuis le cache si elle est chaude (cas normal,
  // préchauffé au démarrage) — sans spinner ni round-trip async. Sinon fetch.
  function showTop(type: MediaType | "animation", f: DiscoverFeed) {
    setSearchFilter("all");
    // Classement Letterboxd : servi depuis le bundle, fetchItems le résout
    // sans réseau ni cache TanStack.
    if (f === LETTERBOXD_FEED) {
      fetchItems("top", "", 1, type, f);
      return;
    }
    const cached = readTopFromCache(type, f);
    if (!cached) {
      fetchItems("top", "", 1, type, f);
      return;
    }
    // Invalide les requêtes en vol : une recherche lente ne doit pas écraser
    // le feed qu'on vient de restaurer.
    fetchSeqRef.current++;
    setLoadingMovies(false);
    setItems(cached.items);
    setMode("top");
    setSearchedQuery("");
    setTmdbPage(1);
    setTmdbTotalPages(cached.totalPages);
    setMoviesError(null);
  }

  async function fetchItems(
    m: "top" | "search",
    q: string,
    page: number,
    type: BrowseType,
    feedArg: DiscoverFeed,
  ) {
    // Classement figé : pas de requête, la page est une tranche du bundle. La
    // recherche, elle, reste TMDB quelle que soit la source affichée.
    if (m === "top" && feedArg === LETTERBOXD_FEED) {
      fetchSeqRef.current++;
      const slice = letterboxdPage(page);
      setItems((prev) => (page === 1 ? slice : [...prev, ...slice]));
      setLoadingMovies(false);
      setMode("top");
      setSearchedQuery("");
      setTmdbPage(page);
      setTmdbTotalPages(LETTERBOXD_TOTAL_PAGES);
      setMoviesError(null);
      return;
    }
    if (!tmdbKey) return;
    const key = tmdbKey;
    const f = tmdbFeedOf(feedArg);
    const seq = ++fetchSeqRef.current;
    setLoadingMovies(true);
    setMoviesError(null);
    try {
      let mapped: TmdbItem[];
      let totalPages: number;
      if (m === "search" && IMDB_ID_RE.test(q)) {
        const found = await cachedTmdb(tmdbKeys.find(q), () => tmdbFindByImdb(q, key));
        mapped =
          type === "tv"
            ? found.tv_results.map((r) => mapTmdb(r, "tv"))
            : type === "movie"
              ? found.movie_results.map((r) => mapTmdb(r, "movie"))
              : [
                  ...found.movie_results.map((r) => mapTmdb(r, "movie")),
                  ...found.tv_results.map((r) => mapTmdb(r, "tv")),
                ];
        totalPages = 1;
      } else if (m === "search" && type === "all") {
        // Recherche générale : films + séries mélangés en un appel, on écarte
        // les résultats "person".
        const list = await cachedTmdb(tmdbKeys.searchMulti(q, page), () =>
          tmdbSearchMulti(q, page, key),
        );
        mapped = list.results
          .filter((r) => r.media_type === "movie" || r.media_type === "tv")
          .map((r) => mapTmdb(r, r.media_type as MediaType));
        totalPages = list.total_pages;
      } else if (type === "animation") {
        const fetchFor = (mt: MediaType) =>
          m === "search"
            ? cachedTmdb(tmdbKeys.search(mt, q, page), () => tmdbSearch(mt, q, page, key))
            : cachedTmdb(tmdbKeys.discoverAnimation(f, mt, page), () =>
                tmdbDiscoverAnimation(f, mt, page, key),
              );
        const [movies, tvs] = await Promise.all([fetchFor("movie"), fetchFor("tv")]);
        const animOnly = (rs: TmdbRawResult[]) =>
          m === "search" ? rs.filter((r) => r.genre_ids?.includes(ANIMATION_GENRE_ID)) : rs;
        mapped = mergeAnimation(
          animOnly(movies.results).map((r) => mapTmdb(r, "movie")),
          animOnly(tvs.results).map((r) => mapTmdb(r, "tv")),
          m === "search" ? "top_rated" : f,
        );
        totalPages = Math.max(movies.total_pages, tvs.total_pages);
      } else {
        // "all" et "animation" sont traités plus haut : ici type vaut movie|tv.
        const mt = type as MediaType;
        const list =
          m === "search"
            ? await cachedTmdb(tmdbKeys.search(mt, q, page), () => tmdbSearch(mt, q, page, key))
            : await cachedTmdb(tmdbKeys.feed(f, mt, page), () => tmdbFeed(f, mt, page, key));
        mapped = list.results.map((r) => mapTmdb(r, mt));
        totalPages = list.total_pages;
      }
      if (seq !== fetchSeqRef.current) return;
      setItems((prev) => (page === 1 ? mapped : [...prev, ...mapped]));
      setMode(m);
      setSearchedQuery(q);
      if (m === "search") setSearchedFilter(type as SearchFilter);
      setTmdbPage(page);
      setTmdbTotalPages(totalPages);
    } catch (err) {
      if (seq !== fetchSeqRef.current) return;
      if (err instanceof NetworkError && err.service === "TMDB" && err.status === 401) {
        setTmdbKeyInvalid(true);
      } else {
        setMoviesError(String(err));
      }
    } finally {
      if (seq === fetchSeqRef.current) setLoadingMovies(false);
    }
  }

  // Recherche générale (films + séries mélangés), quel que soit l'onglet.
  // Le filtre d'affinage en cours est conservé quand on continue de taper.
  function startGeneralSearch(q: string) {
    setMediaType("all");
    fetchItems("search", q, 1, searchFilter, feed);
  }

  // Affine la recherche affichée : movie/tv relancent sur l'endpoint dédié,
  // "all" revient au multi. Les résultats sont déjà en cache TanStack au retour.
  function changeSearchFilter(f: SearchFilter) {
    if (f === searchFilter || !tmdbKey || mode !== "search") return;
    setSearchFilter(f);
    fetchItems("search", searchedQuery, 1, f, feed);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tmdbKey) return;
    const q = query.trim();
    if (!q) return;
    startGeneralSearch(q);
  }

  // Retour au feed du dernier onglet de navigation choisi.
  function restoreBrowse() {
    const back = lastBrowseTypeRef.current;
    setMediaType(back);
    showTop(back, feed);
  }

  function clearSearch() {
    setQuery("");
    if (mode === "search") restoreBrowse();
  }

  function switchType(type: Exclude<DiscoverTab, "all">) {
    // L'onglet Mangas ne dépend pas de TMDB : il reste accessible sans clé.
    if (type === mediaType || (!tmdbKey && type !== "manga")) return;
    setMediaType(type);
    if (type === "likes" || type === "recos" || type === "manga") return;
    // Onglet de navigation : on quitte toujours la recherche pour parcourir le
    // feed de découverte de la catégorie (la recherche, elle, reste générale).
    lastBrowseTypeRef.current = type;
    setQuery("");
    // "Top Letterboxd" n'existe que pour les films : les autres onglets
    // repartent sur la source TMDB par défaut.
    const next = type === "movie" ? feed : tmdbFeedOf(feed);
    if (next !== feed) setFeed(next);
    showTop(type, next);
  }

  // Change la source (Tendances, Populaires…) — onglets Films / Séries / Animations.
  function switchFeed(f: DiscoverFeed) {
    if (
      f === feed ||
      !tmdbKey ||
      mediaType === "likes" ||
      mediaType === "recos" ||
      mediaType === "manga" ||
      mediaType === "all"
    )
      return;
    setFeed(f);
    setQuery("");
    showTop(mediaType, f);
  }

  // Onglets "feed" (recherche + scroll infini + sources) vs onglets curatifs
  // (Ma liste, Pour vous) qui affichent une liste deja constituee.
  const feedMode =
    mediaType === "movie" || mediaType === "tv" || mediaType === "animation" || mediaType === "all";

  // Dès la première frappe, la navigation (onglets + sources) se replie sous la
  // barre ; les filtres d'affinage la remplacent une fois les résultats affichés.
  const searchUiActive = query.trim().length > 0 || mode === "search";

  // Signature de la vue courante : le fond de grille se croise en fondu quand on
  // passe du feed aux resultats ou qu'on change de filtre d'affinage. Affiner la
  // requete au fil de la frappe garde la meme cle : les resultats se remplacent
  // en place, sans rejouer la transition de toute la grille a chaque debounce.
  const gridKey =
    mediaType === "likes" || mediaType === "manga"
      ? mediaType
      : mediaType === "recos"
        ? "recos"
        : mode === "search"
          ? `search:${searchedFilter}`
          : `${mediaType}:${feed}`;

  return {
    query,
    setQuery,
    mediaType,
    feed,
    items,
    mode,
    searchedQuery,
    searchFilter,
    tmdbPage,
    tmdbTotalPages,
    loadingMovies,
    moviesError,
    tmdbKeyInvalid,
    loadMoreRef,
    feedMode,
    searchUiActive,
    gridKey,
    showTop,
    startGeneralSearch,
    changeSearchFilter,
    handleSubmit,
    clearSearch,
    switchType,
    switchFeed,
  };
}
