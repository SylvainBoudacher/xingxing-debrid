import { TREE } from "./catalog/tree";
import type { GardenSave } from "./types";

// Ce que les nœuds récupérés changent dans les autres systèmes.
export function sachetsPerDay(save: GardenSave): number {
  const extra = TREE.filter(
    (n) => n.reward.kind === "sachet-quotidien" && save.progress.nodes[n.id],
  ).length;
  return 1 + extra;
}
