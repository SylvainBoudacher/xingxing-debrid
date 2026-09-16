import { speciesOf } from "../../core/catalog/species";
import { speciesProgress } from "../../core/herbier";
import type { GardenSave, SpeciesId } from "../../core/types";
import { specimensOf, tiltOf } from "./plate";
import { SpeciesNotes } from "./SpeciesNotes";
import { SpecimenCard } from "./SpecimenCard";

export function SpeciesPlate({ save, species }: { save: GardenSave; species: SpeciesId }) {
  const p = speciesProgress(save, species);
  return (
    <div className="pl-5">
      <h5 className="font-serif text-2xl font-semibold">{speciesOf(species).name}</h5>
      <div className="mb-3 italic">
        {p.found} {p.found > 1 ? "couleurs" : "couleur"} sur {p.total}
      </div>
      <div className="flex flex-wrap gap-4">
        {specimensOf(save, species).map((sp, i) => (
          <SpecimenCard key={sp.color} species={species} specimen={sp} tilt={tiltOf(i)} />
        ))}
      </div>
      <SpeciesNotes species={species} />
    </div>
  );
}
