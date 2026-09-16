import { useState } from "react";
import { latestSpecies } from "../../core/herbier";
import type { GardenSave, SpeciesId } from "../../core/types";
import { SpeciesList } from "./SpeciesList";
import { SpeciesPlate } from "./SpeciesPlate";

// Carnet d'herbier ouvert : espèces à gauche, planche de l'espèce à droite.
export function HerbierPage({ save }: { save: GardenSave }) {
  const [species, setSpecies] = useState<SpeciesId>(() => latestSpecies(save));
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="mx-auto grid max-w-5xl grid-cols-[210px_1fr] rounded-xl bg-[#e9dcc0] p-4 text-[#3a2418] shadow-[inset_0_0_0_4px_#6a4428]">
        <SpeciesList save={save} selected={species} onSelect={setSpecies} />
        <SpeciesPlate key={species} save={save} species={species} />
      </div>
    </div>
  );
}
