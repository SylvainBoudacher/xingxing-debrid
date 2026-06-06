import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Search, Menu, KeyRound, Loader2, ArrowUp, X,
  Clapperboard, Tv, Music, Headphones, Book, BookMarked,
  Gamepad2, Package, FileText, Sparkles, HelpCircle, Send, Download, Magnet,
  type LucideIcon,
} from "lucide-react";
import { LazyStore } from "@tauri-apps/plugin-store";
import { fetch } from "@tauri-apps/plugin-http";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

const titleWords = "Que voulez-vous regarder ?".split(" ");

const titleContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const titleWordVariants = {
  hidden: { y: "110%", opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
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
  if (id === 2060 || id === 5070) return { icon: Sparkles,     color: "text-pink-400"   };
  if (id === 2070)                 return { icon: FileText,     color: "text-yellow-400" };
  if (id >= 2000 && id < 3000)    return { icon: Clapperboard, color: "text-blue-400"   };
  if (id === 3030)                 return { icon: Headphones,   color: "text-orange-400" };
  if (id >= 3000 && id < 4000)    return { icon: Music,        color: "text-purple-400" };
  if (id === 4050)                 return { icon: Gamepad2,     color: "text-green-400"  };
  if (id >= 4000 && id < 5000)    return { icon: Package,      color: "text-zinc-400"   };
  if (id >= 5000 && id < 6000)    return { icon: Tv,           color: "text-cyan-400"   };
  if (id === 7030)                 return { icon: BookMarked,   color: "text-rose-400"   };
  if (id >= 7000)                  return { icon: Book,         color: "text-amber-400"  };
  return                                  { icon: HelpCircle,  color: "text-zinc-500"   };
}

function parseXml(xml: string): SearchResult[] {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const items = doc.querySelectorAll("item");

  return Array.from(items).map((item) => {
    const text = (tag: string) => item.querySelector(tag)?.textContent?.trim() ?? "";
    const attr = (name: string) =>
      item.querySelector(`[name="${name}"]`)?.getAttribute("value") ?? "";

    const sizeText = text("size") || item.querySelector("enclosure")?.getAttribute("length") || "0";
    const categoryRaw = attr("category");

    return {
      title: text("title"),
      size: parseInt(sizeText, 10),
      seeders: parseInt(attr("seeders") || "0", 10),
      leechers: Math.max(0, parseInt(attr("peers") || "0", 10) - parseInt(attr("seeders") || "0", 10)),
      magnetUrl: attr("magneturl"),
      guid: text("guid"),
      downloadUrl: text("link"),
      pubDate: text("pubDate"),
      category: parseInt(categoryRaw || "0", 10),
    };
  });
}

function formatSize(bytes: number): string {
  if (!bytes) return "-";
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} Go`;
  return `${(bytes / 1_048_576).toFixed(0)} Mo`;
}

interface MainPageProps {
  onNavigate: (page: "settings" | "magnets") => void;
}

export function MainPage({ onNavigate }: MainPageProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState(0);
  const [phase, setPhase] = useState<"idle" | "title-exiting" | "active" | "bar-returning">("idle");
  const [sendingIndex, setSendingIndex] = useState<number | null>(null);
  const [debridModal, setDebridModal] = useState<DebridModal | null>(null);
  const [downloadingLink, setDownloadingLink] = useState<string | null>(null);
  const apiKeyRef = useRef<string>("");
  const allDebridKeyRef = useRef<string>("");

  useEffect(() => {
    store.get<string>("c411_api_key").then((v) => { if (v) apiKeyRef.current = v; });
    store.get<string>("alldebrid_api_key").then((v) => { if (v) allDebridKeyRef.current = v; });
  }, []);

  async function handleSendToDebrid(result: SearchResult, index: number) {
    if (sendingIndex !== null) return;
    if (!allDebridKeyRef.current) {
      toast.error("Cle AllDebrid manquante. Configurez-la dans les parametres.");
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
      const json = await invoke<{ status: string; data?: { files?: Array<{ id: number; name: string }> }; error?: { message: string } }>(
        "upload_torrent_to_debrid",
        { torrentUrl, alldebridKey: allDebridKeyRef.current }
      );

      if (json.status !== "success") throw new Error(json.error?.message ?? "Erreur AllDebrid inconnue");

      const uploaded = json.data?.files?.[0] as { id: number; name: string; ready: boolean } | undefined;
      if (!uploaded) throw new Error("Reponse AllDebrid inattendue");

      if (uploaded.ready) {
        const filesJson = await invoke<{ status: string; data?: { magnets?: Array<{ files?: unknown[] }> } }>(
          "get_magnet_files",
          { id: uploaded.id, alldebridKey: allDebridKeyRef.current }
        );
        const rawFiles = filesJson.data?.magnets?.[0]?.files ?? [];
        const files = flattenFiles(rawFiles);
        setDebridModal({ torrentName: uploaded.name ?? result.title, files });
      } else {
        toast.success(`Envoye vers AllDebrid : ${uploaded.name ?? result.title} (en cours de debridage)`);
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSendingIndex(null);
    }
  }

  async function handleDownloadFile(link: string) {
    setDownloadingLink(link);
    try {
      const url = await invoke<string>("unlock_link", { link, alldebridKey: allDebridKeyRef.current });
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

    setPhase((prev) => prev === "idle" ? "title-exiting" : "active");
    setLoading(true);
    setError(null);

    try {
      const url = `https://c411.org/api?t=search&q=${encodeURIComponent(query.trim())}&apikey=${apiKeyRef.current}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const xml = await res.text();
      console.log("[C411 raw response]", xml);
      setSearchKey((k) => k + 1);
      setResults(parseXml(xml));
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-black bg-[radial-gradient(ellipse_70%_45%_at_50%_52%,_#0c1d56_0%,_#04091a_45%,_#000000_75%)]">
      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/80 ring-1 ring-white/10 text-zinc-400 hover:text-white hover:bg-zinc-700/80 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onNavigate("magnets")}>
              <Magnet className="mr-2 h-4 w-4" />
              Magnets
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate("settings")}>
              <KeyRound className="mr-2 h-4 w-4" />
              Cles API
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 flex flex-col items-center overflow-y-auto">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 160, damping: 30, mass: 1.1 }}
          onLayoutAnimationComplete={() => {
            if (phase === "bar-returning") setPhase("idle");
          }}
          className={`relative flex flex-col items-center w-full ${phase === "active" ? "mt-16 mb-6" : "my-auto"}`}
        >
          <AnimatePresence onExitComplete={() => {
            if (phase === "title-exiting") setPhase("active");
          }}>
            {phase === "idle" && (
              <motion.h1
                variants={titleContainerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: 20, transition: { duration: 0.18, ease: "easeIn" } }}
                className="absolute bottom-full mb-10 flex flex-wrap justify-center gap-x-[0.3em] text-4xl font-light tracking-tight text-white overflow-hidden w-full"
              >
                {titleWords.map((word, i) => (
                  <span key={i} className="overflow-hidden inline-block">
                    <motion.span variants={titleWordVariants} className="inline-block">
                      {word}
                    </motion.span>
                  </span>
                ))}
              </motion.h1>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="w-full max-w-2xl px-6">
            <div className="relative flex items-center gap-3 rounded-full bg-zinc-800/80 px-6 py-4 shadow-[0_8px_40px_rgba(0,0,0,0.7)] transition-all">
              {loading
                ? <Loader2 className="h-5 w-5 shrink-0 text-zinc-400 animate-spin" />
                : <Search className="h-5 w-5 shrink-0 text-zinc-400" />
              }
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  if (!val) {
                    setResults(null);
                    setError(null);
                    setPhase((prev) => prev === "active" ? "bar-returning" : "idle");
                  }
                }}
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
                    onClick={() => { setQuery(""); setResults(null); setError(null); setPhase((prev) => prev === "active" ? "bar-returning" : "idle"); }}
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

        <AnimatePresence mode="popLayout">
          {phase === "active" && results && results.length > 0 && (
            <motion.div
              key={searchKey}
              className="w-full max-w-2xl px-6 space-y-2 pb-6"
              variants={listVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {results.map((r, i) => {
                const { icon: Icon, color } = getCategoryIcon(r.category);
                return (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    whileHover={{ scale: 1.015, backgroundColor: "rgba(63,63,70,0.6)" }}
                    className="flex items-center gap-4 rounded-lg bg-zinc-800/60 ring-1 ring-white/8 px-4 py-3"
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white font-medium leading-snug line-clamp-2">{r.title}</p>
                      <div className="mt-1 flex items-center gap-4 text-xs text-zinc-500">
                        <span>{formatSize(r.size)}</span>
                        <span className="text-green-500">{r.seeders} Seeders</span>
                        <span className="text-red-500">{r.leechers} Leechers</span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSendToDebrid(r, i)}
                      disabled={sendingIndex !== null}
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/80 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {sendingIndex === i
                        ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                        : <Send className="h-4 w-4 text-white" />
                      }
                    </motion.button>
                  </motion.div>
                );
              })}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={() => setDebridModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl bg-zinc-900 ring-1 ring-white/10 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <p className="text-sm font-medium text-white truncate pr-4">{debridModal.torrentName}</p>
                <button onClick={() => setDebridModal(null)} className="shrink-0 text-zinc-500 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
                {debridModal.files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{file.name.split("/").pop()}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{formatSize(file.size)}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDownloadFile(file.link)}
                      disabled={downloadingLink !== null}
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/80 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {downloadingLink === file.link
                        ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                        : <Download className="h-4 w-4 text-white" />
                      }
                    </motion.button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
