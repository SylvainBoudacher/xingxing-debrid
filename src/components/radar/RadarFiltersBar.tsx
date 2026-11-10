import { CHIP_TRACK } from "@/components/chipStyles";
import { RadarChipGroup } from "@/components/radar/RadarChipGroup";
import { RadarModeSelect } from "@/components/radar/RadarModeSelect";
import { RadarStatusTabs } from "@/components/radar/RadarStatusTabs";
import { Input } from "@/components/ui/input";
import type { RadarFilters, RadarStatusCounts } from "@/lib/radar/view";
import { Library, Search } from "lucide-react";

interface RadarFiltersBarProps {
  filters: RadarFilters;
  counts: RadarStatusCounts;
  onChange: (filters: RadarFilters) => void;
}

const TYPES: [RadarFilters["type"], string][] = [
  ["all", "Tout"],
  ["movie", "Films"],
  ["tv", "Séries"],
];

const LIBRARY_BASE =
  "flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-medium ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400";
const LIBRARY_ON = "bg-indigo-500/15 text-indigo-600 ring-indigo-500/40 dark:text-indigo-300";
const LIBRARY_OFF =
  "bg-white/70 text-zinc-600 ring-black/10 hover:text-zinc-900 dark:bg-zinc-900/60 dark:text-zinc-300 dark:ring-white/10 dark:hover:text-white";

export function RadarFiltersBar({ filters, counts, onChange }: RadarFiltersBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Rechercher un titre suivi..."
            className="h-9 rounded-xl border-black/10 bg-white/70 pl-9 dark:border-white/10 dark:bg-zinc-900/60"
          />
        </div>
        <div className={`${CHIP_TRACK} h-9`}>
          <RadarChipGroup
            options={TYPES}
            active={filters.type}
            onSelect={(type) => onChange({ ...filters, type })}
          />
        </div>
        <RadarModeSelect value={filters.mode} onChange={(mode) => onChange({ ...filters, mode })} />
        <button
          type="button"
          aria-pressed={filters.inLibrary}
          onClick={() => onChange({ ...filters, inLibrary: !filters.inLibrary })}
          className={`${LIBRARY_BASE} ${filters.inLibrary ? LIBRARY_ON : LIBRARY_OFF}`}
        >
          <Library className="h-3.5 w-3.5" />
          En bibliothèque
        </button>
      </div>
      <RadarStatusTabs
        active={filters.state}
        counts={counts}
        onSelect={(state) => onChange({ ...filters, state })}
      />
    </div>
  );
}
