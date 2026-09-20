import { DAY } from "../../core/time";
import type { GardenSave } from "../../core/types";

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
