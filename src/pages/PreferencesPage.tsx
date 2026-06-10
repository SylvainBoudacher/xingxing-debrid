import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Eye, Menu, KeyRound, Magnet } from "lucide-react";
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

interface PreferencesPageProps {
  onBack: () => void;
  onNavigate: (page: "magnets") => void;
}

export function PreferencesPage({ onBack, onNavigate }: PreferencesPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("simple");

  useEffect(() => {
    store.get<ViewMode>("view_mode").then((v) => { if (v) setViewMode(v); });
  }, []);

  async function handleChange(mode: ViewMode) {
    setViewMode(mode);
    await store.set("view_mode", mode);
    await store.save();
  }

  const parsed = parseRelease(EXAMPLE);

  return (
    <main className="relative flex min-h-screen flex-col bg-[#05060c]">
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.13)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.13)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:linear-gradient(to_right,black,transparent_38%,transparent_62%,black),radial-gradient(ellipse_85%_80%_at_50%_0%,black_25%,transparent_90%)] [mask-composite:intersect]" />

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-black/30 backdrop-blur-xl">
        <div className="relative mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4 sm:px-8">
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
              <DropdownMenuItem onClick={() => onNavigate("magnets")}>
                <Magnet className="mr-2 h-4 w-4" />
                Magnets
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative mx-auto w-full max-w-xl px-6 pt-10 pb-10 sm:px-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <Eye className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Affichage des titres</h2>
        </div>
        <p className="text-xs text-zinc-500 mb-5">
          La vue simplifiée reformate les noms de fichiers et affiche la qualité et le codec en labels.
        </p>

        <div className="flex gap-1 rounded-xl bg-zinc-900/80 p-1 ring-1 ring-white/8 mb-6">
          {([
            { key: "simple", label: "Simplifiée" },
            { key: "detailed", label: "Détaillée" },
          ] as { key: ViewMode; label: string }[]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleChange(opt.key)}
              className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-all ${
                viewMode === opt.key
                  ? "bg-indigo-600 text-white shadow"
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

        <div className="my-8 h-px bg-white/8" />

        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Clés API</h2>
        </div>
        <p className="text-xs text-zinc-500 mb-5">
          Les clés C411 et AllDebrid utilisées par l'application.
        </p>

        <div className="dark">
          <ApiKeysForm />
        </div>
      </motion.div>
    </main>
  );
}
