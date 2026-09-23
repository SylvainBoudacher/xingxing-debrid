import { DAY } from "../../core/time";
import { rollSeedOfRarity, type Rng } from "../../core/rolls";
import type { GardenSave, Seed } from "../../core/types";

// Outils de développement : un sachet de plus, ou un jour de retard sur l'horloge
// du crédit quotidien pour que le prochain tick crédite.
export const withExtraSachet = (save: GardenSave): GardenSave => ({
  ...save,
  sachets: { ...save.sachets, pending: [...save.sachets.pending, "quotidien"] },
});

export const withPreviousDay = (save: GardenSave): GardenSave => ({
  ...save,
  sachets: { ...save.sachets, lastDailyAt: save.sachets.lastDailyAt - DAY },
});

// Lot imposé pour tester la mise en scène haut de gamme sans compter sur la chance.
export const devLegendarySeeds = (rng: Rng): Seed[] =>
  (["commune", "epique", "legendaire"] as const).map((r) => rollSeedOfRarity(r, rng));
