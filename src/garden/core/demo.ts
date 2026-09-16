import { GROWTH_MS } from "./growth";
import { soilTiles } from "./plots";
import type { ColorId, GardenSave, Rarity, SpeciesId, VariantId } from "./types";

const DEMO: [SpeciesId, ColorId, Rarity, VariantId?][] = [
  ["tournesol", "yellow", "commune"],
  ["rosetremiere", "black", "legendaire"],
  ["dahlia", "apricot", "rare"],
  ["cosmos", "pink", "commune", "doree"],
  ["aster", "white", "epique"],
  ["chrysantheme", "lime", "legendaire"],
  ["bruyere", "heather", "commune", "givree"],
  ["colchique", "violet", "rare"],
  ["anemone", "burgundy", "epique"],
  ["sedum", "pink", "commune", "lumineuse"],
  ["amarante", "red", "commune"],
  ["vergedor", "white", "legendaire", "givree"],
  ["heliopsis", "bronze", "rare"],
  ["lanternelune", "blue", "legendaire"],
];

// Plantes de démonstration pour vérifier le rendu en développement : les
// premières sont écloses (espèces, raretés, variantes), les suivantes couvrent les 5 étapes.
export function withDemoPlants(save: GardenSave, now: number): GardenSave {
  const tiles = { ...save.tiles };
  soilTiles(save.plots).forEach((key, i) => {
    const [species, color, rarity, variant] = DEMO[i % DEMO.length];
    const fraction = i < DEMO.length ? 1.05 : (i % 5) / 4 + 0.05;
    tiles[key] = {
      kind: "plant",
      seed: { species, color, rarity, ...(variant && { variant }) },
      sownAt: now - Math.min(fraction, 1.2) * GROWTH_MS[rarity],
      watered: [],
    };
  });
  return { ...save, tiles };
}
