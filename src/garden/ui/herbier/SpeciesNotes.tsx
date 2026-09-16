import { speciesOf } from "../../core/catalog/species";
import { GROWTH_MS } from "../../core/growth";
import { formatDuration, HARVEST_FR, RARITY_FR } from "../../core/labels";
import type { SpeciesId } from "../../core/types";
import { RARITY_ORDER } from "./plate";

export function SpeciesNotes({ species }: { species: SpeciesId }) {
  const s = speciesOf(species);
  const rarities = RARITY_ORDER.filter((r) => s.colors.some((c) => c.rarity === r));
  return (
    <div className="mt-5 grid gap-4 border-t border-dashed border-[#b08a5a] pt-3 sm:grid-cols-[1fr_220px]">
      <div>
        <h6 className="font-serif text-base font-semibold">Note du jardinier</h6>
        <p className="font-serif italic leading-snug text-[#5a4028]">{s.note}</p>
      </div>
      <div className="text-sm">
        <div>
          <b>Cueillette :</b> {HARVEST_FR[s.tool]}
        </div>
        <div className="mt-1">
          <b>Pousse :</b>
        </div>
        {rarities.map((r) => (
          <div key={r} className="flex justify-between">
            <span>{RARITY_FR[r]}</span>
            <span>{formatDuration(GROWTH_MS[r])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
