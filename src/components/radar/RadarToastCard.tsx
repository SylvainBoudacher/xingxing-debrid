import { RadarToastPosters } from "@/components/radar/RadarToastPosters";
import type { RadarToastContent } from "@/lib/radar/view";
import { ArrowRight, Radar } from "lucide-react";

interface RadarToastCardProps {
  content: RadarToastContent;
  onOpen?: () => void;
}

const THEMES = {
  full: {
    frame: "ring-emerald-400/70 shadow-emerald-500/25",
    glow: "from-emerald-500/35",
    accent: "text-emerald-300",
    wave: "border-emerald-400/50",
    pill: "bg-emerald-400/15 text-emerald-200",
    button: "bg-emerald-400 text-emerald-950 hover:bg-emerald-300",
  },
  partial: {
    frame: "ring-amber-400/60 shadow-amber-500/20",
    glow: "from-amber-500/30",
    accent: "text-amber-300",
    wave: "border-amber-400/50",
    pill: "bg-amber-400/15 text-amber-200",
    button: "bg-amber-400 text-amber-950 hover:bg-amber-300",
  },
};

const WAVES = ["h-28 w-28", "h-48 w-48 [animation-delay:500ms]", "h-64 w-64 [animation-delay:1s]"];

export function RadarToastCard({ content, onOpen }: RadarToastCardProps) {
  const theme = THEMES[content.level];
  return (
    <div
      className={`relative flex w-[400px] items-center gap-4 overflow-hidden rounded-2xl bg-zinc-950 p-3 pr-4 text-white shadow-2xl ring-2 ${theme.frame}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${theme.glow} to-transparent`} />
      {WAVES.map((size) => (
        <span
          key={size}
          className={`absolute top-1/2 left-12 -translate-x-1/2 -translate-y-1/2 rounded-full border motion-safe:animate-ping ${size} ${theme.wave}`}
        />
      ))}

      <div className="relative">
        <RadarToastPosters posters={content.posters} />
      </div>

      <div className="relative min-w-0 flex-1">
        <div
          className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${theme.accent}`}
        >
          <Radar className="h-3.5 w-3.5" />
          <span className="truncate">{content.label}</span>
        </div>
        <p className="mt-1 truncate text-base font-bold leading-tight">{content.title}</p>
        <p className="mt-0.5 truncate text-xs text-zinc-300">{content.detail}</p>
        {content.version && (
          <span
            className={`mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${theme.pill}`}
          >
            {content.version}
          </span>
        )}
      </div>

      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          className={`relative flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${theme.button}`}
        >
          Voir
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
