import { useEffect, useRef, useState } from "react";
import {
  Search, Menu, KeyRound, Loader2, ArrowUp,
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
  const apiKeyRef = useRef<string>("");

  useEffect(() => {
    store.get<string>("c411_api_key").then((v) => {
      if (v) apiKeyRef.current = v;
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const url = `https://c411.org/api?t=search&q=${encodeURIComponent(query.trim())}&apikey=${apiKeyRef.current}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const xml = await res.text();
      console.log("[C411 raw response]", xml);
      setResults(parseXml(xml));
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const hasResults = results !== null;

  return (
    <main className="relative flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_center,_#1e2a45_0%,_#0d1117_70%)]">
      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/80 ring-1 ring-white/10 text-zinc-400 hover:text-white hover:bg-zinc-700/80 transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onNavigate("settings")}>
              <KeyRound className="mr-2 h-4 w-4" />
              Cles API
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className={`flex flex-col items-center gap-10 transition-all duration-500 ${hasResults ? "pt-16 pb-6" : "flex-1 justify-center pb-0"}`}>
        {!hasResults && (
          <h1 className="text-4xl font-light tracking-tight text-white">
            Que voulez-vous regarder ?
          </h1>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-2xl px-6">
          <div className="relative flex items-center gap-3 rounded-full bg-zinc-800/80 px-6 py-4 ring-1 ring-white/10 focus-within:ring-white/25 transition-all">
            {loading
              ? <Loader2 className="h-5 w-5 shrink-0 text-zinc-400 animate-spin" />
              : <Search className="h-5 w-5 shrink-0 text-zinc-400" />
            }
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un film, une serie..."
              className="flex-1 bg-transparent text-white placeholder:text-zinc-500 outline-none text-lg pr-10"
            />
            {query.trim() && (
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors"
              >
                <ArrowUp className="h-4 w-4 text-white" />
              </button>
            )}
          </div>
        </form>

        {error && (
          <p className="text-red-400 text-sm px-6">{error}</p>
        )}

        {results !== null && results.length === 0 && (
          <p className="text-zinc-500 text-sm">Aucun resultat pour "{query}".</p>
        )}

        {results && results.length > 0 && (
          <div className="w-full max-w-2xl px-6 space-y-2">
            {results.map((r, i) => {
              const { icon: Icon, color } = getCategoryIcon(r.category);
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-lg bg-zinc-800/60 ring-1 ring-white/8 px-4 py-3 hover:bg-zinc-700/60 transition-colors cursor-pointer"
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
