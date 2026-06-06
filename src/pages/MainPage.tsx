import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Search, Menu, KeyRound, Loader2, ArrowUp, X,
  Clapperboard, Tv, Music, Headphones, Book, BookMarked,
  Gamepad2, Package, FileText, Sparkles, HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { LazyStore } from "@tauri-apps/plugin-store";
import { fetch } from "@tauri-apps/plugin-http";
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
  pubDate: string;
  category: number;
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
  onNavigate: (page: "settings") => void;
}

export function MainPage({ onNavigate }: MainPageProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState(0);
  const [phase, setPhase] = useState<"idle" | "title-exiting" | "active" | "bar-returning">("idle");
  const apiKeyRef = useRef<string>("");

  useEffect(() => {
    store.get<string>("c411_api_key").then((v) => {
      if (v) apiKeyRef.current = v;
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setPhase("title-exiting");
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
                    whileTap={{ scale: 0.985 }}
                    className="flex items-center gap-4 rounded-lg bg-zinc-800/60 ring-1 ring-white/8 px-4 py-3 cursor-pointer"
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
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
