import { SeriesFolderOrganizer } from "@/components/SeriesFolderOrganizer";
import type { DebridControls } from "@/components/libraryParts";
import { TitleDuplicateDialog } from "@/components/libraryTitle/TitleDuplicateDialog";
import { TitleEpisodeList } from "@/components/libraryTitle/TitleEpisodeList";
import { TitleHero } from "@/components/libraryTitle/TitleHero";
import { TitleHeroActions } from "@/components/libraryTitle/TitleHeroActions";
import { TitleMoreMenu } from "@/components/libraryTitle/TitleMoreMenu";
import { TitleSectionPicker } from "@/components/libraryTitle/TitleSectionPicker";
import { TitleSelectionBar } from "@/components/libraryTitle/TitleSelectionBar";
import { TitleSuggestions } from "@/components/libraryTitle/TitleSuggestions";
import { TitleTopBar } from "@/components/libraryTitle/TitleTopBar";
import {
  isWholeWatched,
  removeFilesByLink,
  setFilesWatched,
  setWholeWatched,
  toggleFile,
  type LibraryEntry,
} from "@/lib/library";
import {
  conflictingReleases,
  duplicateGroups,
  duplicateLinks,
  filesToDrop,
} from "@/lib/libraryDuplicates";
import {
  initialSection,
  isItemWatched,
  nextTitleItem,
  subjectEntries,
  subjectKey,
  subjectTitle,
  subjectTmdb,
  titleCredits,
  titleSections,
  type TitleItem,
  type TitleSubject,
} from "@/lib/libraryTitle";
import type { MagnetEntry } from "@/lib/services/allDebrid";
import { materializeFolders } from "@/lib/seriesFolders";
import { setResume } from "@/lib/resumeWatch";
import { useEpisodeSelection } from "@/lib/useEpisodeSelection";
import { useSeriesFolderConfig } from "@/lib/useSeriesFolderConfig";
import type { TmdbItem } from "@/lib/tmdbItem";
import { useDirectorWorks, useTitleRecommendations, useTmdbDetail } from "@/lib/useTitleTmdb";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

// Hauteur de la barre du haut : le sélecteur de saisons se colle juste dessous.
const TOP_BAR = 56;
// Défilement au-delà duquel le bandeau est sorti : la barre devient opaque.
const HERO_SCROLL = 200;

const CARD =
  "overflow-hidden rounded-2xl bg-white/70 ring-1 ring-black/5 dark:bg-zinc-900/60 dark:ring-white/10";

// La fiche vient au premier plan : fondu et montée d'échelle à peine
// perceptible, sans glissement ni objet qui se déplace.
const PAGE_HIDDEN = { opacity: 0, scale: 0.985 };

let scrollLocks = 0;

interface LibraryTitlePageProps {
  subject: TitleSubject;
  onChange: (entry: LibraryEntry) => void;
  onRemove: (infoHash: string) => void;
  onClose: () => void;
  debrid: DebridControls;
  simple: boolean;
  autoWatchOnPlay: boolean;
  tmdbKey?: string;
  // Recherche TMDB : compléter une entrée brute ou changer les informations.
  onEnrichTmdb?: () => void;
  // Recherche de releases C411 pour la série.
  onFindMore?: () => void;
  // Une modale est ouverte par-dessus : Escape lui revient.
  overlayOpen: boolean;
  // Statut AllDebrid d'une entrée encore en cours de débridage.
  magnet?: MagnetEntry;
  onCancelDebrid?: (entry: LibraryEntry) => void;
  cancellingDebrid?: boolean;
  // Données et images préchargées (ou délai dépassé) : le contenu apparaît.
  ready: boolean;
  // Suggestions du bas de fiche : état partagé avec la page Découvrir.
  ownedKeys: Set<string>;
  likedKeys: Set<string>;
  onToggleLike: (item: TmdbItem) => void;
  // Ouvre la fiche de releases C411 d'un titre suggéré.
  onOpenSuggestion?: (item: TmdbItem) => void;
}

