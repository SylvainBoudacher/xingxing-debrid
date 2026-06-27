import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, Reorder, useDragControls } from "motion/react";
import { invoke } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";
import {
  ArrowLeft,
  Compass,
  GripVertical,
  Layers,
  LayoutGrid,
  Library as LibraryIcon,
  List,
  Search,
} from "lucide-react";
import { AppMenu, type Page } from "@/components/AppMenu";
import { LibraryEntryCard, type DebridControls } from "@/components/LibraryEntryCard";
import { LibraryPosterCard } from "@/components/LibraryPosterCard";
import { LibraryDetailModal } from "@/components/LibraryDetailModal";
import { SeriesGroupCard } from "@/components/SeriesGroupCard";
import { SeriesGroupPosterCard } from "@/components/SeriesGroupPosterCard";
import { SeriesGroupDetailModal } from "@/components/SeriesGroupDetailModal";
import { TmdbMatchModal } from "@/components/TmdbMatchModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebridActions } from "@/lib/useDebridActions";
import { flattenFiles, isVideoFile, type DebridFile } from "@/lib/debrid";
import { type ViewMode, resolvePageViewMode } from "@/lib/viewMode";
import {
  applyEnrichment,
  canEnrichTmdb,
  flushLibrary,
  getCachedLibrary,
  groupLibraryEntries,
  isWholeWatched,
  libraryCounts,
  loadLibrary,
  progressRatio,
  saveLibraryDebounced,
  type DisplayItem,
  type LibraryEntry,
} from "@/lib/library";

interface LibraryPageProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  hasPendingUpdate: boolean;
  onShowPendingUpdate: () => void;
  initialAllDebridKey?: string | null;
  initialTmdbKey?: string | null;
  initialViewMode?: ViewMode;
}

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

