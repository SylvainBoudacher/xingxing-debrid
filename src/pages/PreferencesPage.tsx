import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Home, Menu, KeyRound, Magnet, Search } from "lucide-react";
import { LazyStore } from "@tauri-apps/plugin-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parseRelease } from "@/lib/parseRelease";
import { ApiKeysForm } from "@/components/ApiKeysForm";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

export type ViewMode = "simple" | "detailed";

const EXAMPLE = "Apple.Cider.Vinegar.S01E01.MULTi.1080p.WEB.H265-CHiLL.mkv";
const SEARCH_EXAMPLE = "Dune.Part.Two.2024.MULTi.2160p.WEB.H265-Slay3R";

const SECTIONS = [
  { id: "section-search", label: "Recherche", icon: Search },
  { id: "section-magnets", label: "Magnets", icon: Magnet },
  { id: "section-api-keys", label: "Clés API", icon: KeyRound },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

interface PreferencesPageProps {
  onBack: () => void;
  onNavigate: (page: "magnets") => void;
}

export function PreferencesPage({ onBack, onNavigate }: PreferencesPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("simple");
  const [searchViewMode, setSearchViewMode] = useState<ViewMode>("simple");
  const [activeSection, setActiveSection] = useState<SectionId>("section-search");

  useEffect(() => {
    store.get<ViewMode>("view_mode").then((v) => { if (v) setViewMode(v); });
    store.get<ViewMode>("search_view_mode").then((v) => { if (v) setSearchViewMode(v); });
  }, []);

  useEffect(() => {
    function onScroll() {
      // At the bottom of the page the last section may never reach the top
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        setActiveSection(SECTIONS[SECTIONS.length - 1].id);
        return;
      }
      let current: SectionId = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 120) current = s.id;
      }
      setActiveSection(current);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToSection(id: SectionId) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleChange(mode: ViewMode) {
    setViewMode(mode);
    await store.set("view_mode", mode);
    await store.save();
  }

  async function handleSearchChange(mode: ViewMode) {
    setSearchViewMode(mode);
    await store.set("search_view_mode", mode);
    await store.save();
  }

  const parsed = parseRelease(EXAMPLE);
  const searchParsed = parseRelease(SEARCH_EXAMPLE);

  return (
    <main className="relative flex min-h-screen flex-col bg-[#05060c]">
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.13)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.13)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:linear-gradient(to_right,black,transparent_38%,transparent_62%,black),radial-gradient(ellipse_85%_80%_at_50%_0%,black_25%,transparent_90%)] [mask-composite:intersect]" />

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-black/30 backdrop-blur-xl">
        <div className="relative mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4 sm:px-8">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onBack}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </motion.button>

          <h1 className="text-sm font-semibold text-white tracking-tight absolute left-1/2 -translate-x-1/2">Paramètres</h1>

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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="relative mx-auto flex w-full max-w-4xl gap-10 px-6 pt-10 pb-10 sm:px-8">
        {/* Section nav */}
        <aside className="hidden md:block w-44 shrink-0">
          <nav className="sticky top-24 flex flex-col gap-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                  activeSection === s.id
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {activeSection === s.id && (
                  <motion.div
                    layoutId="section-nav-active"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-zinc-800/80 ring-1 ring-white/8"
                  />
                )}
                <s.icon className={`relative z-10 h-3.5 w-3.5 ${activeSection === s.id ? "text-indigo-400" : ""}`} />
                <span className="relative z-10">{s.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="min-w-0 max-w-xl flex-1"
        >
          {/* Recherche */}
          <section id="section-search" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <Search className="h-4 w-4 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Recherche</h2>
            </div>
            <p className="text-xs text-zinc-500 mb-6">
              Paramètres des résultats de recherche.
            </p>

            <h3 className="text-sm font-semibold text-white mb-1">Affichage de la recherche</h3>
            <p className="text-xs text-zinc-500 mb-5">
              La vue simplifiée reformate les titres des résultats de recherche et affiche la qualité et le codec en labels.
            </p>

            <div className="relative flex rounded-xl bg-zinc-900/80 p-1 ring-1 ring-white/8 mb-6">
              <motion.div
                initial={false}
                animate={{ x: searchViewMode === "simple" ? "0%" : "100%" }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-indigo-600 shadow"
              />
              {([
                { key: "simple", label: "Simplifiée" },
                { key: "detailed", label: "Détaillée" },
              ] as { key: ViewMode; label: string }[]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleSearchChange(opt.key)}
                  className={`relative z-10 flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                    searchViewMode === opt.key
                      ? "text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-zinc-600 uppercase tracking-wider font-medium mb-2">Aperçu</p>
            <div className="rounded-xl bg-zinc-900/80 ring-1 ring-white/8 px-4 py-3">
              {searchViewMode === "simple" ? (
                <>
                  <div className="flex items-center gap-1.5 mb-1">
                    {searchParsed.quality && (
                      <span className="rounded-md bg-indigo-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-300">{searchParsed.quality}</span>
                    )}
                    {searchParsed.codec && (
                      <span className="rounded-md bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{searchParsed.codec}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white leading-snug">{searchParsed.title}</p>
                </>
              ) : (
                <p className="text-sm font-semibold text-white leading-snug break-all">{SEARCH_EXAMPLE}</p>
              )}
              <div className="mt-1 flex items-center gap-4 text-xs text-zinc-500">
                <span>8.2 Go</span>
                <span className="text-green-500">124 Seeders</span>
                <span className="text-red-500">7 Leechers</span>
              </div>
            </div>
          </section>

          <div className="my-10 h-px bg-white/8" />

          {/* Magnets */}
          <section id="section-magnets" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <Magnet className="h-4 w-4 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Magnets</h2>
            </div>
            <p className="text-xs text-zinc-500 mb-6">
              Paramètres de la page magnets.
            </p>

            <h3 className="text-sm font-semibold text-white mb-1">Affichage des titres</h3>
            <p className="text-xs text-zinc-500 mb-5">
              La vue simplifiée reformate les noms de fichiers et affiche la qualité et le codec en labels.
            </p>

            <div className="relative flex rounded-xl bg-zinc-900/80 p-1 ring-1 ring-white/8 mb-6">
              <motion.div
                initial={false}
                animate={{ x: viewMode === "simple" ? "0%" : "100%" }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-indigo-600 shadow"
              />
              {([
                { key: "simple", label: "Simplifiée" },
                { key: "detailed", label: "Détaillée" },
              ] as { key: ViewMode; label: string }[]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleChange(opt.key)}
                  className={`relative z-10 flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                    viewMode === opt.key
                      ? "text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-zinc-600 uppercase tracking-wider font-medium mb-2">Aperçu</p>
            <div className="rounded-xl bg-zinc-900/80 ring-1 ring-white/8 px-4 py-3">
              {viewMode === "simple" ? (
                <>
                  <div className="flex items-center gap-1.5 mb-1">
                    {parsed.quality && (
                      <span className="rounded-md bg-indigo-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-300">{parsed.quality}</span>
                    )}
                    {parsed.codec && (
                      <span className="rounded-md bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{parsed.codec}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white leading-snug">{parsed.title}</p>
                </>
              ) : (
                <p className="text-sm font-semibold text-white leading-snug break-all">{EXAMPLE}</p>
              )}
            </div>
          </section>

          <div className="my-10 h-px bg-white/8" />

          {/* Clés API */}
          <section id="section-api-keys" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="h-4 w-4 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Clés API</h2>
            </div>
            <p className="text-xs text-zinc-500 mb-5">
              Les clés C411 et AllDebrid utilisées par l'application.
            </p>

            <div className="dark">
              <ApiKeysForm />
            </div>
          </section>
        </motion.div>
      </div>
    </main>
  );
}
