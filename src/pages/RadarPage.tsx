import { AppMenu, type Page } from "@/components/AppMenu";
import { DebridFilesModal } from "@/components/DebridFilesModal";
import { DiscoverReleasesModal } from "@/components/DiscoverReleasesModal";
import { PageHeader } from "@/components/PageHeader";
import { RadarAddDialog } from "@/components/radar/RadarAddDialog";
import { RadarBackdrop } from "@/components/radar/RadarBackdrop";
import { RadarEditDialog } from "@/components/radar/RadarEditDialog";
import { RadarFiltersBar } from "@/components/radar/RadarFiltersBar";
import { RadarMissingKeys } from "@/components/radar/RadarMissingKeys";
import { RadarPosterCard } from "@/components/radar/RadarPosterCard";
import { RadarRow } from "@/components/radar/RadarRow";
import { RadarSelectionBar } from "@/components/radar/RadarSelectionBar";
import { RadarToolbar } from "@/components/radar/RadarToolbar";
import { getApiKey } from "@/lib/apiKeys";
import { POSTER_GRID } from "@/lib/libraryPosterSize";
import { getCachedLibrary, loadLibrary, type LibraryEntry } from "@/lib/library";
import { ownedContents } from "@/lib/radar/ownership";
import {
  getRadarState,
  loadRadar,
  markRadarSeen,
  removeRadarEntries,
  setRadarLayout,
} from "@/lib/radar/radarStore";
import { runRadarCheck } from "@/lib/radar/runRadarCheck";
import type { RadarEntry } from "@/lib/radar/types";
import { useRadar } from "@/lib/radar/useRadar";
import {
  filterEntries,
  splitBlocks,
  statusCounts,
  type RadarBlockItem,
  type RadarFilters,
} from "@/lib/radar/view";
import type { TmdbItem } from "@/lib/tmdbItem";
import { useLikes } from "@/lib/useLikes";
import { useSendToDebrid } from "@/lib/useSendToDebrid";
import { AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface RadarPageProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  hasPendingUpdate: boolean;
  onShowPendingUpdate: () => void;
  onSearchTracker: (query: string, source: "c411" | "nyaa") => void;
  onOpenLibraryItem: (item: TmdbItem, infoHash: string) => void;
}

const NO_FILTERS: RadarFilters = {
  query: "",
  type: "all",
  state: "all",
  mode: "all",
  inLibrary: false,
};

