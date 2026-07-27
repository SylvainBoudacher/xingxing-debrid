import type { ReadingDirection } from "@/lib/mangaLibrary";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ReaderProgressProps {
  index: number;
  total: number;
  direction: ReadingDirection;
  onSeek: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function ReaderProgress({
  index,
  total,
  direction,
  onSeek,
  onPrev,
  onNext,
}: ReaderProgressProps) {
  // En lecture japonaise, la barre progresse de la droite vers la gauche pour
  // suivre le sens de tourne des pages.
  const rtl = direction === "rtl";
  return (
    <div className="flex items-center gap-3 border-t border-white/5 bg-black/40 px-4 py-2 backdrop-blur-xl">
      <button
        onClick={rtl ? onNext : onPrev}
        aria-label={rtl ? "Page suivante" : "Page précédente"}
        className="rounded-lg p-1.5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <input
        type="range"
        min={0}
        max={Math.max(0, total - 1)}
        value={index}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="Position dans le tome"
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-indigo-400"
        style={{ direction: rtl ? "rtl" : "ltr" }}
      />

      <span className="w-16 text-center text-xs tabular-nums text-zinc-400">
        {total === 0 ? "-" : `${index + 1} / ${total}`}
      </span>

      <button
        onClick={rtl ? onPrev : onNext}
        aria-label={rtl ? "Page précédente" : "Page suivante"}
        className="rounded-lg p-1.5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