// Fiche plein écran d'un titre de la bibliothèque (série ou film). Calque fixe
// avec son propre défilement : la grille reste montée dessous, le retour
// retrouve sa position et ses filtres.
export function LibraryTitlePage({
  subject,
  onChange,
  onRemove,
  onClose,
  debrid,
  simple,
  autoWatchOnPlay,
  tmdbKey,
  onEnrichTmdb,
  onFindMore,
  overlayOpen,
  magnet,
  onCancelDebrid,
  cancellingDebrid,
  ready,
  ownedKeys,
  likedKeys,
  onToggleLike,
  onOpenSuggestion,
}: LibraryTitlePageProps) {
  const group = subject.kind === "group" ? subject.group : null;
  const entries = subjectEntries(subject);
  const tmdb = subjectTmdb(subject);
  const key = subjectKey(subject);
  const title = subjectTitle(subject, simple);
  const detail = useTmdbDetail(tmdb, tmdbKey);
  const credits = useMemo(() => titleCredits(detail), [detail]);
  const suggestions = useTitleRecommendations(tmdb, tmdbKey, ready);
  const directorWorks = useDirectorWorks(
    credits?.director?.id,
    tmdb?.id,
    tmdbKey,
    ready && tmdb?.mediaType === "movie",
  );
  const [folderConfig, setFolderConfig] = useSeriesFolderConfig(group?.tmdbId ?? null);
  const sections = useMemo(() => titleSections(subject, folderConfig), [subject, folderConfig]);
  const allItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const next = useMemo(() => nextTitleItem(sections), [sections]);
  const dupeGroups = useMemo(() => duplicateGroups(sections), [sections]);
  const dupeLinks = useMemo(() => duplicateLinks(dupeGroups), [dupeGroups]);
  const dupeReleases = useMemo(() => conflictingReleases(dupeGroups), [dupeGroups]);
  // Film (ou entrée brute) à fichier unique : le bandeau porte déjà lecture, vu
  // et téléchargement, rien à lister dessous. Une série garde sa liste même
  // avec un seul épisode (titre et résumé TMDB).
  const single = subject.kind === "entry" && allItems.length === 1 ? allItems[0] : null;

  // Ouverture sur la saison du prochain épisode à voir.
  const [activeKey, setActiveKey] = useState(() => initialSection(sections)?.key ?? null);
  const active = sections.find((s) => s.key === activeKey) ?? sections[0];

  const {
    active: selecting,
    selected,
    selection,
    start: startSelect,
    exit: exitSelect,
  } = useEpisodeSelection();
  const [organize, setOrganize] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [solid, setSolid] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const whole = entries.every(isWholeWatched);
  const watched = allItems.filter(isItemWatched).length;
  const size = entries.reduce((s, e) => s + e.size, 0);
  const allLinks = allItems.map((it) => it.file.link);
  const selectionKey = `${key}-selection`;

  // La bibliothèque défile avec la fenêtre : bloquée tant que la fiche la
  // couvre, sinon la molette la fait bouger dessous et sa barre de défilement
  // s'ajoute à celle de la fiche. La position est conservée pour le retour.
  // Compteur : deux fiches se chevauchent pendant une transition (redirection
  // vers une autre oeuvre), le verrou ne tombe qu'à la dernière fermeture.
  useEffect(() => {
    if (scrollLocks++ === 0) document.documentElement.style.overflow = "hidden";
    return () => {
      if (--scrollLocks === 0) document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // defaultPrevented : un menu déroulant vient de se fermer sur Escape.
      if (e.key !== "Escape" || e.defaultPrevented || overlayOpen) return;
      if (cleaning) setCleaning(false);
      else if (organize) setOrganize(false);
      else if (selecting) exitSelect();
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen, cleaning, organize, selecting, exitSelect, onClose]);

  function play(item: TitleItem, vlcKey: string) {
    debrid.openVlcMany([item.file.link], vlcKey);
    setResume(subject);
    if (autoWatchOnPlay && !isItemWatched(item)) onChange(toggleFile(item.entry, item.file.name));
  }

  // Cocher un épisode fait de ce titre celui à reprendre ; le décocher non,
  // c'est une correction.
  function watch(item: TitleItem) {
    if (!isItemWatched(item)) setResume(subject);
    onChange(toggleFile(item.entry, item.file.name));
  }

  function toggleAllWatched() {
    for (const e of entries) onChange(setWholeWatched(e, !whole));
  }

  // Retire des fichiers (par lien), entrée par entrée. Une entrée vidée de ses
  // vidéos est supprimée ; la fiche se ferme si le titre n'a plus rien.
  function deleteFiles(links: Set<string>) {
    let remaining = 0;
    for (const e of entries) {
      const updated = removeFilesByLink(e, links);
      if (updated === null) {
        onRemove(e.infoHash);
        continue;
      }
      remaining++;
      if (updated !== e) onChange(updated);
    }
    if (remaining === 0) onClose();
  }

  // Ne garde que les fichiers de la release choisie. La coche « vu » d'une copie
  // supprimée passe au fichier conservé avant sa suppression, sinon la
  // progression serait perdue.
  function cleanDuplicates(keepHash: string) {
    setCleaning(false);
    const { links, promoteWatched } = filesToDrop(dupeGroups, keepHash);
    const byEntry = new Map<LibraryEntry, string[]>();
    for (const { entry, name } of promoteWatched) {
      if (!byEntry.has(entry)) byEntry.set(entry, []);
      byEntry.get(entry)!.push(name);
    }
    for (const [entry, names] of byEntry) onChange(setFilesWatched(entry, names, true));
    deleteFiles(links);
  }

  function deleteAll() {
    for (const e of entries) onRemove(e.infoHash);
    onClose();
  }

  // Première organisation : fige le regroupement auto en dossiers éditables.
  function startOrganize() {
    exitSelect();
    if (group && !folderConfig) setFolderConfig(materializeFolders(group));
    setOrganize(true);
  }

  function startSelecting() {
    setOrganize(false);
    startSelect();
  }

  // Changer de saison ramène le haut de la liste sous la barre si on l'avait
  // dépassé, plutôt que de laisser l'utilisateur au milieu d'une autre saison.
  function changeSection(sectionKey: string) {
    setActiveKey(sectionKey);
    const scroller = scrollRef.current;
    const anchor = anchorRef.current;
    if (scroller && anchor && scroller.scrollTop > anchor.offsetTop - TOP_BAR) {
      scroller.scrollTo({ top: anchor.offsetTop - TOP_BAR });
    }
  }

  return (
    <motion.div
      initial={PAGE_HIDDEN}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ ...PAGE_HIDDEN, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-40 bg-[#f4f6fc] dark:bg-black"
    >
      <div
        ref={scrollRef}
        onScroll={(e) => setSolid(e.currentTarget.scrollTop > HERO_SCROLL)}
        className="relative h-full overflow-y-auto overscroll-contain"
      >
        <TitleTopBar
          title={title}
          solid={solid}
          onBack={onClose}
          menu={
            <TitleMoreMenu
              solid={solid}
              onSelectEpisodes={allItems.length > 1 ? startSelecting : undefined}
              onOrganize={group ? startOrganize : undefined}
              onChangeTmdb={tmdb ? onEnrichTmdb : undefined}
              onToggleWatched={single ? undefined : toggleAllWatched}
              watched={whole}
              onDelete={deleteAll}
            />
          }
        />

        <TitleHero
          title={title}
          tmdb={tmdb}
          tmdbKey={tmdbKey}
          backdropPath={detail?.backdrop_path ?? null}
          runtime={detail?.runtime ?? null}
          credits={credits}
          size={size}
          sectionCount={sections.length}
          sectionNoun={folderConfig ? "dossier" : "saison"}
          watched={watched}
          total={allItems.length}
          releaseName={
            subject.kind === "entry"
              ? (subject.entry.releaseName ?? subject.entry.title)
              : undefined
          }
          showScope={allItems.length > 1}
          magnet={magnet}
          onCancelDebrid={
            onCancelDebrid && subject.kind === "entry"
              ? () => onCancelDebrid(subject.entry)
              : undefined
          }
          cancellingDebrid={cancellingDebrid}
          onCompleteTmdb={tmdb ? undefined : onEnrichTmdb}
          revealed={ready}
        >
          <TitleHeroActions
            playItem={single ?? next}
            playLabel={single ? "Lire" : watched > 0 ? "Reprendre" : "Lancer"}
            playKey={`resume-${key}`}
            links={allLinks}
            downloadKey={key}
            whole={whole}
            debrid={debrid}
            onPlay={play}
            onToggleWatched={single ? toggleAllWatched : undefined}
            onFindMore={onFindMore}
          />
        </TitleHero>

        {/* Montée une fois la fiche prête : les lignes arrivent en cascade avec
        titres et vignettes TMDB, sans nom de fichier remplacé en route. */}
        {ready && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-4xl px-6 pb-28 pt-8"
          >
            {organize && group && folderConfig ? (
              <div className={CARD}>
                <SeriesFolderOrganizer
                  group={group}
                  config={folderConfig}
                  onConfigChange={setFolderConfig}
                  onDeleteFiles={deleteFiles}
                  onExit={() => setOrganize(false)}
                />
              </div>
            ) : (
              <>
                {sections.length === 0 ? (
                  <p className="py-10 text-center text-sm text-zinc-400 dark:text-zinc-500">
                    Les fichiers apparaîtront à la fin du débridage.
                  </p>
                ) : single ? null : (
                  <>
                    {sections.length > 1 && (
                      <>
                        <div ref={anchorRef} />
                        <div
                          style={{ top: TOP_BAR }}
                          className="sticky z-10 -mx-6 mb-3 bg-[#f4f6fc]/85 px-6 py-2.5 backdrop-blur-xl dark:bg-black/80"
                        >
                          <TitleSectionPicker
                            sections={sections}
                            activeKey={active.key}
                            onChange={changeSection}
                          />
                        </div>
                      </>
                    )}
                    <TitleEpisodeList
                      key={active.key}
                      section={active}
                      tvId={group?.tmdbId ?? null}
                      tmdbKey={tmdbKey}
                      nextLink={next?.file.link ?? null}
                      sectionKey={`${key}-${active.key}`}
                      debrid={debrid}
                      onChange={onChange}
                      onPlay={play}
                      onWatch={watch}
                      simple={simple}
                      duplicates={dupeLinks}
                      onCleanDuplicates={() => setCleaning(true)}
                      selection={selecting ? selection : undefined}
                      onSelectEpisodes={allItems.length > 1 ? startSelecting : undefined}
                      onFindMore={onFindMore}
                    />
                  </>
                )}
                {onOpenSuggestion && (
                  <>
                    <TitleSuggestions
                      heading="Recommandé par TMDB"
                      items={suggestions}
                      ownedKeys={ownedKeys}
                      likedKeys={likedKeys}
                      onOpen={onOpenSuggestion}
                      onToggleLike={onToggleLike}
                      className="mt-10"
                    />
                    {tmdb?.mediaType === "movie" && (
                      <TitleSuggestions
                        heading="Du même réalisateur"
                        items={directorWorks}
                        ownedKeys={ownedKeys}
                        likedKeys={likedKeys}
                        onOpen={onOpenSuggestion}
                        onToggleLike={onToggleLike}
                        className={suggestions.length > 0 ? "mt-8" : "mt-10"}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>

      <TitleDuplicateDialog
        open={cleaning}
        groups={dupeGroups}
        releases={dupeReleases}
        onConfirm={cleanDuplicates}
        onCancel={() => setCleaning(false)}
      />

      <AnimatePresence>
        {selecting && (
          <TitleSelectionBar
            count={selected.size}
            allSelected={allLinks.length > 0 && selected.size === allLinks.length}
            busy={debrid.bulkDownloading === selectionKey || debrid.bulkCopying === selectionKey}
            copying={debrid.bulkCopying === selectionKey}
            onToggleAll={() => selection.setMany(allLinks, selected.size !== allLinks.length)}
            onCancel={exitSelect}
            onDelete={() => {
              deleteFiles(selected);
              exitSelect();
            }}
            onDownload={() => debrid.downloadMany([...selected], selectionKey)}
            onCopy={() => debrid.copyMany([...selected], selectionKey)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
