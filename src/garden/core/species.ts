import type { SpeciesId } from "./types";

// Remplacé par le catalogue des espèces au sous-projet 3.
export const CUT_SPECIES: ReadonlySet<SpeciesId> = new Set([
  "tournesol",
  "rosetremiere",
  "dahlia",
  "chrysantheme",
]);

export type HarvestTool = "main" | "secateur";

export const harvestTool = (species: SpeciesId): HarvestTool =>
  CUT_SPECIES.has(species) ? "secateur" : "main";
