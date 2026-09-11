import { CHIP_TRACK } from "@/components/chipStyles";
import { useDragScroll } from "@/lib/useDragScroll";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";

// Piste de puces défilant horizontalement (saisons, dossiers). Des flèches
// apparaissent aux extrémités tant qu'il reste des puces hors écran.
export function ChipScroller({ children }: { children: ReactNode }) {
  const { ref, dragProps } = useDragScroll<HTMLDivElement>();
  const contentRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ scrollable: false, left: false, right: false });

  const syncEdges = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({
      scrollable: max > 1,
      left: el.scrollLeft > 1,
      right: el.scrollLeft < max - 1,
    });
  }, [ref]);

  // Couvre le redimensionnement de la fenêtre comme le changement de puces.
  useLayoutEffect(() => {
    syncEdges();
    const observer = new ResizeObserver(syncEdges);
    if (ref.current) observer.observe(ref.current);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [syncEdges, ref]);

  function page(dir: -1 | 1) {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div className={`${CHIP_TRACK} max-w-full`}>
      {edges.scrollable && <ScrollArrow side="left" show={edges.left} onClick={() => page(-1)} />}
      <div
        ref={ref}
        {...dragProps}
        onScroll={syncEdges}
        className="min-w-0 flex-1 overflow-x-auto cursor-grab select-none active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div ref={contentRef} className="flex w-max items-center gap-0.5">
          {children}
        </div>
      </div>
      {edges.scrollable && <ScrollArrow side="right" show={edges.right} onClick={() => page(1)} />}
    </div>
  );
}

function ScrollArrow({
  side,
  show,
  onClick,
}: {
  side: "left" | "right";
  show: boolean;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      disabled={!show}
      aria-label={side === "left" ? "Défiler vers la gauche" : "Défiler vers la droite"}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-black/[0.06] hover:text-zinc-900 disabled:pointer-events-none disabled:text-zinc-300 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-white dark:disabled:text-zinc-700"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
