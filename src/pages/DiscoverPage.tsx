import vlcLogo from "@/assets/vlc.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeMenuItem } from "@/components/ThemeMenuItem";
import { getApiKey } from "@/lib/apiKeys";
import { getLikes, saveLikes, type LikedItem } from "@/lib/likes";
import { parseRelease } from "@/lib/parseRelease";
import { flattenFiles, formatSize, type DebridModal } from "@/lib/debrid";
import type { C411Torrent } from "@/lib/c411";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { c411Keys, searchTorrents } from "@/lib/services/c411";
import { useDebridActions } from "@/lib/useDebridActions";
import {
  ANIMATION_GENRE_ID,
  tmdbKeys,
  type TmdbRawResult,
  topRated as tmdbTopRated,
  search as tmdbSearch,
  discoverAnimation as tmdbDiscoverAnimation,
  findByImdb as tmdbFindByImdb,
  tvDetail as tmdbTvDetail,
} from "@/lib/services/tmdb";
import { invoke } from "@tauri-apps/api/core";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Clapperboard,
  Copy,
  Download,
  Heart,
  Home,
  KeyRound,
  Loader2,
  Magnet,
  Menu,
  ScrollText,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tv,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type MediaType = "movie" | "tv";
type BrowseType = MediaType | "animation";
type DiscoverTab = BrowseType | "likes";

// Les listes TMDB bougent peu : cache 10 min pour couper les refetch au
// changement d'onglet / retour sur une recherche deja vue.
const TMDB_STALE_MS = 10 * 60_000;
function cachedTmdb<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
): Promise<T> {
  return queryClient.fetchQuery({ queryKey, queryFn, staleTime: TMDB_STALE_MS });
}

interface TmdbItem {
  id: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  posterPath: string | null;
  year: string;
  voteAverage: number;
  overview: string;
}

function mapTmdb(r: TmdbRawResult, mediaType: MediaType): TmdbItem {
  return {
    id: r.id,
    mediaType,
    title: (mediaType === "movie" ? r.title : r.name) ?? "",
    originalTitle:
      (mediaType === "movie" ? r.original_title : r.original_name) ?? "",
    posterPath: r.poster_path,
    year:
      (mediaType === "movie" ? r.release_date : r.first_air_date)?.slice(
        0,
        4,
      ) ?? "",
    voteAverage: r.vote_average,
    overview: r.overview ?? "",
  };
}

interface TmdbSeason {
  number: number;
  episodeCount: number;
}

interface Occupant {
  infoHash: string;
  languages: string[];
  fileSize: number;
  seeders: number;
  source: string | null;
  videoCodec: string | null;
  audioCodec: string | null;
  audioChannels: string | null;
  resolution: string | null;
  torrentName: string;
  specialVersion: string | null;
}

