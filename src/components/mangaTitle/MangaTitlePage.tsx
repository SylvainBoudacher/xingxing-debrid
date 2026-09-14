import { TitleTopBar } from "@/components/libraryTitle/TitleTopBar";
import { MangaPendingNote } from "@/components/mangaTitle/MangaPendingNote";
import { MangaShelfBar } from "@/components/mangaTitle/MangaShelfBar";
import { MangaShelfSelectionBar } from "@/components/mangaTitle/MangaShelfSelectionBar";
import { MangaTitleActions } from "@/components/mangaTitle/MangaTitleActions";
import { MangaTitleHero } from "@/components/mangaTitle/MangaTitleHero";
import { MangaTitleMenu } from "@/components/mangaTitle/MangaTitleMenu";
import { MangaVolumeGrid } from "@/components/mangaTitle/MangaVolumeGrid";
import { MangaVolumeList } from "@/components/mangaTitle/MangaVolumeList";
import {
  volumeKey,
  type ShelfContext,
  type VolumeActions,
} from "@/components/mangaTitle/volumeActions";
import { nextVolume, type MangaEntry, type MangaVolume } from "@/lib/mangaLibrary";
import {
  DEFAULT_MANGA_PREFS,
  getCachedMangaPrefs,
  saveMangaPref,
  type MangaLayout,
} from "@/lib/mangaPrefs";
import { buildShelf, filterShelf, shelfCounts, type ShelfFilter } from "@/lib/mangaShelf";
import { useMangaCovers } from "@/lib/useMangaCovers";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

// Défilement au-delà duquel le bandeau est sorti : la barre devient opaque.
const HERO_SCROLL = 200;
// Hauteur de la barre du haut : la barre des tomes se colle juste dessous.
const TOP_BAR = 56;

const PAGE_HIDDEN = { opacity: 0, scale: 0.985 };

interface MangaTitlePageProps {
  entry: MangaEntry;
  actions: VolumeActions;
  bulkDownloading: boolean;
  refreshingPending: boolean;
  // Une modale est ouverte par-dessus : Escape lui revient.
  overlayOpen: boolean;
  onDownloadMany: (volumes: MangaVolume[]) => void;
  onSetRead: (volumes: MangaVolume[], read: boolean) => void;
  onRefreshPending: () => void;
  onFindMore: () => void;
  onRetag: () => void;
  onRemove: () => void;
  onClose: () => void;
}