export function RadarPage({
  onBack,
  onNavigate,
  hasPendingUpdate,
  onShowPendingUpdate,
  onSearchTracker,
  onOpenLibraryItem,
}: RadarPageProps) {
  const radar = useRadar();
  const { likedKeys, toggleLike } = useLikes();
  const [keys, setKeys] = useState<{ c411: string; allDebrid: string; tmdb: string } | null>(null);
  const [library, setLibrary] = useState<LibraryEntry[]>(() => getCachedLibrary() ?? []);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<RadarEntry | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<RadarEntry | null>(null);

  useEffect(() => {
    void loadRadar();
    void loadLibrary().then(setLibrary);
    void Promise.all([
      getApiKey("c411_api_key"),
      getApiKey("alldebrid_api_key"),
      getApiKey("tmdb_api_key"),
    ]).then(([c411, allDebrid, tmdb]) =>
      setKeys({ c411: c411 ?? "", allDebrid: allDebrid ?? "", tmdb: tmdb ?? "" }),
    );
  }, []);

  const { sendingHash, libraryHash, debridModal, setDebridModal, sendToDebrid } = useSendToDebrid({
    getC411Key: () => keys?.c411 ?? "",
    getAllDebridKey: () => keys?.allDebrid ?? "",
    onOpenLibrary: onOpenLibraryItem,
    onLibraryChange: () => setLibrary(getCachedLibrary() ?? []),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (debridModal) setDebridModal(null);
      else if (viewing) setViewing(null);
      else onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debridModal, viewing, onBack]);

  const owned = useMemo(
    () => new Map(radar.entries.map((e) => [e.id, ownedContents(e, library)])),
    [radar.entries, library],
  );
  const inLibrary = (e: RadarEntry) => {
    const o = owned.get(e.id);
    return !!o && o.certain.size + o.uncertain.size > 0;
  };
  const { released, waiting } = splitBlocks(
    filterEntries(radar.entries, filters, inLibrary),
    filters.state,
  );

  async function check() {
    const before = getRadarState().lastCheckAt;
    await runRadarCheck().catch(() => {});
    if (getRadarState().lastCheckAt === before) {
      toast.error("Vérification incomplète : C411 n'a pas répondu pour au moins un titre.");
    }
  }

  function view(entry: RadarEntry) {
    setViewing(entry);
    markRadarSeen(entry.id);
  }

  function toggleSelected(id: string) {
    const next = new Set(selection);
    if (!next.delete(id)) next.add(id);
    setSelection(next);
  }

  function removeSelected() {
    removeRadarEntries([...selection]);
    setSelection(new Set());
  }

  const missing = keys
    ? [!keys.c411 && "la clé C411", !keys.tmdb && "la clé TMDB"].filter((k): k is string => !!k)
    : [];

  const block = (label: string, items: RadarBlockItem[]) => {
    if (items.length === 0) return null;
    const Card = radar.layout === "grid" ? RadarPosterCard : RadarRow;
    return (
      <section className="space-y-2">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          {label} ({items.length})
        </h2>
        <div className={radar.layout === "grid" ? `grid gap-3 ${POSTER_GRID.normal}` : "space-y-2"}>
          {items.map(({ entry, status }) => (
            <Card
              key={entry.id}
              entry={entry}
              status={status}
              owned={owned.get(entry.id) ?? { certain: new Set(), uncertain: new Set() }}
              selected={selection.has(entry.id)}
              onToggleSelect={() => toggleSelected(entry.id)}
              onView={() => view(entry)}
              onEdit={() => setEditing(entry)}
              onRemove={() => removeRadarEntries([entry.id])}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <main className="relative flex min-h-screen flex-col bg-[#f6fbf8] bg-[radial-gradient(ellipse_85%_75%_at_50%_-15%,_#c8ecd9_0%,_#e4f4eb_45%,_#fbfdfc_85%)] dark:bg-black dark:bg-[radial-gradient(ellipse_85%_75%_at_50%_-15%,_#0f4a35_0%,_#06261b_45%,_#000000_85%)]">
      <RadarBackdrop />
      <PageHeader
        title="Radar"
        onBack={onBack}
        menu={
          <AppMenu
            currentPage="radar"
            onNavigate={onNavigate}
            onBack={onBack}
            hasPendingUpdate={hasPendingUpdate}
            onShowPendingUpdate={onShowPendingUpdate}
          />
        }
      />
      <div className="relative mx-auto w-full max-w-5xl space-y-4 px-6 pt-6 pb-24 sm:px-8">
        {missing.length > 0 ? (
          <RadarMissingKeys missing={missing} onOpenPreferences={() => onNavigate("preferences")} />
        ) : (
          <>
            <RadarToolbar
              lastCheckAt={radar.lastCheckAt}
              checking={radar.checking}
              layout={radar.layout}
              onLayoutChange={setRadarLayout}
              onCheck={() => void check()}
              onAdd={() => setAdding(true)}
            />
            {radar.entries.length > 0 && (
              <RadarFiltersBar
                filters={filters}
                counts={statusCounts(radar.entries, filters, inLibrary)}
                onChange={setFilters}
              />
            )}
            {radar.loaded && radar.entries.length === 0 && (
              <p className="py-16 text-center text-sm text-zinc-500">
                Aucun titre suivi. Ajoutez un film ou une saison pour être prévenu de sa sortie.
              </p>
            )}
            {radar.entries.length > 0 && released.length + waiting.length === 0 && (
              <p className="py-16 text-center text-sm text-zinc-500">
                Aucun titre ne correspond aux filtres.
              </p>
            )}
            {block("Trouvé sur C411", released)}
            {block("🎯 Ciblé", waiting)}
          </>
        )}
      </div>

      <AnimatePresence>
        {selection.size > 0 && (
          <RadarSelectionBar
            count={selection.size}
            onDelete={removeSelected}
            onCancel={() => setSelection(new Set())}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewing && keys && (
          <DiscoverReleasesModal
            item={viewing.item}
            initialSeason={viewing.season ?? undefined}
            tmdbKey={keys.tmdb}
            getC411Key={() => keys.c411}
            liked={likedKeys.has(`${viewing.item.mediaType}-${viewing.item.id}`)}
            sendingHash={sendingHash}
            libraryHash={libraryHash}
            inLibrary={library.some(
              (l) => l.tmdb?.id === viewing.item.id && l.tmdb.mediaType === viewing.item.mediaType,
            )}
            onToggleLike={toggleLike}
            onClose={() => setViewing(null)}
            onSend={(occ, addToLibrary) => sendToDebrid(occ, viewing.item, addToLibrary)}
            onSearchTracker={onSearchTracker}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {debridModal && (
          <DebridFilesModal
            modal={debridModal}
            getAllDebridKey={() => keys?.allDebrid ?? ""}
            onClose={() => setDebridModal(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {adding && keys && <RadarAddDialog tmdbKey={keys.tmdb} onClose={() => setAdding(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {editing && <RadarEditDialog entry={editing} onClose={() => setEditing(null)} />}
      </AnimatePresence>
    </main>
  );
}
