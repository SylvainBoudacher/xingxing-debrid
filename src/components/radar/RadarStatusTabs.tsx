import type { RadarFilters, RadarStatusCounts } from "@/lib/radar/view";

interface RadarStatusTabsProps {
  active: RadarFilters["state"];
  counts: RadarStatusCounts;
  onSelect: (state: RadarFilters["state"]) => void;
}

// Pastille et soulignement reprennent les couleurs du contour des lignes.
const TABS: { id: RadarFilters["state"]; label: string; dot: string; underline: string }[] = [
  { id: "all", label: "Tous", dot: "", underline: "border-indigo-500" },
  {
    id: "released",
    label: "Disponible",
    dot: "bg-emerald-500",
    underline: "border-emerald-500",
  },
  { id: "partial", label: "Alternative", dot: "bg-amber-500", underline: "border-amber-500" },
  {
    id: "waiting",
    label: "En attente",
    dot: "ring-1 ring-inset ring-zinc-400",
    underline: "border-zinc-400",
  },
  { id: "finished", label: "Terminé", dot: "bg-zinc-400", underline: "border-zinc-400" },
];

export function RadarStatusTabs({ active, counts, onSelect }: RadarStatusTabsProps) {
  return (
    <div className="flex overflow-x-auto border-b border-black/10 [scrollbar-width:none] dark:border-white/10">
      {TABS.map(({ id, label, dot, underline }) => {
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(id)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors focus-visible:rounded-t-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400 ${
              selected
                ? `${underline} text-zinc-900 dark:text-white`
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
            {label}
            <span className="tabular-nums text-zinc-400 dark:text-zinc-500">{counts[id]}</span>
          </button>
        );
      })}
    </div>
  );
}