// Fiche plein écran d'une oeuvre : étagère de tous ses tomes, possédés ou
// manquants. Calque fixe avec son propre défilement, la grille reste montée
// dessous.
export function MangaTitlePage({
  entry,
  actions,
  bulkDownloading,
  refreshingPending,
  overlayOpen,
  onDownloadMany,
  onSetRead,
  onRefreshPending,
  onFindMore,
  onRetag,
  onRemove,
  onClose,
}: MangaTitlePageProps) {
  const covers = useMangaCovers(entry.mangaId);
  const shelf = useMemo(() => buildShelf(entry, covers), [entry, covers]);
  const counts = useMemo(() => shelfCounts(shelf), [shelf]);
  const [filter, setFilter] = useState<ShelfFilter>("all");
  const visible = useMemo(() => filterShelf(shelf, filter), [shelf, filter]);
  const [layout, setLayout] = useState<MangaLayout>(
    () => (getCachedMangaPrefs() ?? DEFAULT_MANGA_PREFS).volumeLayout,
  );
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [solid, setSolid] = useState(false);

  const next = nextVolume(entry);
  const started = entry.volumes.some((v) => v.read || v.lastPage !== undefined);
  const downloadable = (volumes: MangaVolume[]) =>
    volumes.filter((v) => !v.localPath && v.source !== "local");
  const selectedVolumes = entry.volumes.filter((v) => selected.has(volumeKey(v)));

  // La bibliothèque défile avec la fenêtre : bloquée tant que la fiche la
  // couvre.
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // defaultPrevented : un menu déroulant vient de se fermer sur Escape.
      if (e.key !== "Escape" || e.defaultPrevented || overlayOpen) return;
      if (selecting) exitSelect();
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen, selecting, onClose]);

  function exitSelect() {
    setSelecting(false);
    setSelected(new Set());
  }

  function toggleSelected(volume: MangaVolume) {
    setSelected((prev) => {
      const nextSet = new Set(prev);
      const key = volumeKey(volume);
      if (!nextSet.delete(key)) nextSet.add(key);
      return nextSet;
    });
  }

  function changeLayout(nextLayout: MangaLayout) {
    setLayout(nextLayout);
    saveMangaPref("volumeLayout", nextLayout);
  }

  const ctx: ShelfContext = {
    mangaId: entry.mangaId,
    fallbackFileName: entry.meta.coverFileName,
    actions,
    selecting,
    selected,
    onToggleSelected: toggleSelected,
    onFindMore,
  };

  return (
    <motion.div
      initial={PAGE_HIDDEN}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ ...PAGE_HIDDEN, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-40 bg-[#f4f6fc] dark:bg-black"
    >
      <div
        onScroll={(e) => setSolid(e.currentTarget.scrollTop > HERO_SCROLL)}
        className="relative h-full overflow-y-auto overscroll-contain"
      >
        <TitleTopBar
          title={entry.meta.title}
          solid={solid}
          onBack={onClose}
          menu={<MangaTitleMenu solid={solid} onRetag={onRetag} onRemove={onRemove} />}
        />

        <MangaTitleHero entry={entry} counts={counts}>
          <MangaTitleActions
            next={next}
            started={started}
            missingDownloads={downloadable(entry.volumes).length}
            bulkDownloading={bulkDownloading}
            onContinue={() => next && actions.onRead(next)}
            onDownloadAll={() => onDownloadMany(entry.volumes)}
            onFindMore={onFindMore}
          />
        </MangaTitleHero>

        <div className="mx-auto max-w-5xl px-6 pb-28 pt-8">
          {entry.pending && entry.pending.length > 0 && (
            <MangaPendingNote
              count={entry.pending.length}
              refreshing={refreshingPending}
              onRefresh={onRefreshPending}
            />
          )}

          {shelf.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">
              Aucun tome disponible pour le moment.
            </p>
          ) : (
            <>
              <div
                style={{ top: TOP_BAR }}
                className="sticky z-10 -mx-6 mb-4 bg-[#f4f6fc]/85 px-6 py-2.5 backdrop-blur-xl dark:bg-black/80"
              >
                <MangaShelfBar
                  counts={counts}
                  filter={filter}
                  onFilter={setFilter}
                  layout={layout}
                  onLayout={changeLayout}
                  selecting={selecting}
                  onToggleSelect={() => (selecting ? exitSelect() : setSelecting(true))}
                />
              </div>

              {visible.length === 0 ? (
                <p className="py-12 text-center text-sm text-zinc-500">Aucun tome ne correspond.</p>
              ) : layout === "grid" ? (
                <MangaVolumeGrid ctx={ctx} slots={visible} />
              ) : (
                <MangaVolumeList ctx={ctx} slots={visible} />
              )}
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selecting && (
          <MangaShelfSelectionBar
            count={selected.size}
            downloadable={downloadable(selectedVolumes).length}
            allSelected={selected.size > 0 && selected.size === entry.volumes.length}
            busy={bulkDownloading}
            onToggleAll={() =>
              setSelected(
                selected.size === entry.volumes.length
                  ? new Set()
                  : new Set(entry.volumes.map(volumeKey)),
              )
            }
            onCancel={exitSelect}
            onMarkRead={(read) => {
              onSetRead(selectedVolumes, read);
              exitSelect();
            }}
            onDownload={() => {
              onDownloadMany(selectedVolumes);
              exitSelect();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
