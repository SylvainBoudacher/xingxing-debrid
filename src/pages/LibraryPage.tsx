import { useEffect, useMemo, useState } from "react";
import { motion, Reorder, useDragControls } from "motion/react";
import { invoke } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";
import { ArrowLeft, Compass, GripVertical, Library as LibraryIcon, Search } from "lucide-react";
import { AppMenu, type Page } from "@/components/AppMenu";
import { LibraryEntryCard, type DebridControls } from "@/components/LibraryEntryCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebridActions } from "@/lib/useDebridActions";
import { flattenFiles, isVideoFile } from "@/lib/debrid";
import type { ViewMode } from "@/pages/PreferencesPage";
import {
  applyEnrichment,
  isWholeWatched,
  loadLibrary,
  progressRatio,
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

type Sort = "manual" | "recent" | "title" | "size" | "progress";

const SORTS: { id: Sort; label: string }[] = [
  { id: "manual", label: "Manuel" },
  { id: "recent", label: "Plus récents" },
  { id: "title", label: "Titre (A-Z)" },
  { id: "size", label: "Taille" },
  { id: "progress", label: "À finir" },
];

const SORTERS: Record<Exclude<Sort, "manual">, (a: LibraryEntry, b: LibraryEntry) => number> = {
  recent: (a, b) => b.addedAt - a.addedAt,
  title: (a, b) => a.title.localeCompare(b.title),
  size: (a, b) => b.size - a.size,
  progress: (a, b) => progressRatio(a) - progressRatio(b),
};

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
  const [sort, setSort] = useState<Sort>("recent");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode ?? "simple");
  const [autoWatchOnPlay, setAutoWatchOnPlay] = useState(true);
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
        if (!files.some((f) => isVideoFile(f.name))) {
          byHash.delete(e.infoHash);
        } else {
          byHash.set(e.infoHash, applyEnrichment(target, files));
        }
        changed = true;
      } catch {
        // magnet retiré du compte partagé ou réseau : on garde la coche unique
      }
    }
    if (!changed) return;
    const next = [...byHash.values()];
    setEntries(next);
    await saveLibrary(next);
  }

  useEffect(() => {
    loadLibrary().then((loaded) => {
      setEntries(loaded);
      enrichMissing(loaded);
    });
    if (initialViewMode === undefined) {
      store.get<ViewMode>("library_view_mode").then((v) => {
        if (v) setViewMode(v);
      });
    }
    store.get<boolean>("auto_watch_on_play").then((v) => {
      if (v !== null && v !== undefined) setAutoWatchOnPlay(v);
    });
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

  const counts = useMemo<Record<Filter, number>>(() => {
    const done = entries.filter((e) => isWholeWatched(e)).length;
    return { all: entries.length, todo: entries.length - done, done };
  }, [entries]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const filtered = entries.filter((e) => {
      if (filter !== "all") {
        const done = isWholeWatched(e);
        if (filter === "done" ? !done : done) return false;
      }
      return q === "" || e.title.toLowerCase().includes(q);
    });
    return sort === "manual" ? filtered : [...filtered].sort(SORTERS[sort]);
  }, [entries, filter, sort, q]);

  // Le glisser-déposer ne réordonne que la liste complète (sans filtre ni recherche).
  const canReorder = sort === "manual" && filter === "all" && q === "";

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
        {/* Recherche */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un titre..."
            className="w-full rounded-lg border border-black/10 bg-white/70 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-zinc-900/60 dark:text-white"
          />
        </div>

        {/* Filtres + tri */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
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
                {f.label} ({counts[f.id]})
              </button>
            ))}
          </div>

          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger className="h-8 w-auto gap-1 rounded-full px-3 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {visible.length === 0 ? (
          <div className="mt-24 flex flex-col items-center gap-3 text-center text-zinc-400 dark:text-zinc-500">
            <LibraryIcon className="h-10 w-10" strokeWidth={1.5} />
            <p className="text-sm">
              {entries.length === 0
                ? "Aucun téléchargement pour l'instant."
                : "Rien ne correspond à cette recherche."}
            </p>
            {entries.length === 0 && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => onNavigate("main")}
                  className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
                >
                  <Search className="h-3.5 w-3.5" />
                  Rechercher
                </button>
                <button
                  onClick={() => onNavigate("discover")}
                  className="flex items-center gap-1.5 rounded-full bg-black/5 px-4 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
                >
                  <Compass className="h-3.5 w-3.5" />
                  Découvrir
                </button>
              </div>
            )}
          </div>
        ) : canReorder ? (
          <Reorder.Group axis="y" values={visible} onReorder={persist} className="space-y-2">
            {visible.map((e) => (
              <ReorderableCard
                key={e.infoHash}
                entry={e}
                onChange={handleChange}
                onRemove={handleRemove}
                debrid={debrid}
                simple={viewMode === "simple"}
                autoWatchOnPlay={autoWatchOnPlay}
              />
            ))}
          </Reorder.Group>
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
                autoWatchOnPlay={autoWatchOnPlay}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

interface ReorderableCardProps {
  entry: LibraryEntry;
  onChange: (entry: LibraryEntry) => void;
  onRemove: (infoHash: string) => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay?: boolean;
}

function ReorderableCard({ entry, ...props }: ReorderableCardProps) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={entry}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-1.5"
    >
      <button
        onPointerDown={(e) => controls.start(e)}
        className="flex h-7 w-5 flex-none cursor-grab touch-none items-center justify-center text-zinc-400 hover:text-zinc-600 active:cursor-grabbing dark:hover:text-zinc-200"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <LibraryEntryCard entry={entry} {...props} />
      </div>
    </Reorder.Item>
  );
}
