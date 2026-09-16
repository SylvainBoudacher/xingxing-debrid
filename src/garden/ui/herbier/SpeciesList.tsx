import { SPECIES } from "../../core/catalog/species";
import { herbierProgress, speciesProgress } from "../../core/herbier";
import type { GardenSave, SpeciesId } from "../../core/types";

export function SpeciesList({
  save,
  selected,
  onSelect,
}: {
  save: GardenSave;
  selected: SpeciesId;
  onSelect: (id: SpeciesId) => void;
}) {
  const total = herbierProgress(save);
  return (
    <div className="flex flex-col gap-0.5 border-r-2 border-dashed border-[#b08a5a] pr-3">
      <div className="mb-2">
        <div className="flex justify-between font-serif text-lg">
          <span>Herbier</span>
          <span>
            {total.found} / {total.total}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded bg-[#d6c29a]">
          <i
            className="block h-full bg-gradient-to-r from-[#b8801c] to-[#f3c34a]"
            style={{ width: `${(total.found / total.total) * 100}%` }}
          />
        </div>
      </div>
      {SPECIES.map((s) => {
        const p = speciesProgress(save, s.id);
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            aria-pressed={selected === s.id}
            className={`flex justify-between rounded-md px-2 py-1 text-left ${
              selected === s.id ? "bg-[#d6c29a] font-bold" : "hover:bg-[#e0cfa8]"
            }`}
          >
            <span>{s.name}</span>
            <span>
              {p.found}/{p.total}
            </span>
          </button>
        );
      })}
    </div>
  );
}