type Filter = "all" | "todo" | "done";
type Layout = "list" | "grid";

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
  initialTmdbKey,
  initialViewMode,
}: LibraryPageProps) {
  const [entries, setEntries] = useState<LibraryEntry[]>(() => getCachedLibrary() ?? []);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode ?? "simple");
  const [layout, setLayout] = useState<Layout>("grid");
  const [split, setSplit] = useState(true);
  const [expandedHash, setExpandedHash] = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);
  const [matchingHash, setMatchingHash] = useState<string | null>(null);
  const [autoWatchOnPlay, setAutoWatchOnPlay] = useState(true);
  const debrid = useDebridActions(() => initialAllDebridKey ?? "");

  // Récupère la liste des fichiers depuis AllDebrid pour les entrées non encore
  // enrichies (torrent envoyé pendant le débridage). Best-effort, échec silencieux.
  async function enrichMissing(loaded: LibraryEntry[]) {
    const key = initialAllDebridKey;
    if (!key) return;
    const pending = loaded.filter((e) => !e.enriched && e.magnetId != null);
    if (pending.length === 0) return;

    // Appels en parallèle (best-effort, échec silencieux par entrée).
    const results = await Promise.all(
      pending.map(async (e) => {
        try {
          const filesJson = await invoke<{
            status: string;
            data?: { magnets?: Array<{ files?: unknown[] }> };
          }>("get_magnet_files", { id: e.magnetId, alldebridKey: key });
          const rawFiles = filesJson.data?.magnets?.[0]?.files ?? [];
          if (filesJson.status !== "success" || rawFiles.length === 0) return null;
          return { infoHash: e.infoHash, files: flattenFiles(rawFiles) };
        } catch {
          // magnet retiré du compte partagé ou réseau : on garde la coche unique
          return null;
        }
      }),
    );

    const byHash = new Map<string, DebridFile[]>();
    for (const r of results) if (r) byHash.set(r.infoHash, r.files);
    if (byHash.size === 0) return;

    // Fusion avec l'état COURANT (l'utilisateur a pu cocher pendant le fetch) :
    // applyEnrichment préserve `watched`. On retire les entrées sans vidéo.
    setEntries((prev) => {
      const next = prev.flatMap((e) => {
        const files = byHash.get(e.infoHash);
        if (!files) return [e];
        return files.some((f) => isVideoFile(f.name)) ? [applyEnrichment(e, files)] : [];
      });
      saveLibraryDebounced(next);
      return next;
    });
  }

  useEffect(() => {
    loadLibrary().then((loaded) => {
      setEntries(loaded);
      enrichMissing(loaded);
    });
    if (initialViewMode === undefined) {
      resolvePageViewMode(store, "library").then(setViewMode);
    }
    store.get<boolean>("auto_watch_on_play").then((v) => {
      if (v !== null && v !== undefined) setAutoWatchOnPlay(v);
    });
    store.get<Layout>("library_layout").then((v) => {
      if (v) setLayout(v);
    });
    store.get<boolean>("library_split").then((v) => {
      if (v !== null && v !== undefined) setSplit(v);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeLayout(next: Layout) {
    setLayout(next);
    // Le tri manuel (glisser-déposer) n'existe qu'en vue liste : on bascule sur
    // « Plus récents » en passant en grille.
    if (next === "grid" && sort === "manual") setSort("recent");
    void store.set("library_layout", next).then(() => store.save());
  }

  // Flushe l'écriture en attente quand on quitte la page.
  useEffect(() => flushLibrary, []);

  // Updaters fonctionnels : identité stable (deps vides) pour ne pas casser le
  // React.memo des cartes, tout en lisant le dernier état via `prev`.
  const persist = useCallback((next: LibraryEntry[]) => {
    setEntries(next);
    saveLibraryDebounced(next);
  }, []);

  const handleChange = useCallback((updated: LibraryEntry) => {
    setEntries((prev) => {
      const next = prev.map((e) => (e.infoHash === updated.infoHash ? updated : e));
      saveLibraryDebounced(next);
      return next;
    });
  }, []);

  const handleRemove = useCallback((infoHash: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.infoHash !== infoHash);
      saveLibraryDebounced(next);
      return next;
    });
  }, []);

  const counts = useMemo(() => libraryCounts(entries), [entries]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const filtered = entries.filter((e) => {
      if (filter !== "all") {
        const done = isWholeWatched(e);
        if (filter === "done" ? !done : done) return false;
      }
      return (
        q === "" ||
        e.title.toLowerCase().includes(q) ||
        (e.tmdb?.title.toLowerCase().includes(q) ?? false)
      );
    });
    return sort === "manual" ? filtered : [...filtered].sort(SORTERS[sort]);
  }, [entries, filter, sort, q]);

  // Le glisser-déposer ne réordonne que la liste complète (sans filtre ni recherche).
  const canReorder = !split && sort === "manual" && filter === "all" && q === "";

  const displayItems = useMemo<DisplayItem[]>(
    () => (canReorder ? [] : groupLibraryEntries(visible)),
    [canReorder, visible],
  );

  const splitSections = useMemo<{ label: string; items: DisplayItem[] }[] | null>(() => {
    if (!split) return null;
    const noInfo: DisplayItem[] = [];
    const movies: DisplayItem[] = [];
    const series: DisplayItem[] = [];
    for (const item of displayItems) {
      if (item.type === "group") {
        series.push(item);
      } else if (!item.entry.tmdb) {
        noInfo.push(item);
      } else if (item.entry.tmdb.mediaType === "movie") {
        movies.push(item);
      } else {
        series.push(item);
      }
    }
    const sections: { label: string; items: DisplayItem[] }[] = [];
    if (noInfo.length > 0) sections.push({ label: "Sans info TMDB", items: noInfo });
    if (movies.length > 0) sections.push({ label: "Films", items: movies });
    if (series.length > 0) sections.push({ label: "Séries", items: series });
    return sections;
  }, [split, displayItems]);

  // Entrée affichée dans le panneau latéral (vue grille). Null si l'entrée
  // sélectionnée n'est plus visible après un changement de filtre/recherche.
  const expandedEntry = visible.find((e) => e.infoHash === expandedHash) ?? null;
  const expandedGroup =
    expandedGroupId !== null
      ? (displayItems.find(
          (item) => item.type === "group" && item.group.tmdbId === expandedGroupId,
        ) ?? null)
      : null;
  const matchingEntry = entries.find((e) => e.infoHash === matchingHash) ?? null;

  // Bouton « Compléter via TMDB » : seulement si une clé est configurée et que
  // l'entrée (C411 / Nyaa) n'a pas encore de métadonnées.
  const enrichHandler = (e: LibraryEntry) =>
    initialTmdbKey && canEnrichTmdb(e) ? () => setMatchingHash(e.infoHash) : undefined;

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

      <div
        className={`mx-auto w-full flex-1 px-6 pt-6 pb-10 sm:px-8 ${layout === "grid" ? "max-w-5xl" : "max-w-3xl"}`}
      >
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !split;
                setSplit(next);
                void store.set("library_split", next).then(() => store.save());
              }}
              title="Séparer films / séries"
              className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
                split
                  ? "bg-indigo-600 text-white"
                  : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Trier
            </button>

            <div className="flex items-center rounded-full bg-black/5 p-0.5 dark:bg-white/10">
              {(
                [
                  ["list", List],
                  ["grid", LayoutGrid],
                ] as const
              ).map(([id, Icon]) => (
                <button
                  key={id}
                  onClick={() => changeLayout(id)}
                  title={id === "list" ? "Vue liste" : "Vue grille"}
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                    layout === id
                      ? "bg-white text-indigo-600 shadow-sm dark:bg-zinc-700 dark:text-indigo-300"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="h-8 w-auto gap-1 rounded-full px-3 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.filter((s) => s.id !== "manual" || layout === "list").map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
        ) : layout === "grid" ? (
          splitSections ? (
            <div className="space-y-6">
              {splitSections.map((section) => (
                <div key={section.label}>
                  <SectionHeader label={section.label} count={section.items.length} />
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                    {section.items.map((item) =>
                      item.type === "single" ? (
                        <LibraryPosterCard
                          key={item.entry.infoHash}
                          entry={item.entry}
                          simple={viewMode === "simple"}
                          expanded={expandedHash === item.entry.infoHash}
                          onToggle={() => setExpandedHash(item.entry.infoHash)}
                          onEnrichTmdb={enrichHandler(item.entry)}
                        />
                      ) : (
                        <SeriesGroupPosterCard
                          key={item.group.tmdbId}
                          group={item.group}
                          expanded={expandedGroupId === item.group.tmdbId}
                          onToggle={() => setExpandedGroupId(item.group.tmdbId)}
                        />
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {displayItems.map((item) =>
                item.type === "single" ? (
                  <LibraryPosterCard
                    key={item.entry.infoHash}
                    entry={item.entry}
                    simple={viewMode === "simple"}
                    expanded={expandedHash === item.entry.infoHash}
                    onToggle={() => setExpandedHash(item.entry.infoHash)}
                    onEnrichTmdb={enrichHandler(item.entry)}
                  />
                ) : (
                  <SeriesGroupPosterCard
                    key={item.group.tmdbId}
                    group={item.group}
                    expanded={expandedGroupId === item.group.tmdbId}
                    onToggle={() => setExpandedGroupId(item.group.tmdbId)}
                  />
                ),
              )}
            </div>
          )
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
        ) : splitSections ? (
          <div className="space-y-6">
            {splitSections.map((section) => (
              <div key={section.label}>
                <SectionHeader label={section.label} count={section.items.length} />
                <div className="space-y-2">
                  {section.items.map((item) =>
                    item.type === "single" ? (
                      <LibraryEntryCard
                        key={item.entry.infoHash}
                        entry={item.entry}
                        onChange={handleChange}
                        onRemove={handleRemove}
                        debrid={debrid}
                        simple={viewMode === "simple"}
                        autoWatchOnPlay={autoWatchOnPlay}
                      />
                    ) : (
                      <SeriesGroupCard
                        key={item.group.tmdbId}
                        group={item.group}
                        onChange={handleChange}
                        onRemove={handleRemove}
                        debrid={debrid}
                        simple={viewMode === "simple"}
                        autoWatchOnPlay={autoWatchOnPlay}
                      />
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {displayItems.map((item) =>
              item.type === "single" ? (
                <LibraryEntryCard
                  key={item.entry.infoHash}
                  entry={item.entry}
                  onChange={handleChange}
                  onRemove={handleRemove}
                  debrid={debrid}
                  simple={viewMode === "simple"}
                  autoWatchOnPlay={autoWatchOnPlay}
                />
              ) : (
                <SeriesGroupCard
                  key={item.group.tmdbId}
                  group={item.group}
                  onChange={handleChange}
                  onRemove={handleRemove}
                  debrid={debrid}
                  simple={viewMode === "simple"}
                  autoWatchOnPlay={autoWatchOnPlay}
                />
              ),
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {expandedEntry && (
          <LibraryDetailModal
            entry={expandedEntry}
            onChange={handleChange}
            onRemove={handleRemove}
            onClose={() => setExpandedHash(null)}
            debrid={debrid}
            simple={viewMode === "simple"}
            autoWatchOnPlay={autoWatchOnPlay}
            onEnrichTmdb={
              initialTmdbKey ? () => setMatchingHash(expandedEntry.infoHash) : undefined
            }
            enrichOpen={matchingHash !== null}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expandedGroup?.type === "group" && (
          <SeriesGroupDetailModal
            group={expandedGroup.group}
            onChange={handleChange}
            onRemove={handleRemove}
            onClose={() => setExpandedGroupId(null)}
            debrid={debrid}
            simple={viewMode === "simple"}
            autoWatchOnPlay={autoWatchOnPlay}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {matchingEntry && initialTmdbKey && (
          <TmdbMatchModal
            entry={matchingEntry}
            tmdbKey={initialTmdbKey}
            onPick={(meta) => {
              handleChange({ ...matchingEntry, tmdb: meta });
              setMatchingHash(null);
            }}
            onClose={() => setMatchingHash(null)}
          />
        )}
      </AnimatePresence>
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

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{label}</span>
      <span className="rounded-full bg-black/8 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
        {count}
      </span>
      <div className="h-px flex-1 bg-black/8 dark:bg-white/10" />
    </div>
  );
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
