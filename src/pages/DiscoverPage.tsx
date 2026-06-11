import vlcLogo from "@/assets/vlc.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getApiKey } from "@/lib/apiKeys";
import { getLikes, saveLikes, type LikedItem } from "@/lib/likes";
import { parseRelease } from "@/lib/parseRelease";
import { invoke } from "@tauri-apps/api/core";
import { fetch } from "@tauri-apps/plugin-http";
import { openUrl } from "@tauri-apps/plugin-opener";
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
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type MediaType = "movie" | "tv";
type BrowseType = MediaType | "animation";
type DiscoverTab = BrowseType | "likes";

const ANIMATION_GENRE_ID = 16;

interface TmdbItem {
  id: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  posterPath: string | null;
  year: string;
  voteAverage: number;
}

interface TmdbRawResult {
  id: number;
  title?: string;
  original_title?: string;
  name?: string;
  original_name?: string;
  poster_path: string | null;
  release_date?: string | null;
  first_air_date?: string | null;
  vote_average: number;
  genre_ids?: number[];
}

interface TmdbListResponse {
  page: number;
  total_pages: number;
  results: TmdbRawResult[];
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

interface C411Torrent {
  infoHash: string;
  name: string;
  size: number;
  seeders: number;
  category: { id: number } | null;
  subcategory: { slug: string } | null;
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

interface DebridFile {
  name: string;
  size: number;
  link: string;
}

interface DebridModal {
  torrentName: string;
  files: DebridFile[];
}

const RESOLUTION_RANK: Record<string, number> = {
  "4320p": 5,
  "4K": 4,
  "2160p": 4,
  "1080p": 3,
  "720p": 2,
  "480p": 1,
};

function flattenFiles(entries: unknown[], prefix = ""): DebridFile[] {
  const result: DebridFile[] = [];
  for (const entry of entries) {
    const e = entry as Record<string, unknown>;
    const name = prefix ? `${prefix}/${e.n}` : String(e.n);
    if (Array.isArray(e.e)) {
      result.push(...flattenFiles(e.e, name));
    } else if (e.l) {
      result.push({ name, size: Number(e.s) || 0, link: String(e.l) });
    }
  }
  return result;
}

function formatSize(bytes: number): string {
  if (!bytes) return "-";
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} Go`;
  return `${(bytes / 1_048_576).toFixed(0)} Mo`;
}

const IMDB_ID_RE = /^tt\d{5,10}$/i;

interface DiscoverPageProps {
  onBack: () => void;
  onNavigate: (page: "magnets" | "preferences" | "patchnotes") => void;
}

export function DiscoverPage({ onBack, onNavigate }: DiscoverPageProps) {
  const [tmdbKey, setTmdbKey] = useState<string | null | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<DiscoverTab>("movie");
  const [likes, setLikes] = useState<LikedItem[]>([]);
  const [items, setItems] = useState<TmdbItem[]>([]);
  const [mode, setMode] = useState<"top" | "search">("top");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [tmdbPage, setTmdbPage] = useState(1);
  const [tmdbTotalPages, setTmdbTotalPages] = useState(1);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [moviesError, setMoviesError] = useState<string | null>(null);

  const [selected, setSelected] = useState<TmdbItem | null>(null);
  const [releases, setReleases] = useState<Occupant[] | null>(null);
  const [releasesError, setReleasesError] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<TmdbSeason[] | null>(null);
  const [activeSeason, setActiveSeason] = useState<number | null>(null);
  const [releaseSort, setReleaseSort] = useState<
    "seeders" | "size" | "resolution"
  >("seeders");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [resFilter, setResFilter] = useState<string | null>(null);
  const [langFilter, setLangFilter] = useState<string | null>(null);

  const [sendingHash, setSendingHash] = useState<string | null>(null);
  const [debridModal, setDebridModal] = useState<DebridModal | null>(null);
  const [downloadingLink, setDownloadingLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [vlcLink, setVlcLink] = useState<string | null>(null);

  const c411KeyRef = useRef<string>("");
  const allDebridKeyRef = useRef<string>("");
  const releasesReqRef = useRef(0);

  const resOptions = releases
    ? [
        ...new Set(
          releases.map((o) => o.resolution).filter((r): r is string => !!r),
        ),
      ].sort((a, b) => (RESOLUTION_RANK[b] ?? 0) - (RESOLUTION_RANK[a] ?? 0))
    : [];
  const langOptions = releases
    ? [...new Set(releases.flatMap((o) => o.languages))]
    : [];
  const visibleReleases = releases
    ? releases
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
    : null;

  useEffect(() => {
    getApiKey("c411_api_key").then((v) => {
      if (v) c411KeyRef.current = v;
    });
    getApiKey("alldebrid_api_key").then((v) => {
      if (v) allDebridKeyRef.current = v;
    });
    getApiKey("tmdb_api_key").then((v) => setTmdbKey(v || null));
    getLikes().then(setLikes);
  }, []);

  useEffect(() => {
    if (!tmdbKey) return;
    fetchItems("top", "", 1, tmdbKey, "movie");
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
      const getJson = async (url: string) => {
        const res = await fetch(url);
        if (!res.ok)
          throw new Error(
            res.status === 401
              ? "Clé TMDB invalide"
              : `Erreur TMDB ${res.status}`,
          );
        return res.json();
      };
      let mapped: TmdbItem[];
      let totalPages: number;
      if (m === "search" && IMDB_ID_RE.test(q)) {
        const found = (await getJson(
          `https://api.themoviedb.org/3/find/${q.toLowerCase()}?api_key=${key}&external_source=imdb_id&language=fr-FR`,
        )) as {
          movie_results: TmdbRawResult[];
          tv_results: TmdbRawResult[];
        };
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
        const urlFor = (mt: MediaType) =>
          m === "search"
            ? `https://api.themoviedb.org/3/search/${mt}?api_key=${key}&language=fr-FR&include_adult=false&query=${encodeURIComponent(q)}&page=${page}`
            : `https://api.themoviedb.org/3/discover/${mt}?api_key=${key}&language=fr-FR&with_genres=${ANIMATION_GENRE_ID}&sort_by=vote_average.desc&vote_count.gte=${mt === "movie" ? 300 : 150}&page=${page}`;
        const [movies, tvs] = (await Promise.all([
          getJson(urlFor("movie")),
          getJson(urlFor("tv")),
        ])) as [TmdbListResponse, TmdbListResponse];
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
        const url =
          m === "search"
            ? `https://api.themoviedb.org/3/search/${type}?api_key=${key}&language=fr-FR&include_adult=false&query=${encodeURIComponent(q)}&page=${page}`
            : `https://api.themoviedb.org/3/${type}/top_rated?api_key=${key}&language=fr-FR&page=${page}`;
        const list = (await getJson(url)) as TmdbListResponse;
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

  const likedKeys = new Set(likes.map((l) => `${l.mediaType}-${l.id}`));

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
    setReleases(null);
    setReleasesError(null);
    setSeasons(null);
    setActiveSeason(null);
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
    const byHash = new Map<string, C411Torrent>();
    for (const q of queries) {
      const url = `https://c411.org/api/torrents?page=1&perPage=50&sortBy=seeders&sortOrder=desc&name=${encodeURIComponent(q)}&apikey=${c411KeyRef.current}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erreur C411 ${res.status}`);
      const json = (await res.json()) as { data: C411Torrent[] };
      for (const t of json.data) {
        if (!byHash.has(t.infoHash)) byHash.set(t.infoHash, t);
      }
    }
    return { torrents: [...byHash.values()], nTitles: queries.map(normalize) };
  }

  // Garantit que le skeleton reste affiche assez longtemps pour une transition douce
  const MIN_SKELETON_MS = 900;
  async function minDelay(start: number) {
    const remaining = MIN_SKELETON_MS - (Date.now() - start);
    if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
  }

  function sortOccupants(occupants: Occupant[]): Occupant[] {
    return occupants.sort(
      (a, b) =>
        (RESOLUTION_RANK[b.resolution ?? ""] ?? 0) -
          (RESOLUTION_RANK[a.resolution ?? ""] ?? 0) || b.fileSize - a.fileSize,
    );
  }

  async function loadMovieReleases(item: TmdbItem) {
    const start = Date.now();
    const reqId = ++releasesReqRef.current;
    try {
      const { torrents, nTitles } = await searchC411(item);
      const nextYear = item.year ? String(Number(item.year) + 1) : "";
      const occupants: Occupant[] = [];
      for (const t of torrents) {
        if (t.category?.id !== 1) continue;
        if (SERIES_SLUGS.has(t.subcategory?.slug ?? "")) continue;
        const nName = normalize(t.name);
        if (!nTitles.some((nt) => nName.includes(nt))) continue;
        if (
          item.year &&
          !nName.includes(item.year) &&
          !nName.includes(nextYear)
        )
          continue;
        occupants.push(toOccupant(t));
      }
      await minDelay(start);
      if (reqId !== releasesReqRef.current) return;
      setReleases(sortOccupants(occupants));
    } catch (err) {
      if (reqId === releasesReqRef.current) setReleasesError(String(err));
    }
  }

  async function loadTvReleases(item: TmdbItem, season: number | null) {
    const start = Date.now();
    const reqId = ++releasesReqRef.current;
    try {
      const { torrents, nTitles } = await searchC411(item);
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
      await minDelay(start);
      if (reqId !== releasesReqRef.current) return;
      setReleases(sortOccupants(occupants));
    } catch (err) {
      if (reqId === releasesReqRef.current) setReleasesError(String(err));
    }
  }

  async function openItem(item: TmdbItem) {
    setSelected(item);
    setReleases(null);
    setReleasesError(null);
    setSeasons(null);
    setActiveSeason(null);
    if (item.mediaType === "movie") {
      loadMovieReleases(item);
      return;
    }
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/${item.id}?api_key=${tmdbKey}&language=fr-FR`,
      );
      if (!res.ok) throw new Error(`Erreur TMDB ${res.status}`);
      const detail = (await res.json()) as {
        seasons?: Array<{ season_number: number; episode_count: number }>;
      };
      const list = (detail.seasons ?? [])
        .filter((s) => s.season_number > 0)
        .map((s) => ({
          number: s.season_number,
          episodeCount: s.episode_count,
        }));
      setSeasons(list);
      const first = list[0]?.number ?? null;
      setActiveSeason(first);
      loadTvReleases(item, first);
    } catch (err) {
      setReleasesError(String(err));
    }
  }

  function changeSeason(season: number) {
    if (!selected || season === activeSeason) return;
    setActiveSeason(season);
    setReleases(null);
    setReleasesError(null);
    setResFilter(null);
    setLangFilter(null);
    loadTvReleases(selected, season);
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

  async function handleCopyLink(link: string) {
    setCopiedLink(link);
    try {
      const url = await invoke<string>("unlock_link", {
        link,
        alldebridKey: allDebridKeyRef.current,
      });
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setTimeout(() => setCopiedLink(null), 2000);
    }
  }

  async function handleOpenVlc(link: string) {
    setVlcLink(link);
    try {
      const url = await invoke<string>("unlock_link", {
        link,
        alldebridKey: allDebridKeyRef.current,
      });
      await invoke("open_with_vlc", { url });
      toast.success("Ouvert dans VLC");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setVlcLink(null);
    }
  }

  async function handleDownloadFile(link: string) {
    setDownloadingLink(link);
    try {
      const url = await invoke<string>("unlock_link", {
        link,
        alldebridKey: allDebridKeyRef.current,
      });
      await openUrl(url);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setDownloadingLink(null);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-black bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,_#0c1d56_0%,_#04091a_45%,_#000000_75%)]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-black/30 backdrop-blur-xl">
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 sm:px-8">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onBack}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </motion.button>

          <h1 className="text-sm font-semibold text-white tracking-tight absolute left-1/2 -translate-x-1/2">
            Découverte
          </h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800/80 ring-1 ring-white/10 text-zinc-400 hover:text-white hover:bg-zinc-700/80 transition-colors"
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
            <KeyRound className="h-5 w-5 text-indigo-400" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">
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
            <div className="relative flex items-center gap-3 rounded-full bg-zinc-800/80 px-5 py-3.5 shadow-[0_8px_40px_rgba(0,0,0,0.7)]">
              <span className="relative h-5 w-5 shrink-0">
                <Search
                  className={`absolute inset-0 h-5 w-5 text-zinc-400 transition-opacity duration-200 ${
                    loadingMovies ? "opacity-0 delay-150" : "opacity-100"
                  }`}
                />
                <Loader2
                  className={`absolute inset-0 h-5 w-5 text-zinc-400 animate-spin transition-opacity duration-200 ${
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
                className="flex-1 bg-transparent text-white placeholder:text-zinc-500 outline-none text-base pr-8"
              />
              {(query.trim() || mode === "search") && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    if (mode === "search" && mediaType !== "likes")
                      fetchItems("top", "", 1, tmdbKey, mediaType);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700/80 hover:bg-zinc-600/80 transition-colors"
                >
                  <X className="h-4 w-4 text-zinc-300" />
                </button>
              )}
            </div>
          </motion.form>

          <div className="mb-6 flex justify-center">
            <div className="flex rounded-full bg-zinc-800/80 ring-1 ring-white/10 p-1">
              {(["movie", "tv", "animation", "likes"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => switchType(t)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    mediaType === t
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-white"
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

          <h2 className="mb-4 text-sm font-semibold text-zinc-300">
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
            <p className="text-sm text-red-400">{moviesError}</p>
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
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/8 transition-all duration-500 ease-out group-hover:ring-white/25 group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.7)]">
                  {m.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w342${m.posterPath}`}
                      alt={m.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-[filter] duration-500 ease-out group-hover:brightness-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600 px-2 text-center">
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
                <p className="mt-2 text-xs font-medium text-white leading-snug line-clamp-1">
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
                className="flex items-center gap-2 rounded-full bg-zinc-800/80 ring-1 ring-white/10 px-5 py-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700/80 hover:text-white disabled:opacity-40 transition-colors"
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
              className="w-full max-w-2xl rounded-2xl bg-zinc-900/95 backdrop-blur-xl ring-1 ring-white/10 overflow-hidden shadow-2xl"
            >
              <div className="flex items-start gap-4 px-5 pt-5 pb-4">
                {selected.posterPath && (
                  <img
                    src={`https://image.tmdb.org/t/p/w154${selected.posterPath}`}
                    alt=""
                    className="h-24 w-16 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
                    Versions disponibles
                  </p>
                  <p className="text-base font-semibold text-white leading-snug">
                    {selected.title}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span>{selected.year}</span>
                    {selected.voteAverage > 0 && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Star className="h-3 w-3 fill-amber-400" />
                        {selected.voteAverage.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleLike(selected)}
                  className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors"
                >
                  <Heart
                    className={`h-3.5 w-3.5 transition-colors ${
                      likedKeys.has(`${selected.mediaType}-${selected.id}`)
                        ? "fill-rose-500 text-rose-500"
                        : "text-zinc-400"
                    }`}
                  />
                </button>
                <button
                  onClick={closeMovie}
                  className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-zinc-400" />
                </button>
              </div>

              {selected.mediaType === "tv" && (
                <div className="flex gap-1.5 overflow-x-auto px-5 pb-3">
                  {seasons === null
                    ? Array.from({ length: 4 }, (_, i) => (
                        <div
                          key={i}
                          className="h-[26px] w-24 shrink-0 rounded-full bg-zinc-800/60 animate-pulse"
                        />
                      ))
                    : seasons.map((s) => (
                        <button
                          key={s.number}
                          onClick={() => changeSeason(s.number)}
                          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ring-1 transition-colors ${
                            activeSeason === s.number
                              ? "bg-indigo-600 text-white ring-indigo-500"
                              : "bg-zinc-800/80 text-zinc-400 ring-white/10 hover:bg-zinc-700/80 hover:text-white"
                          }`}
                        >
                          Saison {s.number}
                          <span
                            className={`ml-1 ${activeSeason === s.number ? "text-indigo-200" : "text-zinc-600"}`}
                          >
                            {s.episodeCount} ép.
                          </span>
                        </button>
                      ))}
                </div>
              )}

              {releases === null && !releasesError && (
                <div className="flex flex-wrap items-center gap-1.5 px-5 pb-3">
                  <SlidersHorizontal className="mr-0.5 h-3.5 w-3.5 text-zinc-600" />
                  {[64, 48, 56, 52, 44, 48].map((w, i) => (
                    <div
                      key={i}
                      className="h-6 animate-pulse rounded-full bg-zinc-800/60"
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
                          : "bg-zinc-800/80 text-zinc-400 ring-white/10 hover:bg-zinc-700/80 hover:text-white"
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
                    <span className="mx-1 h-4 w-px bg-white/10" />
                  )}
                  {resOptions.length > 1 &&
                    resOptions.map((r) => (
                      <button
                        key={r}
                        onClick={() => setResFilter(resFilter === r ? null : r)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ring-1 transition-colors ${
                          resFilter === r
                            ? "bg-indigo-500/20 text-indigo-300 ring-indigo-500/50"
                            : "bg-zinc-800/80 text-zinc-400 ring-white/10 hover:bg-zinc-700/80 hover:text-white"
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
                            ? "bg-green-500/15 text-green-400 ring-green-500/40"
                            : "bg-zinc-800/80 text-zinc-400 ring-white/10 hover:bg-zinc-700/80 hover:text-white"
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
                      className="flex items-center gap-4 rounded-xl bg-zinc-800/60 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1 animate-pulse">
                        <div className="mb-2 flex items-center gap-1.5">
                          <div className="h-[18px] w-12 rounded-md bg-zinc-700/70" />
                          <div className="h-[18px] w-10 rounded-md bg-zinc-700/70" />
                          <div className="h-[18px] w-12 rounded-md bg-zinc-700/70" />
                          <div className="h-[18px] w-9 rounded-md bg-zinc-700/70" />
                        </div>
                        <div className="mb-2 flex items-center gap-3">
                          <div className="h-3 w-14 rounded bg-zinc-700/70" />
                          <div className="h-3 w-20 rounded bg-zinc-700/70" />
                          <div className="h-3 w-16 rounded bg-zinc-700/50" />
                        </div>
                        <div className="h-2.5 w-3/4 rounded bg-zinc-700/40" />
                      </div>
                      <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-700/70 animate-pulse" />
                    </motion.div>
                  ))}
                {releasesError && (
                  <div className="flex h-full items-center justify-center px-6">
                    <p className="text-center text-sm text-red-400">
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
                    className="flex items-center gap-4 rounded-xl bg-zinc-800/60 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {occ.resolution && (
                          <span className="rounded-md bg-indigo-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-300">
                            {occ.resolution}
                          </span>
                        )}
                        {occ.videoCodec && (
                          <span className="rounded-md bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                            {occ.videoCodec}
                          </span>
                        )}
                        {occ.specialVersion && (
                          <span className="rounded-md bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                            {occ.specialVersion}
                          </span>
                        )}
                        {occ.languages.map((l) => (
                          <span
                            key={l}
                            className="rounded-md bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-400"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                        <span className="text-zinc-300 font-medium">
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
                      <p className="mt-1 text-[11px] text-zinc-600 truncate">
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
                      <span className="pointer-events-none absolute right-0 bottom-full mb-2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 ring-1 ring-white/10 shadow-lg opacity-0 transition-opacity duration-150 delay-500 group-hover:opacity-100">
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
              className="w-full max-w-lg rounded-2xl bg-zinc-900/95 backdrop-blur-xl ring-1 ring-white/10 overflow-hidden shadow-2xl"
            >
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
                      Fichiers disponibles
                    </p>
                    <p className="text-sm font-semibold text-white leading-snug line-clamp-2">
                      {debridModal.torrentName}
                    </p>
                  </div>
                  <button
                    onClick={() => setDebridModal(null)}
                    className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-zinc-400" />
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
                      className="rounded-xl bg-zinc-800/60 px-4 py-3"
                    >
                      <div className="mb-3">
                        {showName && (
                          <p className="text-sm font-medium text-white leading-snug line-clamp-2 mb-0.5">
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
                          className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {vlcLink === file.link ? (
                            <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                          ) : (
                            <img src={vlcLogo} className="h-4 w-4" />
                          )}
                          <span className="text-xs font-medium text-white">
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
                          className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {copiedLink === file.link ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-green-400" />
                              <span className="text-xs font-medium text-green-400">
                                Copie !
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-zinc-300" />
                              <span className="text-xs font-medium text-zinc-300">
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
