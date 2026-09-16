import type { ColorId, DecorId, Rarity, SpeciesId, Stage } from "./types";

export const SPECIES_FR: Record<SpeciesId, string> = {
  tournesol: "Tournesol",
  rosetremiere: "Rose trémière",
  dahlia: "Dahlia",
  cosmos: "Cosmos",
  aster: "Aster",
  chrysantheme: "Chrysanthème",
  bruyere: "Bruyère",
  colchique: "Colchique",
};

const FEMININE: ReadonlySet<SpeciesId> = new Set(["rosetremiere", "bruyere"]);

// [masculin, féminin]
const COLOR_FR: Record<ColorId, [string, string]> = {
  yellow: ["jaune", "jaune"],
  pink: ["rose", "rose"],
  white: ["blanc", "blanche"],
  violet: ["violet", "violette"],
  red: ["rouge", "rouge"],
  orange: ["orange", "orange"],
  bronze: ["bronze", "bronze"],
  heather: ["pourpre", "pourpre"],
  lilac: ["lilas", "lilas"],
};

export const RARITY_FR: Record<Rarity, string> = {
  commune: "Commune",
  rare: "Rare",
  epique: "Épique",
  legendaire: "Légendaire",
};

export const STAGE_FR: Record<Stage, string> = {
  0: "Graine",
  1: "Pousse",
  2: "Jeune plant",
  3: "Bouton",
  4: "En fleur",
};

export const DECOR_FR: Record<DecorId, string> = {
  lanterne: "Lanterne",
  citrouille: "Citrouille",
  paille: "Botte de paille",
};

export function flowerName(f: { species: SpeciesId; color: ColorId }): string {
  const [m, fem] = COLOR_FR[f.color];
  return `${SPECIES_FR[f.species]} ${FEMININE.has(f.species) ? fem : m}`;
}

export const pickedWord = (species: SpeciesId): string =>
  FEMININE.has(species) ? "cueillie" : "cueilli";

export function formatDuration(ms: number): string {
  const min = Math.max(1, Math.ceil(ms / 60_000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}
