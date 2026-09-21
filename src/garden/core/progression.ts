import { nodeById, TREE, type NodeId, type Reward, type Task, type TreeNode } from "./catalog/tree";
import { rarityOf, SPECIES } from "./catalog/species";
import { entryId } from "./discovery";
import { rollSeedOfRarity, type Rng } from "./rolls";
import { MAX_PENDING } from "./sachets";
import type { GardenSave, SpeciesId } from "./types";

export type NodeState = "verrouille" | "ouvert" | "pret" | "termine";

export interface Progress {
  value: number;
  target: number;
}

const RARE_OR_BETTER = new Set(["rare", "epique", "legendaire"]);

function herbierMeasure(save: GardenSave, measure: string): number {
  const ids = Object.keys(save.herbier);
  switch (measure) {
    case "entrees":
      return ids.length;
    case "raretes":
      return ids.filter((id) => {
        const [species, color] = id.split(":");
        const rarity = rarityOf(species as SpeciesId, color as never);
        return rarity !== null && RARE_OR_BETTER.has(rarity);
      }).length;
    case "familles":
      return SPECIES.filter((s) => s.colors.every((c) => save.herbier[entryId(s.id, c.color)]))
        .length;
    default:
      return ids.filter((id) => save.herbier[id].variants.length > 0).length;
  }
}

const basketTarget = (task: Task & { kind: "panier" }): number =>
  task.items.reduce((sum, item) => sum + item.count, 0);

export function progressOf(save: GardenSave, node: TreeNode): Progress {
  const task = node.task;
  if (task.kind === "counter")
    return { value: save.progress.counters[task.id] ?? 0, target: task.target };
  if (task.kind === "herbier")
    return { value: herbierMeasure(save, task.measure), target: task.target };
  const deposits = save.progress.baskets[node.id] ?? {};
  const value = task.items.reduce(
    (sum, item) => sum + Math.min(item.count, deposits[item.species] ?? 0),
    0,
  );
  return { value, target: basketTarget(task) };
}

export function stateOf(save: GardenSave, node: TreeNode): NodeState {
  if (save.progress.nodes[node.id]) return "termine";
  const parent = node.parent ? nodeById(node.parent) : undefined;
  if (parent && !save.progress.nodes[parent.id]) return "verrouille";
  const { value, target } = progressOf(save, node);
  return value >= target ? "pret" : "ouvert";
}

export const openNodes = (save: GardenSave): TreeNode[] =>
  TREE.filter((n) => stateOf(save, n) !== "verrouille" && stateOf(save, n) !== "termine");

export const readyCount = (save: GardenSave): number =>
  TREE.filter((n) => stateOf(save, n) === "pret").length;

function applyReward(save: GardenSave, reward: Reward, rng: Rng): GardenSave {
  switch (reward.kind) {
    // le deuxième sachet du jour se déduit du nœud récupéré, rien à écrire
    case "sachet-quotidien":
      return save;
    case "sachet": {
      const pending = save.sachets.pending;
      if (pending.length >= MAX_PENDING) return save;
      return { ...save, sachets: { ...save.sachets, pending: [...pending, reward.sachet] } };
    }
    case "parcelle":
      return save.plots.includes(reward.plot)
        ? save
        : { ...save, plots: [...save.plots, reward.plot] };
    case "decor": {
      const decor = save.inventory.decor;
      return {
        ...save,
        inventory: {
          ...save.inventory,
          decor: { ...decor, [reward.decor]: (decor[reward.decor] ?? 0) + reward.count },
        },
      };
    }
    case "graines": {
      const seeds = Array.from({ length: reward.count }, () =>
        rollSeedOfRarity(reward.rarity, rng),
      );
      return {
        ...save,
        inventory: { ...save.inventory, seeds: [...save.inventory.seeds, ...seeds] },
      };
    }
  }
}

export function claim(save: GardenSave, id: NodeId, now: number, rng: Rng): GardenSave | null {
  const node = nodeById(id);
  if (!node || stateOf(save, node) !== "pret") return null;
  const next = applyReward(save, node.reward, rng);
  return {
    ...next,
    progress: { ...next.progress, nodes: { ...next.progress.nodes, [id]: now } },
  };
}

export function deposit(save: GardenSave, id: NodeId, species: SpeciesId): GardenSave | null {
  const node = nodeById(id);
  if (!node || node.task.kind !== "panier" || stateOf(save, node) !== "ouvert") return null;

  const item = node.task.items.find((i) => i.species === species);
  if (!item) return null;
  const deposits = save.progress.baskets[id] ?? {};
  if ((deposits[species] ?? 0) >= item.count) return null;

  const index = save.inventory.basket.findIndex((f) => f.species === species);
  if (index < 0) return null;
  const basket = save.inventory.basket.filter((_, i) => i !== index);

  return {
    ...save,
    inventory: { ...save.inventory, basket },
    progress: {
      ...save.progress,
      baskets: {
        ...save.progress.baskets,
        [id]: { ...deposits, [species]: (deposits[species] ?? 0) + 1 },
      },
    },
  };
}
