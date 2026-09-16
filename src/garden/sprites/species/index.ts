import type { SpeciesId } from "../../core/types";
import type { DrawFn } from "../raster";
import { aster } from "./aster";
import { bruyere } from "./bruyere";
import { chrysantheme } from "./chrysantheme";
import { colchique } from "./colchique";
import { cosmos } from "./cosmos";
import { dahlia } from "./dahlia";
import { rosetremiere } from "./rosetremiere";
import { tournesol } from "./tournesol";

// Chaque espèce a sa silhouette ; `C` est la gamme de sa couleur.
export const SPECIES_DRAW: Record<SpeciesId, DrawFn> = {
  tournesol,
  dahlia,
  cosmos,
  aster,
  bruyere,
  colchique,
  chrysantheme,
  rosetremiere,
};