const SERIES_SLUGS = new Set([
  "serie-tv",
  "serie-documentaire",
  "emission-tv",
  "animation-serie",
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const LANG_TOKENS = [
  "MULTI",
  "VFF",
  "VFQ",
  "VF2",
  "VOSTFR",
  "TRUEFRENCH",
  "FRENCH",
  "VF",
  "VO",
];

function parseLanguages(name: string): string[] {
  const up = ` ${name.toUpperCase().replace(/[._-]/g, " ")} `;
  return LANG_TOKENS.filter((t) => up.includes(` ${t} `));
}

const SOURCE_RE =
  /\b(remux|blu-?ray|bdrip|brrip|web-?dl|webrip|web|hdtv|dvdrip|hdlight)\b/i;
const SOURCE_LABELS: Record<string, string> = {
  remux: "REMUX",
  bluray: "BluRay",
  bdrip: "BDRip",
  brrip: "BRRip",
  webdl: "WEB-DL",
  webrip: "WEBRip",
  web: "WEB",
  hdtv: "HDTV",
  dvdrip: "DVDRip",
  hdlight: "HDLight",
};
const SPECIAL_RE =
  /\b(extended|remastered|unrated|imax|uncut|director'?s[ ._-]?cut)\b/i;
const AUDIO_RE =
  /\b(dts[ ._-]?hd[ ._-]?ma|dts|truehd|atmos|eac3|ddp|ac3|aac|flac|opus)\b/i;
const CHANNELS_RE = /\b(7\.1|5\.1|2\.0)\b/;

function toOccupant(t: C411Torrent): Occupant {
  const flat = t.name.replace(/[._]/g, " ");
  const parsed = parseRelease(t.name);
  const sourceMatch = flat.match(SOURCE_RE)?.[1];
  return {
    infoHash: t.infoHash,
    torrentName: t.name,
    fileSize: t.size,
    seeders: t.seeders,
    resolution: parsed.quality,
    videoCodec: parsed.codec,
    languages: parseLanguages(t.name),
    source: sourceMatch
      ? SOURCE_LABELS[sourceMatch.toLowerCase().replace(/[^a-z]/g, "")]
      : null,
    audioCodec:
      flat.match(AUDIO_RE)?.[1].toUpperCase().replace(/[._-]/g, " ") ?? null,
    audioChannels: flat.match(CHANNELS_RE)?.[1] ?? null,
    specialVersion: flat.match(SPECIAL_RE)?.[1].toUpperCase() ?? null,
  };
}

const RESOLUTION_RANK: Record<string, number> = {
  "4320p": 5,
  "4K": 4,
  "2160p": 4,
  "1080p": 3,
  "720p": 2,
  "480p": 1,
};

const IMDB_ID_RE = /^tt\d{5,10}$/i;

function sortOccupants(occupants: Occupant[]): Occupant[] {
  return [...occupants].sort(
    (a, b) =>
      (RESOLUTION_RANK[b.resolution ?? ""] ?? 0) -
        (RESOLUTION_RANK[a.resolution ?? ""] ?? 0) || b.fileSize - a.fileSize,
  );
}

function filterMovieReleases(
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
    if (item.year && !nName.includes(item.year) && !nName.includes(nextYear))
      continue;
    occupants.push(toOccupant(t));
  }
  return occupants;
}

function filterTvReleases(
  torrents: C411Torrent[],
  nTitles: string[],
  season: number | null,
): Occupant[] {
  // Matche "S01", "S01E05", "Saison 1", ou une integrale sans numero de saison
  const seasonRe =
    season !== null
      ? new RegExp(
          `\\bs0*${season}(?:e\\d+)?\\b|\\bsaison 0*${season}\\b|\\bseason 0*${season}\\b`,
        )
      : null;
  const anySeasonRe = /\bs\d{1,2}(?:e\d+)?\b|\bsaison \d+\b|\bseason \d+\b/;
  const completeRe = /\bintegrale\b|\bcomplete\b|\bcomplet\b/;
  const occupants: Occupant[] = [];
  for (const t of torrents) {
    if (t.category?.id !== 1) continue;
    if (!SERIES_SLUGS.has(t.subcategory?.slug ?? "")) continue;
    const nName = normalize(t.name);
    if (!nTitles.some((nt) => nName.includes(nt))) continue;
    if (
      seasonRe &&
      !seasonRe.test(nName) &&
      !(completeRe.test(nName) && !anySeasonRe.test(nName))
    )
      continue;
    occupants.push(toOccupant(t));
  }
  return occupants;
}

interface DiscoverPageProps {
  onBack: () => void;
  onNavigate: (page: "magnets" | "preferences" | "patchnotes") => void;
  summerEnabled: boolean;
  /** Clé TMDB pré-chargée par useAppInit */
  initialTmdbKey?: string | null;
  /** Clés C411 et AllDebrid pré-chargées par useAppInit */
  initialC411Key?: string | null;
  initialAllDebridKey?: string | null;
  /** Likes pré-chargés par useAppInit */
  initialLikes?: LikedItem[];
}

export function DiscoverPage({
  onBack,
  onNavigate,
  summerEnabled,
  initialTmdbKey,
  initialC411Key,
  initialAllDebridKey,
  initialLikes,
}: DiscoverPageProps) {
  const [tmdbKey, setTmdbKey] = useState<string | null | undefined>(
    initialTmdbKey !== undefined ? initialTmdbKey : undefined,
  );
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<DiscoverTab>("movie");
  const [likes, setLikes] = useState<LikedItem[]>(initialLikes ?? []);
  const [items, setItems] = useState<TmdbItem[]>([]);
  const [mode, setMode] = useState<"top" | "search">("top");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [tmdbPage, setTmdbPage] = useState(1);
  const [tmdbTotalPages, setTmdbTotalPages] = useState(1);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [moviesError, setMoviesError] = useState<string | null>(null);

  const [selected, setSelected] = useState<TmdbItem | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [releaseSort, setReleaseSort] = useState<
    "seeders" | "size" | "resolution"
  >("seeders");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [resFilter, setResFilter] = useState<string | null>(null);
  const [langFilter, setLangFilter] = useState<string | null>(null);

  const [sendingHash, setSendingHash] = useState<string | null>(null);
  const [debridModal, setDebridModal] = useState<DebridModal | null>(null);

  const c411KeyRef = useRef<string>(initialC411Key ?? "");
  const allDebridKeyRef = useRef<string>(initialAllDebridKey ?? "");

  const {
    downloadingLink,
    copiedLink,
    vlcLink,
    copyLink: handleCopyLink,
    openVlc: handleOpenVlc,
    downloadFile: handleDownloadFile,
  } = useDebridActions(() => allDebridKeyRef.current);
  const prefersReducedMotion = useReducedMotion();

  // Detail TV (saisons) : sert a peupler le selecteur de saison et a defaut
  // d'une saison choisie, la premiere.
  const tvDetailQuery = useQuery({
    queryKey: tmdbKeys.tvDetail(selected?.id ?? 0),
    enabled: !!selected && selected.mediaType === "tv",
    staleTime: TMDB_STALE_MS,
    queryFn: () => tmdbTvDetail(selected!.id, tmdbKey!),
  });

  const seasons = useMemo<TmdbSeason[] | null>(() => {
    if (selected?.mediaType !== "tv" || !tvDetailQuery.data) return null;
    return (tvDetailQuery.data.seasons ?? [])
      .filter((s) => s.season_number > 0)
      .map((s) => ({ number: s.season_number, episodeCount: s.episode_count }));
  }, [selected, tvDetailQuery.data]);

  const activeSeason = selectedSeason ?? seasons?.[0]?.number ?? null;

  // Releases C411 du film / de la saison selectionnee. TanStack gere la course
  // (les resultats perimes sont ignores) et le cache (re-ouverture, switch saison).
  //
  // Pour les series TV, le prefetch C411 est lance dans openItem() en parallele
  // du tvDetailQuery, donc les torrents sont souvent deja en cache quand
  // tvDetailQuery.isSuccess devient true — le waterfall est elimine.
  const releasesQuery = useQuery({
    queryKey: [
      "c411-releases",
      selected?.mediaType,
      selected?.id,
      selected?.mediaType === "tv" ? activeSeason : null,
    ],
    enabled:
      !!selected && (selected.mediaType === "movie" || tvDetailQuery.isSuccess),
    staleTime: 60_000,
    queryFn: async () => {
      const item = selected!;
      const { torrents, nTitles } = await searchC411(item);
      return item.mediaType === "movie"
        ? sortOccupants(filterMovieReleases(torrents, nTitles, item))
        : sortOccupants(filterTvReleases(torrents, nTitles, activeSeason));
    },
  });

  const releases = releasesQuery.data ?? null;
  const releasesError = tvDetailQuery.isError
    ? String(tvDetailQuery.error)
    : releasesQuery.isError
      ? String(releasesQuery.error)
      : null;

  const resOptions = useMemo(
    () =>
      releases
        ? [
            ...new Set(
              releases.map((o) => o.resolution).filter((r): r is string => !!r),
            ),
          ].sort((a, b) => (RESOLUTION_RANK[b] ?? 0) - (RESOLUTION_RANK[a] ?? 0))
        : [],
    [releases],
  );

  const langOptions = useMemo(
    () => (releases ? [...new Set(releases.flatMap((o) => o.languages))] : []),
    [releases],
  );

  const visibleReleases = useMemo(
    () =>
      releases
        ? [...releases]
            .filter(
              (o) =>
                (!resFilter || o.resolution === resFilter) &&
                (!langFilter || o.languages.includes(langFilter)),
            )
            .sort((a, b) => {
              const cmp =
                releaseSort === "size"
                  ? b.fileSize - a.fileSize
                  : releaseSort === "resolution"
                    ? (RESOLUTION_RANK[b.resolution ?? ""] ?? 0) -
                        (RESOLUTION_RANK[a.resolution ?? ""] ?? 0) ||
                      b.seeders - a.seeders
                    : b.seeders - a.seeders;
              return sortDir === "asc" ? -cmp : cmp;
            })
        : null,
    [releases, resFilter, langFilter, releaseSort, sortDir],
  );

  useEffect(() => {
    // Ne re-fetch les clés que si elles n'ont pas été injectées par useAppInit
    if (initialC411Key === undefined) {
      getApiKey("c411_api_key").then((v) => { if (v) c411KeyRef.current = v; });
    }
    if (initialAllDebridKey === undefined) {
      getApiKey("alldebrid_api_key").then((v) => { if (v) allDebridKeyRef.current = v; });
    }
    if (initialTmdbKey === undefined) {
      getApiKey("tmdb_api_key").then((v) => setTmdbKey(v || null));
    }
    if (!initialLikes) {
      getLikes().then(setLikes);
    }
  }, []);

  useEffect(() => {
    if (!tmdbKey) return;
    // Si les données sont déjà dans le cache (prefetchées au démarrage),
    // on les lit directement sans passer par fetchItems (pas de spinner).
    const cached = queryClient.getQueryData(tmdbKeys.topRated("movie", 1));
    if (cached) {
      const list = cached as import("@/lib/services/tmdb").TmdbListResponse;
      setItems(list.results.map((r) => mapTmdb(r, "movie")));
      setMode("top");
      setTmdbPage(1);
      setTmdbTotalPages(list.total_pages);
    } else {
      fetchItems("top", "", 1, tmdbKey, "movie");
    }
  }, [tmdbKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (debridModal) setDebridModal(null);
      else if (selected) closeMovie();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [debridModal, selected]);

  async function fetchItems(
    m: "top" | "search",
    q: string,
    page: number,
    key: string,
    type: BrowseType,
  ) {
    setLoadingMovies(true);
    setMoviesError(null);
    try {
      let mapped: TmdbItem[];
      let totalPages: number;
      if (m === "search" && IMDB_ID_RE.test(q)) {
        const found = await cachedTmdb(tmdbKeys.find(q), () =>
          tmdbFindByImdb(q, key),
        );
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
      } else if (type === "animation") {
        const fetchFor = (mt: MediaType) =>
          m === "search"
            ? cachedTmdb(tmdbKeys.search(mt, q, page), () =>
                tmdbSearch(mt, q, page, key),
              )
            : cachedTmdb(tmdbKeys.discoverAnimation(mt, page), () =>
                tmdbDiscoverAnimation(mt, page, key),
              );
        const [movies, tvs] = await Promise.all([
          fetchFor("movie"),
          fetchFor("tv"),
        ]);
        const animOnly = (rs: TmdbRawResult[]) =>
          m === "search"
            ? rs.filter((r) => r.genre_ids?.includes(ANIMATION_GENRE_ID))
            : rs;
        mapped = [
          ...animOnly(movies.results).map((r) => mapTmdb(r, "movie")),
          ...animOnly(tvs.results).map((r) => mapTmdb(r, "tv")),
        ].sort((a, b) => b.voteAverage - a.voteAverage);
        totalPages = Math.max(movies.total_pages, tvs.total_pages);
      } else {
        const list =
          m === "search"
            ? await cachedTmdb(tmdbKeys.search(type, q, page), () =>
                tmdbSearch(type, q, page, key),
              )
            : await cachedTmdb(tmdbKeys.topRated(type, page), () =>
                tmdbTopRated(type, page, key),
              );
        mapped = list.results.map((r) => mapTmdb(r, type));
        totalPages = list.total_pages;
      }
      setItems((prev) => (page === 1 ? mapped : [...prev, ...mapped]));
      setMode(m);
      setSearchedQuery(q);
      setTmdbPage(page);
      setTmdbTotalPages(totalPages);
    } catch (err) {
      setMoviesError(String(err));
    } finally {
      setLoadingMovies(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tmdbKey || mediaType === "likes") return;
    const q = query.trim();
    if (!q) {
      fetchItems("top", "", 1, tmdbKey, mediaType);
      return;
    }
    fetchItems("search", q, 1, tmdbKey, mediaType);
  }

  function switchType(type: DiscoverTab) {
    if (type === mediaType || !tmdbKey) return;
    setMediaType(type);
    if (type === "likes") return;
    if (mode === "search" && searchedQuery) {
      fetchItems("search", searchedQuery, 1, tmdbKey, type);
    } else {
      fetchItems("top", "", 1, tmdbKey, type);
    }
  }

  const likedKeys = useMemo(
    () => new Set(likes.map((l) => `${l.mediaType}-${l.id}`)),
    [likes],
  );

  function toggleLike(item: TmdbItem) {
    const key = `${item.mediaType}-${item.id}`;
    const next = likedKeys.has(key)
      ? likes.filter((l) => `${l.mediaType}-${l.id}` !== key)
      : [{ ...item, likedAt: Date.now() }, ...likes];
    setLikes(next);
    saveLikes(next);
  }

  function closeMovie() {
    setSelected(null);
    setSelectedSeason(null);
    setReleaseSort("seeders");
    setSortDir("desc");
    setResFilter(null);
    setLangFilter(null);
  }

  // Recherche C411 par titre francais et titre original, dedupliquee par infoHash
  async function searchC411(item: TmdbItem): Promise<{
    torrents: C411Torrent[];
    nTitles: string[];
  }> {
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
          queryFn: () => searchTorrents(params, c411KeyRef.current),
          staleTime: 60_000,
        });
      }),
    );
    const byHash = new Map<string, C411Torrent>();
    for (const r of results) {
      if (r.status === "rejected") throw new Error(r.reason);
      for (const t of r.value.data) {
        if (!byHash.has(t.infoHash)) byHash.set(t.infoHash, t);
      }
    }
    return { torrents: [...byHash.values()], nTitles: queries.map(normalize) };
  }

  // Selection d'un item : les saisons (TV) et les releases sont chargees par
  // les queries reactives ci-dessus, qui reagissent a `selected`/`activeSeason`.
  // Pour les series TV, on lance immediatement un prefetch C411 en fire-and-forget
  // (le titre est connu des maintenant) en parallele du tvDetailQuery TMDB.
  // Quand tvDetailQuery revient et active releasesQuery, les torrents sont
  // souvent deja en cache → affichage quasi-instantane.
  function openItem(item: TmdbItem) {
    setSelected(item);
    setSelectedSeason(null);
    setResFilter(null);
    setLangFilter(null);

    if (item.mediaType === "tv") {
      // Prefetch C411 : saison null = tous les torrents bruts, la saison sera
      // filtree plus tard par releasesQuery.queryFn quand activeSeason est connu.
      // On utilise la meme queryKey que releasesQuery avec saison null pour que
      // le cache soit reutilise directement (la saison par defaut est la 1 et
      // filterTvReleases sera applique dans queryFn une seule fois).
      queryClient.prefetchQuery({
        queryKey: ["c411-releases", item.mediaType, item.id, null],
        queryFn: () => searchC411(item).then(({ torrents, nTitles }) =>
          sortOccupants(filterTvReleases(torrents, nTitles, null))
        ),
        staleTime: 60_000,
      });
    }
  }

  function changeSeason(season: number) {
    if (!selected || season === activeSeason) return;
    setSelectedSeason(season);
    setResFilter(null);
    setLangFilter(null);
  }

  async function handleSendToDebrid(occ: Occupant) {
    if (sendingHash !== null) return;
    if (!allDebridKeyRef.current) {
      toast.error(
        "Cle AllDebrid manquante. Configurez-la dans les parametres.",
      );
      return;
    }
    const torrentUrl = `https://c411.org/api?t=get&id=${encodeURIComponent(occ.infoHash)}&apikey=${c411KeyRef.current}`;

    setSendingHash(occ.infoHash);
    try {
      const json = await invoke<{
        status: string;
        data?: { files?: Array<{ id: number; name: string }> };
        error?: { message: string };
      }>("upload_torrent_to_debrid", {
        torrentUrl,
        alldebridKey: allDebridKeyRef.current,
      });

      if (json.status !== "success")
        throw new Error(json.error?.message ?? "Erreur AllDebrid inconnue");

      const uploaded = json.data?.files?.[0] as
        | { id: number; name: string; ready: boolean }
        | undefined;
      if (!uploaded) throw new Error("Reponse AllDebrid inattendue");

      if (uploaded.ready) {
        const filesJson = await invoke<{
          status: string;
          data?: { magnets?: Array<{ files?: unknown[] }> };
        }>("get_magnet_files", {
          id: uploaded.id,
          alldebridKey: allDebridKeyRef.current,
        });
        const rawFiles = filesJson.data?.magnets?.[0]?.files ?? [];
        const files = flattenFiles(rawFiles);
        setDebridModal({
          torrentName: uploaded.name ?? occ.torrentName,
          files,
        });
      } else {
        toast.success(
          `Envoye vers AllDebrid : ${uploaded.name ?? occ.torrentName} (en cours de debridage)`,
        );
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSendingHash(null);
    }
  }

  return (
    <main
      className={`relative isolate flex min-h-screen flex-col ${
        summerEnabled ? "" : "bg-[#f4f6fc] dark:bg-[#04050c]"
      }`}
    >
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <motion.div
          animate={prefersReducedMotion ? {} : { opacity: [0.7, 1, 0.7], scale: [1, 1.08, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 left-1/2 -translate-x-1/2 h-[440px] w-[700px] rounded-full bg-indigo-600/25 blur-[120px]"
        />
        <div className="absolute top-1/3 -left-40 h-80 w-80 rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="absolute -bottom-24 -right-32 h-96 w-96 rounded-full bg-sky-500/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.10)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_45%_at_50%_22%,black,transparent_75%)]" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/30 backdrop-blur-xl">
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 sm:px-8">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onBack}
            className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </motion.button>

          <h1 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight absolute left-1/2 -translate-x-1/2">
            Découverte
          </h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition-colors"
              >
                <Menu className="h-4 w-4" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onBack}>
                <Home className="mr-2 h-4 w-4" />
                Accueil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate("magnets")}>
                <Magnet className="mr-2 h-4 w-4" />
                Magnets
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate("preferences")}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <ThemeMenuItem />
              <DropdownMenuItem onClick={() => onNavigate("patchnotes")}>
                <ScrollText className="mr-2 h-4 w-4" />
                Patch notes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Missing TMDB key */}
      {tmdbKey === null && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/12 ring-1 ring-indigo-500/25">
            <KeyRound className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              Clé API TMDB manquante
            </p>
            <p className="mt-1 max-w-sm text-xs text-zinc-500 leading-relaxed">
              La page Découverte utilise The Movie Database pour lister les
              films. Créez une clé gratuite sur themoviedb.org puis ajoutez-la
              dans les paramètres.
            </p>
          </div>
          <button
            onClick={() => onNavigate("preferences")}
            className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Ouvrir les paramètres
          </button>
        </div>
      )}

      {tmdbKey && (
        <div className="mx-auto w-full max-w-5xl flex-1 px-6 pt-8 pb-10 sm:px-8">
          {/* Search bar */}
          <motion.form
            initial={false}
            animate={
              mediaType === "likes"
                ? { opacity: 0, y: -12, height: 0, marginBottom: 0 }
                : { opacity: 1, y: 0, height: "auto", marginBottom: 32 }
            }
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 26,
              opacity: { duration: 0.15 },
            }}
            onSubmit={handleSubmit}
            className={`mx-auto max-w-2xl ${mediaType === "likes" ? "pointer-events-none" : ""}`}
          >
            <div className="relative flex items-center gap-3 rounded-full bg-white/90 dark:bg-zinc-800/80 px-5 py-3.5 shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.7)]">
              <span className="relative h-5 w-5 shrink-0">
                <Search
                  className={`absolute inset-0 h-5 w-5 text-zinc-500 dark:text-zinc-400 transition-opacity duration-200 ${
                    loadingMovies ? "opacity-0 delay-150" : "opacity-100"
                  }`}
                />
                <Loader2
                  className={`absolute inset-0 h-5 w-5 text-zinc-500 dark:text-zinc-400 animate-spin transition-opacity duration-200 ${
                    loadingMovies ? "opacity-100 delay-150" : "opacity-0"
                  }`}
                />
              </span>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un film ou une série"
                className="flex-1 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-500 outline-none text-base pr-8"
              />
              {(query.trim() || mode === "search") && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    if (mode === "search" && mediaType !== "likes")
                      fetchItems("top", "", 1, tmdbKey, mediaType);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200/90 dark:bg-zinc-700/80 hover:bg-zinc-300 dark:hover:bg-zinc-600/80 transition-colors"
                >
                  <X className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                </button>
              )}
            </div>
          </motion.form>

          <div className="mb-6 flex justify-center">
            <div className="flex rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 p-1">
              {(["movie", "tv", "animation", "likes"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => switchType(t)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    mediaType === t
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {t === "movie" ? (
                    <Clapperboard className="h-3.5 w-3.5" />
                  ) : t === "tv" ? (
                    <Tv className="h-3.5 w-3.5" />
                  ) : t === "animation" ? (
                    <Sparkles className="h-3.5 w-3.5" />
                  ) : (
                    <Heart className="h-3.5 w-3.5" />
                  )}
                  {t === "movie"
                    ? "Films"
                    : t === "tv"
                      ? "Séries"
                      : t === "animation"
                        ? "Animations"
                        : "Ma liste"}
                </button>
              ))}
            </div>
          </div>

          <h2 className="mb-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            {mediaType === "likes"
              ? `Ma liste (${likes.length})`
              : mode === "top"
                ? mediaType === "movie"
                  ? "Films les mieux notés"
                  : mediaType === "tv"
                    ? "Séries les mieux notées"
                    : "Animations les mieux notées"
                : `Résultats pour "${searchedQuery}"`}
          </h2>

          {mediaType !== "likes" && moviesError && (
            <p className="text-sm text-red-600 dark:text-red-400">{moviesError}</p>
          )}

          {mediaType !== "likes" &&
            !moviesError &&
            items.length === 0 &&
            !loadingMovies && (
              <p className="text-sm text-zinc-500">Aucun résultat trouvé.</p>
            )}

          {mediaType === "likes" && likes.length === 0 && (
            <p className="text-sm text-zinc-500">
              Aucun contenu enregistré. Cliquez sur le coeur d'une affiche pour
              l'ajouter à votre liste.
            </p>
          )}

          {/* Poster grid */}
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            {(mediaType === "likes" ? likes : items).map((m, i) => (
              <motion.button
                key={`${m.mediaType}-${m.id}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.25,
                    delay: Math.min((i % 20) * 0.02, 0.3),
                  },
                }}
                whileHover={{
                  scale: 1.03,
                  y: -5,
                  transition: { type: "spring", stiffness: 300, damping: 22 },
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openItem(m)}
                className="group text-left"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-900 ring-1 ring-black/8 dark:ring-white/8 transition-all duration-500 ease-out group-hover:ring-black/20 dark:group-hover:ring-white/25 group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)] dark:group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.7)]">
                  {m.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w342${m.posterPath}`}
                      alt={m.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-[filter] duration-500 ease-out group-hover:brightness-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400 dark:text-zinc-600 px-2 text-center">
                      {m.title}
                    </div>
                  )}
                  {m.voteAverage > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 backdrop-blur-sm">
                      <Star className="h-2.5 w-2.5 fill-amber-400" />
                      {m.voteAverage.toFixed(1)}
                    </span>
                  )}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(m);
                    }}
                    className={`absolute left-1.5 top-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-opacity hover:bg-black/80 ${
                      likedKeys.has(`${m.mediaType}-${m.id}`)
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <Heart
                      className={`h-3.5 w-3.5 transition-colors ${
                        likedKeys.has(`${m.mediaType}-${m.id}`)
                          ? "fill-rose-500 text-rose-500"
                          : "text-white"
                      }`}
                    />
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium text-zinc-900 dark:text-white leading-snug line-clamp-1">
                  {m.title}
                </p>
                <p className="text-[11px] text-zinc-500">{m.year}</p>
              </motion.button>
            ))}
          </div>

          {mediaType !== "likes" && tmdbPage < tmdbTotalPages && items.length > 0 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() =>
                  fetchItems(
                    mode,
                    searchedQuery,
                    tmdbPage + 1,
                    tmdbKey,
                    mediaType,
                  )
                }
                disabled={loadingMovies}
                className="flex items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-5 py-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white disabled:opacity-40 transition-colors"
              >
                {loadingMovies && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Charger plus
              </button>
            </div>
          )}
        </div>
      )}

      {/* Movie releases modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={closeMovie}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl ring-1 ring-black/10 dark:ring-white/10 overflow-hidden shadow-2xl"
            >
              <div className="flex items-start gap-4 px-5 pt-5 pb-4">
                {selected.posterPath && (
                  <img
                    src={`https://image.tmdb.org/t/p/w154${selected.posterPath}`}
                    alt=""
                    className="h-24 w-16 shrink-0 rounded-lg object-cover ring-1 ring-black/10 dark:ring-white/10"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
                    Versions disponibles
                  </p>
                  <p className="text-base font-semibold text-zinc-900 dark:text-white leading-snug">
                    {selected.title}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span>{selected.year}</span>
                    {selected.voteAverage > 0 && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Star className="h-3 w-3 fill-amber-400" />
                        {selected.voteAverage.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleLike(selected)}
                  className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Heart
                    className={`h-3.5 w-3.5 transition-colors ${
                      likedKeys.has(`${selected.mediaType}-${selected.id}`)
                        ? "fill-rose-500 text-rose-500"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  />
                </button>
                <button
                  onClick={closeMovie}
                  className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                </button>
              </div>

              {selected.overview && (
                <p className="mx-5 mb-4 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-4">
                  {selected.overview}
                </p>
              )}

              {selected.mediaType === "tv" && (
                <div className="flex gap-1.5 overflow-x-auto px-5 pb-3">
                  {seasons === null
                    ? Array.from({ length: 4 }, (_, i) => (
                        <div
                          key={i}
                          className="h-[26px] w-24 shrink-0 rounded-full bg-white/80 dark:bg-zinc-800/60 animate-pulse"
                        />
                      ))
                    : seasons.map((s) => (
                        <button
                          key={s.number}
                          onClick={() => changeSeason(s.number)}
                          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ring-1 transition-colors ${
                            activeSeason === s.number
                              ? "bg-indigo-600 text-white ring-indigo-500"
                              : "bg-white/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 ring-black/10 dark:ring-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white"
                          }`}
                        >
                          Saison {s.number}
                          <span
                            className={`ml-1 ${activeSeason === s.number ? "text-indigo-200" : "text-zinc-400 dark:text-zinc-600"}`}
                          >
                            {s.episodeCount} ép.
                          </span>
                        </button>
                      ))}
                </div>
              )}

              {releases === null && !releasesError && (
                <div className="flex flex-wrap items-center gap-1.5 px-5 pb-3">
                  <SlidersHorizontal className="mr-0.5 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600" />
                  {[64, 48, 56, 52, 44, 48].map((w, i) => (
                    <div
                      key={i}
                      className="h-6 animate-pulse rounded-full bg-white/80 dark:bg-zinc-800/60"
                      style={{ width: w }}
                    />
                  ))}
                </div>
              )}

              {releases !== null && releases.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 px-5 pb-3">
                  <SlidersHorizontal className="mr-0.5 h-3.5 w-3.5 text-zinc-500" />
                  {(
                    [
                      ["seeders", "Seeders"],
                      ["size", "Taille"],
                      ["resolution", "Qualité"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        if (releaseSort === key) {
                          setSortDir(sortDir === "desc" ? "asc" : "desc");
                        } else {
                          setReleaseSort(key);
                          setSortDir("desc");
                        }
                      }}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors ${
                        releaseSort === key
                          ? "bg-indigo-600 text-white ring-indigo-500"
                          : "bg-white/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 ring-black/10 dark:ring-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      {label}
                      {releaseSort === key &&
                        (sortDir === "desc" ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUp className="h-3 w-3" />
                        ))}
                    </button>
                  ))}
                  {(resOptions.length > 1 || langOptions.length > 1) && (
                    <span className="mx-1 h-4 w-px bg-black/10 dark:bg-white/10" />
                  )}
                  {resOptions.length > 1 &&
                    resOptions.map((r) => (
                      <button
                        key={r}
                        onClick={() => setResFilter(resFilter === r ? null : r)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ring-1 transition-colors ${
                          resFilter === r
                            ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 ring-indigo-500/50"
                            : "bg-white/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 ring-black/10 dark:ring-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  {langOptions.length > 1 &&
                    langOptions.map((l) => (
                      <button
                        key={l}
                        onClick={() =>
                          setLangFilter(langFilter === l ? null : l)
                        }
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ring-1 transition-colors ${
                          langFilter === l
                            ? "bg-green-500/15 text-green-600 dark:text-green-400 ring-green-500/40"
                            : "bg-white/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 ring-black/10 dark:ring-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                </div>
              )}

              <div className="h-[32rem] max-h-[65vh] overflow-y-auto px-3 pb-3 space-y-1.5">
                {releases === null &&
                  !releasesError &&
                  Array.from({ length: 6 }, (_, i) => (
                    <motion.div
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.07 }}
                      className="flex items-center gap-4 rounded-xl bg-white/80 dark:bg-zinc-800/60 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1 animate-pulse">
                        <div className="mb-2 flex items-center gap-1.5">
                          <div className="h-[18px] w-12 rounded-md bg-zinc-300/70 dark:bg-zinc-700/70" />
                          <div className="h-[18px] w-10 rounded-md bg-zinc-300/70 dark:bg-zinc-700/70" />
                          <div className="h-[18px] w-12 rounded-md bg-zinc-300/70 dark:bg-zinc-700/70" />
                          <div className="h-[18px] w-9 rounded-md bg-zinc-300/70 dark:bg-zinc-700/70" />
                        </div>
                        <div className="mb-2 flex items-center gap-3">
                          <div className="h-3 w-14 rounded bg-zinc-300/70 dark:bg-zinc-700/70" />
                          <div className="h-3 w-20 rounded bg-zinc-300/70 dark:bg-zinc-700/70" />
                          <div className="h-3 w-16 rounded bg-zinc-300/60 dark:bg-zinc-700/50" />
                        </div>
                        <div className="h-2.5 w-3/4 rounded bg-zinc-300/40 dark:bg-zinc-700/40" />
                      </div>
                      <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-300/70 dark:bg-zinc-700/70 animate-pulse" />
                    </motion.div>
                  ))}
                {releasesError && (
                  <div className="flex h-full items-center justify-center px-6">
                    <p className="text-center text-sm text-red-600 dark:text-red-400">
                      {releasesError}
                    </p>
                  </div>
                )}
                {releases !== null && releases.length === 0 && (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-center text-sm text-zinc-500">
                      {selected.mediaType === "tv"
                        ? "Aucune version disponible pour cette saison."
                        : "Aucune version disponible pour ce film."}
                    </p>
                  </div>
                )}
                {releases !== null &&
                  releases.length > 0 &&
                  visibleReleases?.length === 0 && (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-center text-sm text-zinc-500">
                        Aucune version ne correspond aux filtres.
                      </p>
                    </div>
                  )}
                {visibleReleases?.map((occ, i) => (
                  <motion.div
                    key={occ.infoHash}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: Math.min(i * 0.04, 0.3),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="flex items-center gap-4 rounded-xl bg-white/80 dark:bg-zinc-800/60 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {occ.resolution && (
                          <span className="rounded-md bg-indigo-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                            {occ.resolution}
                          </span>
                        )}
                        {occ.videoCodec && (
                          <span className="rounded-md bg-black/6 dark:bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            {occ.videoCodec}
                          </span>
                        )}
                        {occ.specialVersion && (
                          <span className="rounded-md bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                            {occ.specialVersion}
                          </span>
                        )}
                        {occ.languages.map((l) => (
                          <span
                            key={l}
                            className="rounded-md bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-600 dark:text-green-400"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                        <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                          {formatSize(occ.fileSize)}
                        </span>
                        <span className="text-green-500">
                          {occ.seeders} Seeders
                        </span>
                        {occ.source && <span>{occ.source}</span>}
                        {occ.audioCodec && (
                          <span>
                            {occ.audioCodec}
                            {occ.audioChannels ? ` ${occ.audioChannels}` : ""}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-600 truncate">
                        {occ.torrentName}
                      </p>
                    </div>
                    <div className="group relative shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSendToDebrid(occ)}
                        disabled={sendingHash !== null}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/80 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {sendingHash === occ.infoHash ? (
                          <Loader2 className="h-4 w-4 text-white animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 text-white" />
                        )}
                      </motion.button>
                      <span className="pointer-events-none absolute right-0 bottom-full mb-2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 ring-1 ring-black/10 dark:ring-white/10 shadow-lg opacity-0 transition-opacity duration-150 delay-500 group-hover:opacity-100">
                        Télécharger
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debrid files modal */}
      <AnimatePresence>
        {debridModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setDebridModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl ring-1 ring-black/10 dark:ring-white/10 overflow-hidden shadow-2xl"
            >
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
                      Fichiers disponibles
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug line-clamp-2">
                      {debridModal.torrentName}
                    </p>
                  </div>
                  <button
                    onClick={() => setDebridModal(null)}
                    className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto px-3 pb-3 space-y-1.5">
                {debridModal.files.map((file, i) => {
                  const fileName = file.name.split("/").pop() ?? file.name;
                  const showName = fileName !== debridModal.torrentName;
                  return (
                    <div
                      key={i}
                      className="rounded-xl bg-white/80 dark:bg-zinc-800/60 px-4 py-3"
                    >
                      <div className="mb-3">
                        {showName && (
                          <p className="text-sm font-medium text-zinc-900 dark:text-white leading-snug line-clamp-2 mb-0.5">
                            {fileName}
                          </p>
                        )}
                        <p className="text-xs text-zinc-500">
                          {formatSize(file.size)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleOpenVlc(file.link)}
                          disabled={
                            downloadingLink !== null ||
                            copiedLink !== null ||
                            vlcLink !== null
                          }
                          className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {vlcLink === file.link ? (
                            <Loader2 className="h-3.5 w-3.5 text-zinc-900 dark:text-white animate-spin" />
                          ) : (
                            <img src={vlcLogo} className="h-4 w-4" />
                          )}
                          <span className="text-xs font-medium text-zinc-900 dark:text-white">
                            Lire avec VLC
                          </span>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleCopyLink(file.link)}
                          disabled={
                            downloadingLink !== null ||
                            copiedLink !== null ||
                            vlcLink !== null
                          }
                          className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {copiedLink === file.link ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                Copie !
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
                              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                Copier le lien
                              </span>
                            </>
                          )}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleDownloadFile(file.link)}
                          disabled={
                            downloadingLink !== null ||
                            copiedLink !== null ||
                            vlcLink !== null
                          }
                          className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {downloadingLink === file.link ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                              <span className="text-xs font-medium text-white">
                                Ouverture...
                              </span>
                            </>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5 text-white" />
                              <span className="text-xs font-medium text-white">
                                Telecharger
                              </span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
