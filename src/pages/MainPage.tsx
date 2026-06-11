import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import vlcLogo from "@/assets/vlc.png";
import { invoke } from "@tauri-apps/api/core";
import { fetch } from "@tauri-apps/plugin-http";
import { openUrl } from "@tauri-apps/plugin-opener";
import { LazyStore } from "@tauri-apps/plugin-store";
import { getApiKey } from "@/lib/apiKeys";
import {
  ArrowDown,
  ArrowUp,
  Book,
  BookMarked,
  Check,
  CircleFadingArrowUp,
  Clapperboard,
  Copy,
  Bell,
  Download,
  FileText,
  FlaskConical,
  Gamepad2,
  Headphones,
  HelpCircle,
  Loader2,
  Magnet,
  Menu,
  Music,
  Package,
  RotateCcw,
  ScrollText,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Tv,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LATEST_VERSION } from "@/lib/patchnotes";
import { parseRelease } from "@/lib/parseRelease";
import type { ViewMode } from "./PreferencesPage";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

const titleWords = "Que voulez-vous télécharger ?".split(" ");

const titleContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const titleWordVariants = {
  hidden: { y: "110%", opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      delay: Math.min(i * 0.03, 0.3),
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

interface SearchResult {
  title: string;
  size: number;
  seeders: number;
  leechers: number;
  magnetUrl: string;
  guid: string;
  downloadUrl: string;
  pubDate: string;
  category: number;
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

function getCategoryIcon(id: number): { icon: LucideIcon; color: string } {
  if (id === 2060 || id === 5070)
    return { icon: Sparkles, color: "text-pink-400" };
  if (id === 2070) return { icon: FileText, color: "text-yellow-400" };
  if (id >= 2000 && id < 3000)
    return { icon: Clapperboard, color: "text-blue-400" };
  if (id === 3030) return { icon: Headphones, color: "text-orange-400" };
  if (id >= 3000 && id < 4000) return { icon: Music, color: "text-purple-400" };
  if (id === 4050) return { icon: Gamepad2, color: "text-green-400" };
  if (id >= 4000 && id < 5000) return { icon: Package, color: "text-zinc-400" };
  if (id >= 5000 && id < 6000) return { icon: Tv, color: "text-cyan-400" };
  if (id === 7030) return { icon: BookMarked, color: "text-rose-400" };
  if (id >= 7000) return { icon: Book, color: "text-amber-400" };
  return { icon: HelpCircle, color: "text-zinc-500" };
}

const CATEGORY_FILTERS: Array<{
  key: number;
  label: string;
  icon: LucideIcon;
  color: string;
}> = [
  { key: 2000, label: "Films", icon: Clapperboard, color: "text-blue-400" },
  { key: 5000, label: "Séries", icon: Tv, color: "text-cyan-400" },
  { key: 3000, label: "Musique", icon: Music, color: "text-purple-400" },
  { key: 4000, label: "Logiciels & Jeux", icon: Gamepad2, color: "text-green-400" },
  { key: 7000, label: "Livres", icon: Book, color: "text-amber-400" },
  { key: 0, label: "Autres", icon: HelpCircle, color: "text-zinc-500" },
];

function getCategoryGroup(id: number): number {
  const g = Math.floor(id / 1000) * 1000;
  return CATEGORY_FILTERS.some((c) => c.key === g) ? g : 0;
}

const QUALITY_ORDER = ["4K", "2160p", "1080p", "720p", "480p"];

const SORT_LABELS = {
  pertinence: "Pertinence",
  seeders: "Seeders",
  size: "Taille",
  date: "Date",
} as const;
type SortKey = keyof typeof SORT_LABELS;

function parseXml(xml: string): { items: SearchResult[]; total: number | null } {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const items = doc.querySelectorAll("item");

  // Torznab pagination: <newznab:response offset="N" total="M"/>
  const totalAttr = doc
    .getElementsByTagNameNS("*", "response")[0]
    ?.getAttribute("total");
  const total = totalAttr ? parseInt(totalAttr, 10) : null;

  const parsed = Array.from(items).map((item) => {
    const text = (tag: string) =>
      item.querySelector(tag)?.textContent?.trim() ?? "";
    const attr = (name: string) =>
      item.querySelector(`[name="${name}"]`)?.getAttribute("value") ?? "";

    const sizeText =
      text("size") ||
      item.querySelector("enclosure")?.getAttribute("length") ||
      "0";
    const categoryRaw = attr("category");

    return {
      title: text("title"),
      size: parseInt(sizeText, 10),
      seeders: parseInt(attr("seeders") || "0", 10),
      leechers: Math.max(
        0,
        parseInt(attr("peers") || "0", 10) -
          parseInt(attr("seeders") || "0", 10),
      ),
      magnetUrl: attr("magneturl"),
      guid: text("guid"),
      downloadUrl: text("link"),
      pubDate: text("pubDate"),
      category: parseInt(categoryRaw || "0", 10),
    };
  });

  return { items: parsed, total };
}

function formatSize(bytes: number): string {
  if (!bytes) return "-";
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} Go`;
  return `${(bytes / 1_048_576).toFixed(0)} Mo`;
}

interface MainPageProps {
  onNavigate: (page: "magnets" | "preferences" | "patchnotes" | "setup") => void;
  devMode: boolean;
  onToggleDevMode: () => void;
}

export function MainPage({ onNavigate, devMode, onToggleDevMode }: MainPageProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [activeCats, setActiveCats] = useState<number[]>([]);
  const [activeQualities, setActiveQualities] = useState<string[]>([]);
  const [activeCodecs, setActiveCodecs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("pertinence");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState(0);
  const [phase, setPhase] = useState<
    "idle" | "title-exiting" | "active" | "results-exiting" | "bar-returning"
  >("idle");
  const [sendingIndex, setSendingIndex] = useState<number | null>(null);
  const [debridModal, setDebridModal] = useState<DebridModal | null>(null);
  const [downloadingLink, setDownloadingLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [vlcLink, setVlcLink] = useState<string | null>(null);
  const [showPatchNotif, setShowPatchNotif] = useState(false);
  const [simpleSearchView, setSimpleSearchView] = useState(true);
  const apiKeyRef = useRef<string>("");
  const allDebridKeyRef = useRef<string>("");
  const searchedQueryRef = useRef<string>("");

  useEffect(() => {
    getApiKey("c411_api_key").then((v) => {
      if (v) apiKeyRef.current = v;
    });
    getApiKey("alldebrid_api_key").then((v) => {
      if (v) allDebridKeyRef.current = v;
    });
    store.get<string>("patchnotes_seen").then((v) => {
      if (v !== LATEST_VERSION) setShowPatchNotif(true);
    });
    store.get<ViewMode>("search_view_mode").then((v) => {
      setSimpleSearchView((v ?? "simple") === "simple");
    });
  }, []);

  async function dismissPatchNotif() {
    setShowPatchNotif(false);
    await store.set("patchnotes_seen", LATEST_VERSION);
    await store.save();
  }

  useEffect(() => {
    if (!debridModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDebridModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [debridModal]);

  async function handleSendToDebrid(result: SearchResult, index: number) {
    if (sendingIndex !== null) return;
    if (!allDebridKeyRef.current) {
      toast.error(
        "Cle AllDebrid manquante. Configurez-la dans les parametres.",
      );
      return;
    }

    // Torznab standard download: ?t=get&id={guid}&apikey={key}
    const guid = result.guid;
    if (!guid) {
      toast.error("GUID du torrent introuvable.");
      return;
    }
    const torrentUrl = `https://c411.org/api?t=get&id=${encodeURIComponent(guid)}&apikey=${apiKeyRef.current}`;

    setSendingIndex(index);
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
        setDebridModal({ torrentName: uploaded.name ?? result.title, files });
      } else {
        toast.success(
          `Envoye vers AllDebrid : ${uploaded.name ?? result.title} (en cours de debridage)`,
        );
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSendingIndex(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setPhase((prev) => (prev === "idle" ? "title-exiting" : "active"));
    setLoading(true);
    setError(null);

    try {
      searchedQueryRef.current = query.trim();
      const url = `https://c411.org/api?t=search&q=${encodeURIComponent(searchedQueryRef.current)}&offset=0&apikey=${apiKeyRef.current}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const { items, total } = parseXml(await res.text());
      setSearchKey((k) => k + 1);
      setResults(items);
      setTotal(total);
      setActiveCats([]);
      setActiveQualities([]);
      setActiveCodecs([]);
      setSortBy("pertinence");
      setSortDir("desc");
      setHasMore(
        items.length > 0 && (total === null || items.length < total),
      );
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    if (loadingMore || !results) return;
    setLoadingMore(true);
    try {
      const url = `https://c411.org/api?t=search&q=${encodeURIComponent(searchedQueryRef.current)}&offset=${results.length}&apikey=${apiKeyRef.current}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const { items, total } = parseXml(await res.text());
      const merged = [...results, ...items];
      setResults(merged);
      setTotal(total);
      setHasMore(
        items.length > 0 && (total === null || merged.length < total),
      );
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoadingMore(false);
    }
  }

  const groupCounts = new Map<number, number>();
  const qualityCounts = new Map<string, number>();
  const codecCounts = new Map<string, number>();
  for (const r of results ?? []) {
    const g = getCategoryGroup(r.category);
    groupCounts.set(g, (groupCounts.get(g) ?? 0) + 1);
    const p = parseRelease(r.title);
    if (p.quality)
      qualityCounts.set(p.quality, (qualityCounts.get(p.quality) ?? 0) + 1);
    if (p.codec) codecCounts.set(p.codec, (codecCounts.get(p.codec) ?? 0) + 1);
  }

  let displayed = results ?? [];
  if (activeCats.length > 0)
    displayed = displayed.filter((r) =>
      activeCats.includes(getCategoryGroup(r.category)),
    );
  if (activeQualities.length > 0 || activeCodecs.length > 0)
    displayed = displayed.filter((r) => {
      const p = parseRelease(r.title);
      return (
        (activeQualities.length === 0 ||
          (p.quality !== null && activeQualities.includes(p.quality))) &&
        (activeCodecs.length === 0 ||
          (p.codec !== null && activeCodecs.includes(p.codec)))
      );
    });
  const dir = sortDir === "desc" ? 1 : -1;
  if (sortBy === "seeders")
    displayed = [...displayed].sort((a, b) => (b.seeders - a.seeders) * dir);
  else if (sortBy === "size")
    displayed = [...displayed].sort((a, b) => (b.size - a.size) * dir);
  else if (sortBy === "date")
    displayed = [...displayed].sort(
      (a, b) => (Date.parse(b.pubDate) - Date.parse(a.pubDate)) * dir,
    );

  return (
    <main className="relative flex min-h-screen flex-col bg-black bg-[radial-gradient(ellipse_70%_45%_at_50%_52%,_#0c1d56_0%,_#04091a_45%,_#000000_75%)]">
      <AnimatePresence>
        {showPatchNotif && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            className="absolute top-4 left-4 z-10 flex items-start gap-3 rounded-2xl bg-zinc-900/90 backdrop-blur-xl ring-1 ring-white/10 pl-3 pr-1.5 py-2 shadow-xl"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 ring-1 ring-indigo-500/25">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            </span>
            <div>
              <p className="text-xs font-semibold text-white">Nouvelle version V{LATEST_VERSION}</p>
              <button
                onClick={() => {
                  dismissPatchNotif();
                  onNavigate("patchnotes");
                }}
                className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Lire le patch note
              </button>
            </div>
            <button
              onClick={dismissPatchNotif}
              className="flex h-5 w-5 items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 z-10">
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
          <DropdownMenuContent align="end" className={import.meta.env.DEV ? "w-56" : "w-44"}>
            <DropdownMenuItem onClick={() => onNavigate("magnets")}>
              <Magnet className="mr-2 h-4 w-4" />
              Magnets
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate("preferences")}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate("patchnotes")}>
              <ScrollText className="mr-2 h-4 w-4" />
              Patch notes
            </DropdownMenuItem>
            {import.meta.env.DEV && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Développeur</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={devMode} onCheckedChange={onToggleDevMode}>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Mode développeur
                </DropdownMenuCheckboxItem>
                {devMode && (
                  <>
                    <DropdownMenuItem onClick={() => onNavigate("setup")}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Voir la welcome page
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        await store.set("setup_complete", false);
                        await store.save();
                        toast.success("Premier lancement réinitialisé");
                      }}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Réinitialiser 1er lancement
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        toast.success("Toast de succès");
                        toast.error("Toast d'erreur");
                      }}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Tester les toasts
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        await store.clear();
                        await store.save();
                        location.reload();
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Vider le store
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 flex flex-col items-center overflow-y-auto">
        <motion.div
          layout
          transition={{
            type: "spring",
            stiffness: 240,
            damping: 30,
            mass: 0.9,
          }}
          onLayoutAnimationComplete={() => {
            if (phase === "bar-returning") setPhase("idle");
          }}
          className={`relative flex flex-col items-center w-full ${phase === "active" || phase === "results-exiting" ? "mt-16 mb-6" : "my-auto"}`}
        >
          <AnimatePresence
            onExitComplete={() => {
              if (phase === "title-exiting") setPhase("active");
            }}
          >
            {phase === "idle" && (
              <motion.h1
                variants={titleContainerVariants}
                initial="hidden"
                animate="visible"
                exit={{
                  opacity: 0,
                  y: 20,
                  transition: { duration: 0.18, ease: "easeIn" },
                }}
                className="absolute bottom-full mb-10 flex flex-wrap justify-center gap-x-[0.3em] text-4xl font-light tracking-tight text-white overflow-hidden w-full"
              >
                {titleWords.map((word, i) => (
                  <span key={i} className="overflow-hidden inline-block">
                    <motion.span
                      variants={titleWordVariants}
                      className="inline-block"
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </motion.h1>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="w-full max-w-2xl px-6">
            <div className="relative flex items-center gap-3 rounded-full bg-zinc-800/80 px-6 py-4 shadow-[0_8px_40px_rgba(0,0,0,0.7)] transition-all">
              {loading ? (
                <Loader2 className="h-5 w-5 shrink-0 text-zinc-400 animate-spin" />
              ) : (
                <Search className="h-5 w-5 shrink-0 text-zinc-400" />
              )}
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un film, une serie..."
                className="flex-1 bg-transparent text-white placeholder:text-zinc-500 outline-none text-lg pr-10"
              />
              <AnimatePresence>
                {(query.trim() || results !== null) && (
                  <motion.button
                    key="clear-btn"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setError(null);
                      const hasResults = results !== null && results.length > 0;
                      setResults(null);
                      setPhase((prev) => {
                        if (prev !== "active") return "idle";
                        return hasResults ? "results-exiting" : "bar-returning";
                      });
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700/80 hover:bg-zinc-600/80 transition-colors"
                  >
                    <X className="h-4 w-4 text-zinc-300" />
                  </motion.button>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {query.trim() && (
                  <motion.button
                    key="submit-btn"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    type="submit"
                    className="absolute right-12 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors"
                  >
                    <ArrowUp className="h-4 w-4 text-white" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </form>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-red-400 text-sm px-6"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "active" && results !== null && results.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-zinc-500 text-sm"
            >
              Aucun resultat pour "{query}".
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence
          onExitComplete={() => {
            if (phase === "results-exiting") setPhase("bar-returning");
          }}
        >
          {phase === "active" && results && results.length > 0 && (
            <motion.div
              key={searchKey}
              className="w-full max-w-2xl px-6 space-y-2 pb-6"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 14, transition: { duration: 0.2, ease: "easeIn" } }}
            >
              <div className="flex flex-wrap items-center gap-2 pb-1">
                {CATEGORY_FILTERS.map(({ key, label, icon: Icon, color }) => {
                  const count = groupCounts.get(key);
                  if (!count) return null;
                  const active = activeCats.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() =>
                        setActiveCats((prev) =>
                          prev.includes(key)
                            ? prev.filter((k) => k !== key)
                            : [...prev, key],
                        )
                      }
                      className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium ring-1 transition-colors ${
                        active
                          ? "bg-indigo-600 text-white ring-indigo-500"
                          : "bg-zinc-800/80 text-zinc-400 ring-white/10 hover:bg-zinc-700/80 hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`h-3.5 w-3.5 ${active ? "text-white" : color}`}
                      />
                      {label}
                      <span className={active ? "text-indigo-200" : "text-zinc-600"}>
                        {count}
                      </span>
                    </button>
                  );
                })}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-full bg-zinc-800/80 ring-1 ring-white/10 text-xs font-medium text-zinc-400 hover:bg-zinc-700/80 hover:text-white transition-colors">
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      {SORT_LABELS[sortBy]}
                      {sortBy !== "pertinence" &&
                        (sortDir === "desc" ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUp className="h-3 w-3" />
                        ))}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Trier par
                    </DropdownMenuLabel>
                    {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={sortBy === key}
                        onSelect={(e) => e.preventDefault()}
                        onCheckedChange={() => setSortBy(key)}
                      >
                        {SORT_LABELS[key]}
                      </DropdownMenuCheckboxItem>
                    ))}
                    {sortBy !== "pertinence" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                          Ordre
                        </DropdownMenuLabel>
                        <DropdownMenuCheckboxItem
                          checked={sortDir === "desc"}
                          onSelect={(e) => e.preventDefault()}
                          onCheckedChange={() => setSortDir("desc")}
                        >
                          <ArrowDown className="mr-2 h-3.5 w-3.5" />
                          Décroissant
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={sortDir === "asc"}
                          onSelect={(e) => e.preventDefault()}
                          onCheckedChange={() => setSortDir("asc")}
                        >
                          <ArrowUp className="mr-2 h-3.5 w-3.5" />
                          Croissant
                        </DropdownMenuCheckboxItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {(qualityCounts.size > 0 || codecCounts.size > 0) && (
                <div className="flex flex-wrap items-center gap-2 pb-1">
                  {QUALITY_ORDER.filter((q) => qualityCounts.has(q)).map(
                    (q) => {
                      const active = activeQualities.includes(q);
                      return (
                        <button
                          key={q}
                          onClick={() =>
                            setActiveQualities((prev) =>
                              prev.includes(q)
                                ? prev.filter((x) => x !== q)
                                : [...prev, q],
                            )
                          }
                          className={`flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ring-1 transition-colors ${
                            active
                              ? "bg-indigo-600 text-white ring-indigo-500"
                              : "bg-zinc-800/80 text-zinc-400 ring-white/10 hover:bg-zinc-700/80 hover:text-white"
                          }`}
                        >
                          {q}
                          <span className={active ? "text-indigo-200" : "text-zinc-600"}>
                            {qualityCounts.get(q)}
                          </span>
                        </button>
                      );
                    },
                  )}
                  {qualityCounts.size > 0 && codecCounts.size > 0 && (
                    <div className="h-4 w-px bg-white/10" />
                  )}
                  {[...codecCounts.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .map(([codec, count]) => {
                      const active = activeCodecs.includes(codec);
                      return (
                        <button
                          key={codec}
                          onClick={() =>
                            setActiveCodecs((prev) =>
                              prev.includes(codec)
                                ? prev.filter((x) => x !== codec)
                                : [...prev, codec],
                            )
                          }
                          className={`flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ring-1 transition-colors ${
                            active
                              ? "bg-indigo-600 text-white ring-indigo-500"
                              : "bg-zinc-800/80 text-zinc-400 ring-white/10 hover:bg-zinc-700/80 hover:text-white"
                          }`}
                        >
                          {codec}
                          <span className={active ? "text-indigo-200" : "text-zinc-600"}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
              {displayed.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-zinc-500 py-4"
                >
                  Aucun résultat avec ces filtres.
                </motion.p>
              )}
              <AnimatePresence mode="popLayout">
              {displayed.map((r, i) => {
                const { icon: Icon, color } = getCategoryIcon(r.category);
                const parsed = simpleSearchView ? parseRelease(r.title) : null;
                return (
                  <motion.div
                    key={r.guid || `${r.title}-${r.size}`}
                    layout
                    custom={i}
                    variants={itemVariants}
                    exit={{
                      opacity: 0,
                      scale: 0.96,
                      transition: { duration: 0.15, ease: "easeIn" },
                    }}
                    className="flex items-center gap-4 rounded-lg bg-zinc-800/60 ring-1 ring-white/8 px-4 py-3 transition-colors duration-150 hover:bg-zinc-700/60 hover:ring-white/15"
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                    <div className="min-w-0 flex-1">
                      {parsed && (parsed.quality || parsed.codec) && (
                        <div className="flex items-center gap-1.5 mb-1">
                          {parsed.quality && (
                            <span className="rounded-md bg-indigo-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-300">
                              {parsed.quality}
                            </span>
                          )}
                          {parsed.codec && (
                            <span className="rounded-md bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                              {parsed.codec}
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-white font-medium leading-snug line-clamp-2">
                        {parsed ? parsed.title : r.title}
                      </p>
                      <div className="mt-1 flex items-center gap-4 text-xs text-zinc-500">
                        <span>{formatSize(r.size)}</span>
                        <span className="text-green-500">
                          {r.seeders} Seeders
                        </span>
                        <span className="text-red-500">
                          {r.leechers} Leechers
                        </span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSendToDebrid(r, i)}
                      disabled={sendingIndex !== null}
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/80 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {sendingIndex === i ? (
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      ) : (
                        <CircleFadingArrowUp className="h-4 w-4 text-white" />
                      )}
                    </motion.button>
                  </motion.div>
                );
              })}
              </AnimatePresence>
              {hasMore && (
                <motion.div layout className="flex justify-center pt-3">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 h-9 px-5 rounded-full bg-zinc-800/80 ring-1 ring-white/10 text-sm text-zinc-300 hover:bg-zinc-700/80 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {loadingMore && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Charger plus
                    {total !== null && (
                      <span className="text-zinc-500">
                        {results.length} / {total}
                      </span>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
              {/* Header */}
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

              {/* File list */}
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
                            downloadingLink !== null || copiedLink !== null || vlcLink !== null
                          }
                          className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {vlcLink === file.link ? (
                            <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                          ) : (
                            <img src={vlcLogo} className="h-4 w-4" />
                          )}
                          <span className="text-xs font-medium text-white">Lire avec VLC</span>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleCopyLink(file.link)}
                          disabled={
                            downloadingLink !== null || copiedLink !== null || vlcLink !== null
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
                            downloadingLink !== null || copiedLink !== null || vlcLink !== null
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
