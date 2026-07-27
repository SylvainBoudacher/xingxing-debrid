import type { FitMode } from "@/lib/readerPrefs";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ReaderCanvasProps {
  /** Index des pages a afficher, deja ordonnes selon le sens de lecture. */
  pages: number[];
  urls: Record<number, string>;
  fit: FitMode;
  zoom: number;
  onZoom: (factor: number) => void;
  /** Signale les pages paysage (doubles pages d'origine) au parent. */
  onMeasure: (page: number, wide: boolean) => void;
}

const FIT_CLASS: Record<FitMode, string> = {
  height: "max-h-full w-auto max-w-full object-contain",
  width: "w-full h-auto object-contain",
  actual: "max-w-none",
};

export function ReaderCanvas({ pages, urls, fit, zoom, onZoom, onMeasure }: ReaderCanvasProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [grabbing, setGrabbing] = useState(false);

  // Ctrl/Cmd + molette : zoom. La molette seule reste un defilement, utile des
  // que l'image deborde.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      onZoom(e.deltaY < 0 ? 1.1 : 1 / 1.1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onZoom]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = scroller.current;
    if (!el) return;
    // Ne capture le glisser que si l'image deborde reellement.
    if (el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight) return;
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
    el.setPointerCapture(e.pointerId);
    setGrabbing(true);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const el = scroller.current;
    if (!el || !drag.current) return;
    el.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
    el.scrollTop = drag.current.top - (e.clientY - drag.current.y);
  }, []);

  const endDrag = useCallback((e: React.PointerEvent) => {
    drag.current = null;
    scroller.current?.releasePointerCapture(e.pointerId);
    setGrabbing(false);
  }, []);

  return (
    <div
      ref={scroller}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`flex h-full w-full items-center justify-center gap-1 overflow-auto p-2 ${
        grabbing ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {pages.map((page) => {
        const url = urls[page];
        return url ? (
          <img
            key={page}
            src={url}
            alt={`Page ${page + 1}`}
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              onMeasure(page, img.naturalWidth > img.naturalHeight);
            }}
            style={zoom === 1 ? undefined : { transform: `scale(${zoom})` }}
            className={`select-none ${FIT_CLASS[fit]} ${zoom === 1 ? "" : "origin-center"}`}
          />
        ) : (
          <div
            key={page}
            className="flex h-full w-64 items-center justify-center text-zinc-500 dark:text-zinc-600"
          >
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        );
      })}
    </div>
  );
}
