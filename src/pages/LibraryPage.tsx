import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { invoke } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";
import { ArrowLeft, Library as LibraryIcon } from "lucide-react";
import { AppMenu, type Page } from "@/components/AppMenu";
import { LibraryEntryCard } from "@/components/LibraryEntryCard";
import { useDebridActions } from "@/lib/useDebridActions";
import { flattenFiles } from "@/lib/debrid";
import type { ViewMode } from "@/pages/PreferencesPage";
import {
  applyEnrichment,
  isWholeWatched,
  loadLibrary,
  saveLibrary,
  type LibraryEntry,
} from "@/lib/library";

interface LibraryPageProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  hasPendingUpdate: boolean;
  onShowPendingUpdate: () => void;
  initialAllDebridKey?: string | null;
  initialViewMode?: ViewMode;
}

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

type Filter = "all" | "todo" | "done";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "todo", label: "À voir" },
  { id: "done", label: "Vu" },
];

export function LibraryPage({
  onBack,
  onNavigate,
  hasPendingUpdate,
  onShowPendingUpdate,
  initialAllDebridKey,
  initialViewMode,
}: LibraryPageProps) {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode ?? "simple");
  const debrid = useDebridActions(() => initialAllDebridKey ?? "");

  // Récupère la liste des fichiers depuis AllDebrid pour les entrées non encore
  // enrichies (torrent envoyé pendant le débridage). Best-effort, échec silencieux.
  async function enrichMissing(loaded: LibraryEntry[]) {
    const key = initialAllDebridKey;
    if (!key) return;
    const pending = loaded.filter((e) => !e.enriched && e.magnetId != null);
    if (pending.length === 0) return;

    let changed = false;
    const byHash = new Map(loaded.map((e) => [e.infoHash, { ...e }]));
    for (const e of pending) {
      try {
        const filesJson = await invoke<{
          status: string;
          data?: { magnets?: Array<{ files?: unknown[] }> };
        }>("get_magnet_files", { id: e.magnetId, alldebridKey: key });
        const rawFiles = filesJson.data?.magnets?.[0]?.files ?? [];
        if (filesJson.status !== "success" || rawFiles.length === 0) continue;
        const files = flattenFiles(rawFiles);
        const target = byHash.get(e.infoHash);
        if (!target) continue;
        byHash.set(e.infoHash, applyEnrichment(target, files));
        changed = true;
      } catch {
        // magnet retiré du compte partagé ou réseau : on garde la coche unique
      }
    }
    if (!changed) return;
    const next = [...byHash.values()].sort((a, b) => b.addedAt - a.addedAt);
    setEntries(next);
    await saveLibrary(next);
  }

  useEffect(() => {
    loadLibrary().then((loaded) => {
      setEntries([...loaded].sort((a, b) => b.addedAt - a.addedAt));
      enrichMissing(loaded);
    });
    if (initialViewMode === undefined) {
      store.get<ViewMode>("library_view_mode").then((v) => {
        if (v) setViewMode(v);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function persist(next: LibraryEntry[]) {
    setEntries(next);
    await saveLibrary(next);
  }

  function handleChange(updated: LibraryEntry) {
    persist(entries.map((e) => (e.infoHash === updated.infoHash ? updated : e)));
  }

  function handleRemove(infoHash: string) {
    persist(entries.filter((e) => e.infoHash !== infoHash));
  }

  const visible = entries.filter((e) => {
    if (filter === "all") return true;
    const done = isWholeWatched(e);
    return filter === "done" ? done : !done;
  });

  return (
    <main className="relative flex min-h-screen flex-col bg-[#f4f6fc] bg-[radial-gradient(ellipse_70%_45%_at_50%_20%,_#d7e0fb_0%,_#edf1fa_45%,_#fafbfe_75%)] dark:bg-black dark:bg-[radial-gradient(ellipse_70%_45%_at_50%_20%,_#0c1d56_0%,_#04091a_45%,_#000000_75%)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-10 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/30 backdrop-blur-xl"
      >
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 sm:px-8">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onBack}
            className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </motion.button>

          <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
            Ma bibliothèque
          </h1>

          <AppMenu
            currentPage="library"
            onNavigate={onNavigate}
            onBack={onBack}
            hasPendingUpdate={hasPendingUpdate}
            onShowPendingUpdate={onShowPendingUpdate}
          />
        </div>
      </motion.div>

      <div className="mx-auto w-full max-w-3xl flex-1 px-6 pt-6 pb-10 sm:px-8">
        {/* Filtres */}
        <div className="mb-4 flex items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f.id
                  ? "bg-indigo-600 text-white"
                  : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="mt-24 flex flex-col items-center gap-3 text-center text-zinc-400 dark:text-zinc-500">
            <LibraryIcon className="h-10 w-10" strokeWidth={1.5} />
            <p className="text-sm">
              {entries.length === 0
                ? "Aucun téléchargement pour l'instant."
                : "Rien ne correspond à ce filtre."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((e) => (
              <LibraryEntryCard
                key={e.infoHash}
                entry={e}
                onChange={handleChange}
                onRemove={handleRemove}
                debrid={debrid}
                simple={viewMode === "simple"}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
