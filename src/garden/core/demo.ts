import { GROWTH_MS } from "./growth";
import { soilTiles } from "./plots";
import type { ColorId, GardenSave, Rarity, SpeciesId } from "./types";

const DEMO: [SpeciesId, ColorId, Rarity][] = [
  ["tournesol", "yellow", "commune"],
  ["rosetremiere", "pink", "epique"],
  ["dahlia", "red", "rare"],
  ["cosmos", "white", "rare"],
  ["aster", "violet", "commune"],
  ["chrysantheme", "bronze", "commune"],
  ["bruyere", "heather", "commune"],
  ["colchique", "lilac", "epique"],
  ["dahlia", "violet", "legendaire"],
];

// Plantes de démonstration pour vérifier le rendu en développement : une case
// sur deux, avec des âges qui couvrent les 5 étapes.
export function withDemoPlants(save: GardenSave, now: number): GardenSave {
  const tiles = { ...save.tiles };
  soilTiles(save.plots)
    .filter((_, i) => i % 2 === 0)
    .forEach((key, i) => {
      const [species, color, rarity] = DEMO[i % DEMO.length];
      const fraction = (i % 5) / 4 + 0.05;
      tiles[key] = {
        kind: "plant",
        seed: { species, color, rarity },
        sownAt: now - Math.min(fraction, 1.2) * GROWTH_MS[rarity],
        watered: [],
      };
    });
  return { ...save, tiles };
}
