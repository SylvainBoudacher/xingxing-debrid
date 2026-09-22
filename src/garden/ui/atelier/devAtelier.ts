import { RECIPES, recipeById } from "../../core/catalog/recipes";
import type { GardenSave } from "../../core/types";

const ATELIER_NODES = ["a1", "a2", "a3", "a4", "a5"];

// Outils de développement : tout l'atelier d'un coup, 3 doses de chaque préparation,
// un brassage terminé tout de suite.
export const withAtelierUnlocked = (save: GardenSave, now: number): GardenSave => ({
  ...save,
  progress: {
    ...save.progress,
    nodes: {
      ...save.progress.nodes,
      ...Object.fromEntries(ATELIER_NODES.map((id) => [id, now])),
    },
  },
});

export function withAllPotions(save: GardenSave): GardenSave {
  const potions = save.inventory.potions;
  return {
    ...save,
    inventory: {
      ...save.inventory,
      potions: Object.fromEntries(RECIPES.map((r) => [r.id, (potions[r.id] ?? 0) + 3])),
    },
  };
}

export function withBrewDone(save: GardenSave): GardenSave {
  const brew = save.atelier.brew;
  if (!brew) return save;
  const startedAt = brew.startedAt - recipeById(brew.recipe).durationMs;
  return { ...save, atelier: { brew: { ...brew, startedAt } } };
}
