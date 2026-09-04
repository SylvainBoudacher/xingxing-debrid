import { chipClass, CHIP_TRACK } from "@/components/chipStyles";
import type { SeasonSelection } from "@/lib/discoverReleases";
import { useDragScroll } from "@/lib/useDragScroll";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export interface TmdbSeason {
  number: number;
  episodeCount: number;
}

interface DiscoverSeasonTabsProps {
  seasons: TmdbSeason[] | null;
  activeSeason: SeasonSelection | null;
  hasComplete: boolean;
  onChange: (season: SeasonSelection) => void;
}

// Selecteur de saisons horizontal. Des fleches de navigation apparaissent aux
// extremites tant qu'il reste des saisons hors ecran.
export function DiscoverSeasonTabs({
  seasons,
  activeSeason,
  hasComplete,
  onChange,
}: DiscoverSeasonTabsProps) {
  const { ref, dragProps } = useDragScroll<HTMLDivElement>();
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

  useLayoutEffect(syncEdges, [syncEdges, seasons, hasComplete]);

  useEffect(() => {
    window.addEventListener("resize", syncEdges);
    return () => window.removeEventListener("resize", syncEdges);
  }, [syncEdges]);

  function page(dir: -1 | 1) {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div className="px-5 pt-0.5 pb-3">
      <div className={`${CHIP_TRACK} max-w-full`}>
        {edges.scrollable && <ScrollArrow side="left" show={edges.left} onClick={() => page(-1)} />}
        <div
          ref={ref}
          {...dragProps}
          onScroll={syncEdges}
          className="min-w-0 flex-1 overflow-x-auto cursor-grab select-none active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-max items-center gap-0.5">
            {activeSeason !== null && hasComplete && (
              <button
                onClick={() => onChange("complete")}
                className={chipClass(activeSeason === "complete")}
              >
                Intégrale
              </button>
            )}
            {seasons === null || activeSeason === null
              ? Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className="h-[26px] w-24 shrink-0 rounded-[9px] bg-white/70 dark:bg-zinc-800/60 animate-pulse"
                  />
                ))
              : seasons.map((s) => (
                  <button
                    key={s.number}
                    onClick={() => onChange(s.number)}
                    className={chipClass(activeSeason === s.number)}
                  >
                    Saison {s.number}
                    <span
                      className={`ml-1.5 ${
                        activeSeason === s.number
                          ? "text-zinc-400 dark:text-zinc-400"
                          : "text-zinc-400/70 dark:text-zinc-600"
                      }`}
                    >
                      {s.episodeCount} ép.
                    </span>
                  </button>
                ))}
          </div>
        </div>
        {edges.scrollable && (
          <ScrollArrow side="right" show={edges.right} onClick={() => page(1)} />
        )}
      </div>
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
      aria-label={side === "left" ? "Saisons précédentes" : "Saisons suivantes"}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-black/[0.06] hover:text-zinc-900 disabled:pointer-events-none disabled:text-zinc-300 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-white dark:disabled:text-zinc-700"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
