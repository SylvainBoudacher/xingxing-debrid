import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Check, Compass, Download, Home, Menu, KeyRound, Magnet, ScrollText, Search, Upload } from "lucide-react";
import { LazyStore } from "@tauri-apps/plugin-store";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { getLikes, parseLikesJson, saveLikes } from "@/lib/likes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  { id: "section-discover", label: "Découverte", icon: Compass },
  { id: "section-api-keys", label: "Clés API", icon: KeyRound },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function ViewOptionCard({ label, selected, onClick, children }: {
  label: string;
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col rounded-xl px-4 py-3 text-left transition-all ${
        selected
          ? "bg-indigo-500/[0.07] ring-2 ring-indigo-500"
          : "bg-zinc-900/80 ring-1 ring-white/8 hover:ring-white/20"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold ${selected ? "text-indigo-300" : "text-zinc-400"}`}>{label}</span>
        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${selected ? "bg-indigo-500" : "ring-1 ring-white/15"}`}>
          {selected && <Check className="h-2.5 w-2.5 text-white" />}
        </span>
      </div>
      {children}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-indigo-600" : "bg-zinc-700"
      }`}
    >
      <motion.div
        initial={false}
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow"
      />
    </button>
  );
}

interface PreferencesPageProps {
  onBack: () => void;
  onNavigate: (page: "magnets" | "patchnotes") => void;
}

export function PreferencesPage({ onBack, onNavigate }: PreferencesPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("simple");
  const [searchViewMode, setSearchViewMode] = useState<ViewMode>("simple");
  const [hideNfo, setHideNfo] = useState(true);
  const [skipNfoDownload, setSkipNfoDownload] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>("section-search");
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    store.get<ViewMode>("view_mode").then((v) => { if (v) setViewMode(v); });
    store.get<ViewMode>("search_view_mode").then((v) => { if (v) setSearchViewMode(v); });
    store.get<boolean>("hide_nfo_files").then((v) => setHideNfo(v ?? true));
    store.get<boolean>("skip_nfo_download").then((v) => setSkipNfoDownload(v ?? true));
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

  async function handleHideNfoChange(v: boolean) {
    setHideNfo(v);
    await store.set("hide_nfo_files", v);
    await store.save();
  }

  async function handleSkipNfoDownloadChange(v: boolean) {
    setSkipNfoDownload(v);
    await store.set("skip_nfo_download", v);
    await store.save();
  }

  async function handleExportLikes() {
    try {
      const likes = await getLikes();
      const path = await invoke<string>("export_likes", {
        content: JSON.stringify(likes, null, 2),
      });
      toast.success(`Liste exportée : ${path}`);
    } catch (e) {
      toast.error(`Export impossible : ${e}`);
    }
  }

  async function handleImportLikes(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const imported = parseLikesJson(await file.text());
      const existing = await getLikes();
      const keys = new Set(existing.map((l) => `${l.mediaType}-${l.id}`));
      const added = imported.filter((l) => !keys.has(`${l.mediaType}-${l.id}`));
      await saveLikes([...added, ...existing]);
      toast.success(
        added.length
          ? `${added.length} contenu${added.length > 1 ? "s" : ""} importé${added.length > 1 ? "s" : ""}`
          : "Aucun nouveau contenu à importer",
      );
    } catch {
      toast.error("Fichier invalide");
    }
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate("patchnotes")}>
                <ScrollText className="mr-2 h-4 w-4" />
                Patch notes
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
          className="min-w-0 max-w-xl flex-1 space-y-8"
        >
          {/* Recherche */}
          <section id="section-search" className="scroll-mt-24 rounded-2xl bg-[#0b0c13] ring-1 ring-white/6 overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/6 bg-white/[0.02] px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 ring-1 ring-indigo-500/25">
                <Search className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white tracking-tight">Recherche</h2>
                <p className="text-xs text-zinc-500">Paramètres des résultats de recherche.</p>
              </div>
            </div>

            <div className="px-6 py-5">
              <h3 className="text-sm font-semibold text-white mb-1">Affichage des résultats de recherche</h3>
              <p className="text-xs text-zinc-500 mb-5">
                Cliquez sur l'affichage que vous préférez pour les résultats de recherche.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <ViewOptionCard
                  label="Simplifiée"
                  selected={searchViewMode === "simple"}
                  onClick={() => handleSearchChange("simple")}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {searchParsed.quality && (
                      <span className="rounded-md bg-indigo-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-300">{searchParsed.quality}</span>
                    )}
                    {searchParsed.codec && (
                      <span className="rounded-md bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{searchParsed.codec}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white leading-snug">{searchParsed.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span>8.2 Go</span>
                    <span className="text-green-500">124 Seeders</span>
                    <span className="text-red-500">7 Leechers</span>
                  </div>
                </ViewOptionCard>

                <ViewOptionCard
                  label="Détaillée"
                  selected={searchViewMode === "detailed"}
                  onClick={() => handleSearchChange("detailed")}
                >
                  <p className="text-sm font-semibold text-white leading-snug break-all">{SEARCH_EXAMPLE}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span>8.2 Go</span>
                    <span className="text-green-500">124 Seeders</span>
                    <span className="text-red-500">7 Leechers</span>
                  </div>
                </ViewOptionCard>
              </div>
            </div>
          </section>

          {/* Magnets */}
          <section id="section-magnets" className="scroll-mt-24 rounded-2xl bg-[#0b0c13] ring-1 ring-white/6 overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/6 bg-white/[0.02] px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 ring-1 ring-indigo-500/25">
                <Magnet className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white tracking-tight">Magnets</h2>
                <p className="text-xs text-zinc-500">Paramètres de la page magnets et des téléchargements.</p>
              </div>
            </div>

            <div className="px-6 py-5">
              <h3 className="text-sm font-semibold text-white mb-1">Affichage des noms de fichiers</h3>
              <p className="text-xs text-zinc-500 mb-5">
                Cliquez sur l'affichage que vous préférez pour vos magnets et leurs fichiers.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <ViewOptionCard
                  label="Simplifiée"
                  selected={viewMode === "simple"}
                  onClick={() => handleChange("simple")}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {parsed.quality && (
                      <span className="rounded-md bg-indigo-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-300">{parsed.quality}</span>
                    )}
                    {parsed.codec && (
                      <span className="rounded-md bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{parsed.codec}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white leading-snug">{parsed.title}</p>
                </ViewOptionCard>

                <ViewOptionCard
                  label="Détaillée"
                  selected={viewMode === "detailed"}
                  onClick={() => handleChange("detailed")}
                >
                  <p className="text-sm font-semibold text-white leading-snug break-all">{EXAMPLE}</p>
                </ViewOptionCard>
              </div>

              <div className="my-6 h-px bg-white/8" />

              <h3 className="text-sm font-semibold text-white mb-1">Fichiers .nfo</h3>
              <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                Un fichier .nfo est un petit fichier texte ajouté par les teams de release pour décrire le contenu (qualité, langue, source). Il n'est pas nécessaire pour regarder vos films et séries.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-900/80 ring-1 ring-white/8 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">Ne pas afficher les fichiers .nfo</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Les masque dans la liste des fichiers d'un magnet.</p>
                  </div>
                  <Toggle checked={hideNfo} onChange={handleHideNfoChange} />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-900/80 ring-1 ring-white/8 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">Ne pas télécharger les fichiers .nfo</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Les exclut des téléchargements groupés ("Tout télécharger").</p>
                  </div>
                  <Toggle checked={skipNfoDownload} onChange={handleSkipNfoDownloadChange} />
                </div>
              </div>
            </div>
          </section>

          {/* Découverte */}
          <section id="section-discover" className="scroll-mt-24 rounded-2xl bg-[#0b0c13] ring-1 ring-white/6 overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/6 bg-white/[0.02] px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 ring-1 ring-indigo-500/25">
                <Compass className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white tracking-tight">Découverte</h2>
                <p className="text-xs text-zinc-500">Paramètres de la page Découverte.</p>
              </div>
            </div>

            <div className="px-6 py-5">
              <h3 className="text-sm font-semibold text-white mb-1">Ma liste</h3>
              <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                Sauvegardez les contenus likés dans un fichier JSON ou restaurez une liste depuis un fichier. L'import fusionne avec la liste actuelle sans créer de doublons.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportLikes}
                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exporter ma liste
                </button>
                <button
                  onClick={() => importInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-full bg-zinc-800/80 ring-1 ring-white/10 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700/80 hover:text-white transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Importer une liste
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={handleImportLikes}
                />
              </div>
            </div>
          </section>

          {/* Clés API */}
          <section id="section-api-keys" className="scroll-mt-24 rounded-2xl bg-[#0b0c13] ring-1 ring-white/6 overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/6 bg-white/[0.02] px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 ring-1 ring-indigo-500/25">
                <KeyRound className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white tracking-tight">Clés API</h2>
                <p className="text-xs text-zinc-500">Les clés C411 et AllDebrid utilisées par l'application.</p>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="dark">
                <ApiKeysForm />
              </div>
            </div>
          </section>
        </motion.div>
      </div>
    </main>
  );
}
