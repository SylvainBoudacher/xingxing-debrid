import { ReaderCanvas } from "@/components/reader/ReaderCanvas";
import { ReaderProgress } from "@/components/reader/ReaderProgress";
import { ReaderToolbar } from "@/components/reader/ReaderToolbar";
import { cbzErrorMessage } from "@/lib/cbz";
import type { ReadingDirection } from "@/lib/mangaLibrary";
import {
  getCachedReaderPrefs,
  saveReaderPrefs,
  type FitMode,
  type PageMode,
} from "@/lib/readerPrefs";
import { useCbzPages } from "@/lib/useCbzPages";
import { useFullscreen } from "@/lib/useFullscreen";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ReaderPageProps {
  /** Chemin local du CBZ. Le lecteur ne connait rien du reste du pipeline. */
  path: string;
  title: string;
  subtitle: string;
  direction: ReadingDirection;
  initialPage: number;
  onDirectionChange: (direction: ReadingDirection) => void;
  /** Appele a chaque changement de page, deja limite en frequence. */
  onProgress: (page: number, pageCount: number) => void;
  onFinished: () => void;
  /** Le fichier local a disparu : l'appelant doit oublier son chemin. */
  onMissing: () => void;
  onClose: () => void;
}

const PROGRESS_DELAY = 600;

export function ReaderPage({
  path,
  title,
  subtitle,
  direction,
  initialPage,
  onDirectionChange,
  onProgress,
  onFinished,
  onMissing,
  onClose,
}: ReaderPageProps) {
  const prefs = getCachedReaderPrefs();
  const [pageMode, setPageMode] = useState<PageMode>(prefs.pageMode);
  const [fit, setFit] = useState<FitMode>(prefs.fit);
  const [zoom, setZoom] = useState(1);
  const [index, setIndex] = useState(initialPage);
  // Pages plus larges que hautes : ce sont les doubles pages d'origine, qui
  // s'affichent seules meme en mode double.
  const [wide, setWide] = useState<Record<number, boolean>>({});
  const { fullscreen, toggle: toggleFullscreen, exit: exitFullscreen } = useFullscreen();

  const visible = useMemo(() => {
    if (pageMode === "single") return [index];
    if (wide[index]) return [index];
    return [index, index + 1];
  }, [pageMode, index, wide]);

  const { names, total, urls, listing, error } = useCbzPages(path, index, visible.length);

  // Pages reellement affichables : la derniere paire peut n'avoir qu'une page,
  // et une double page d'origine chasse sa voisine.
  const shown = useMemo(
    () => visible.filter((p) => p < total && !(p !== index && wide[p])),
    [visible, total, index, wide],
  );

  const ordered = useMemo(
    () => (direction === "rtl" ? [...shown].reverse() : shown),
    [shown, direction],
  );

  const step = Math.max(1, shown.length);

  const goTo = useCallback(
    (next: number) => {
      setIndex(Math.min(Math.max(0, next), Math.max(0, total - 1)));
      setZoom(1);
    },
    [total],
  );

  const prev = useCallback(() => goTo(index - step), [goTo, index, step]);
  const next = useCallback(() => {
    if (index + step >= total) {
      onFinished();
      return;
    }
    goTo(index + step);
  }, [goTo, index, step, total, onFinished]);

  // Le sens de lecture inverse le role des fleches : en RTL, la fleche gauche
  // avance dans le tome.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          if (fullscreen) exitFullscreen();
          else onClose();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "ArrowLeft":
          if (direction === "rtl") next();
          else prev();
          break;
        case "ArrowRight":
          if (direction === "rtl") prev();
          else next();
          break;
        case " ":
        case "PageDown":
          e.preventDefault();
          next();
          break;
        case "PageUp":
          e.preventDefault();
          prev();
          break;
        case "Home":
          goTo(0);
          break;
        case "End":
          goTo(total - 1);
          break;
        case "+":
        case "=":
          setZoom((z) => Math.min(4, z * 1.2));
          break;
        case "-":
          setZoom((z) => Math.max(0.5, z / 1.2));
          break;
        case "0":
          setZoom(1);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [direction, next, prev, goTo, total, onClose, fullscreen, toggleFullscreen, exitFullscreen]);

  // Progression differee : feuilleter dix pages d'affilee ne doit declencher
  // qu'une ecriture.
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (total === 0) return;
    if (progressTimer.current) clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(() => onProgress(index, total), PROGRESS_DELAY);
    return () => {
      if (progressTimer.current) clearTimeout(progressTimer.current);
    };
  }, [index, total, onProgress]);

  const changePageMode = useCallback(
    (mode: PageMode) => {
      setPageMode(mode);
      void saveReaderPrefs({ pageMode: mode, fit });
    },
    [fit],
  );

  const changeFit = useCallback(
    (nextFit: FitMode) => {
      setFit(nextFit);
      setZoom(1);
      void saveReaderPrefs({ pageMode, fit: nextFit });
    },
    [pageMode],
  );

  // Fichier disparu du disque : l'entree de bibliotheque doit oublier son
  // chemin local pour reproposer le telechargement.
  useEffect(() => {
    if (error?.kind === "fileMissing") onMissing();
  }, [error, onMissing]);

  const measure = useCallback((page: number, isWide: boolean) => {
    setWide((w) => (w[page] === isWide ? w : { ...w, [page]: isWide }));
  }, []);

  return (
    <main className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      <ReaderToolbar
        title={title}
        subtitle={subtitle}
        pageMode={pageMode}
        fit={fit}
        direction={direction}
        fullscreen={fullscreen}
        onPageMode={changePageMode}
        onFit={changeFit}
        onDirection={onDirectionChange}
        onFullscreen={toggleFullscreen}
        onClose={onClose}
      />

      <div className="relative min-h-0 flex-1">
        {listing ? (
          <div className="flex h-full items-center justify-center text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="text-sm text-zinc-300">{cbzErrorMessage(error)}</p>
            <button
              onClick={onClose}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/20"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <ReaderCanvas
              pages={ordered}
              urls={urls}
              fit={fit}
              zoom={zoom}
              onZoom={(factor) => setZoom((z) => Math.min(4, Math.max(0.5, z * factor)))}
              onMeasure={measure}
            />
            {/* Zones cliquables de tourne : moitie gauche / moitie droite. */}
            <button
              aria-label={direction === "rtl" ? "Page suivante" : "Page précédente"}
              onClick={direction === "rtl" ? next : prev}
              className="absolute inset-y-0 left-0 w-[15%] cursor-w-resize"
            />
            <button
              aria-label={direction === "rtl" ? "Page précédente" : "Page suivante"}
              onClick={direction === "rtl" ? prev : next}
              className="absolute inset-y-0 right-0 w-[15%] cursor-e-resize"
            />
          </>
        )}
      </div>

      <ReaderProgress
        index={index}
        total={total}
        direction={direction}
        onSeek={goTo}
        onPrev={prev}
        onNext={next}
      />

      {/* Nom du fichier de page : utile pour signaler une archive mal triee. */}
      <span className="sr-only">{names[index]}</span>
    </main>
  );
}
