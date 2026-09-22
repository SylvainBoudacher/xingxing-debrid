import type { RecipeId } from "./catalog/recipes";
import { TREE, type TreeNode } from "./catalog/tree";
import type { GardenSave } from "./types";

// Ce que les nœuds récupérés changent dans les autres systèmes.
export function sachetsPerDay(save: GardenSave): number {
  const extra = TREE.filter(
    (n) => n.reward.kind === "sachet-quotidien" && save.progress.nodes[n.id],
  ).length;
  return 1 + extra;
}

export function knownRecipes(save: GardenSave): RecipeId[] {
  return TREE.flatMap((n) =>
    n.reward.kind === "recettes" && save.progress.nodes[n.id] ? n.reward.recipes : [],
  );
}

export const recipeNode = (id: RecipeId): TreeNode | undefined =>
  TREE.find((n) => n.reward.kind === "recettes" && n.reward.recipes.includes(id));
