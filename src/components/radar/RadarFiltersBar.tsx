import { RadarChipGroup } from "@/components/radar/RadarChipGroup";
import { Input } from "@/components/ui/input";
import type { RadarFilters } from "@/lib/radar/view";

interface RadarFiltersBarProps {
  filters: RadarFilters;
  onChange: (filters: RadarFilters) => void;
}

const TYPES: [RadarFilters["type"], string][] = [
  ["all", "Tout"],
  ["movie", "Films"],
  ["tv", "Séries"],
];
const STATES: [RadarFilters["state"], string][] = [
  ["all", "Tous les états"],
  ["released", "Sorti"],
  ["partial", "Mi-alerte"],
  ["waiting", "En attente"],
  ["finished", "Terminé"],
  ["in-library", "En bibliothèque"],
];
const MODES: [RadarFilters["mode"], string][] = [
  ["all", "Tous les modes"],
  ["strict", "Strict"],
  ["soft", "Souple"],
];

export function RadarFiltersBar({ filters, onChange }: RadarFiltersBarProps) {
  return (
    <div className="space-y-2">
      <Input
        value={filters.query}
        onChange={(e) => onChange({ ...filters, query: e.target.value })}
        placeholder="Filtrer par titre..."
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <RadarChipGroup
          options={TYPES}
          active={filters.type}
          onSelect={(type) => onChange({ ...filters, type })}
        />
        <RadarChipGroup
          options={STATES}
          active={filters.state}
          onSelect={(state) => onChange({ ...filters, state })}
        />
        <RadarChipGroup
          options={MODES}
          active={filters.mode}
          onSelect={(mode) => onChange({ ...filters, mode })}
        />
      </div>
    </div>
  );
}
