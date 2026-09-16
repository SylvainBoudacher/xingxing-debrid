import type { SpeciesId } from "../../core/types";
import type { DrawFn } from "../raster";
import { amarante } from "./amarante";
import { anemone } from "./anemone";
import { aster } from "./aster";
import { bruyere } from "./bruyere";
import { chrysantheme } from "./chrysantheme";
import { colchique } from "./colchique";
import { cosmos } from "./cosmos";
import { dahlia } from "./dahlia";
import { heliopsis } from "./heliopsis";
import { lanternelune } from "./lanternelune";
import { rosetremiere } from "./rosetremiere";
import { sedum } from "./sedum";
import { tournesol } from "./tournesol";
import { vergedor } from "./vergedor";

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
  anemone,
  sedum,
  amarante,
  vergedor,
  heliopsis,
  lanternelune,
};
