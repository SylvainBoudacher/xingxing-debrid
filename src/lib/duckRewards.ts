import { SPECIES } from "@/components/duckSpecies";
import type { Effect, Variant } from "@/components/duckTypes";

// Catalogue des canards de récompense: ils ne sortent jamais d'un tirage, ils
// se réclament dans le Canardex. Chaque récompense vise une métrique de
// progression et un seuil, et mémorise son déblocage sous sa propre clé de
// store dans duckdex.json.

export interface DexProgress {
  species: number; // espèces découvertes
  shiny: number; // espèces collectionnées en shiny
  families: number; // espèces colorables dont toutes les couleurs sont prises
}

export type RewardMetric = keyof DexProgress;

// Les récompenses de couleurs et celles de collection ne se gagnent pas de la
// même façon: le Canardex les affiche dans deux sections distinctes.
export type RewardGroup = "colors" | "collection";

export interface DuckReward {
  id: string;
  name: string;
  scale: number;
  storeKey: string;
  group: RewardGroup;
  metric: RewardMetric;
  threshold: number;
  unit: string; // libellé du compteur de progression
  lockedHint: string;
  claimToast: string;
  variant: () => Variant;
}

export const REWARDS: DuckReward[] = [
  {
    id: "canardex-chameleon",
    group: "colors",
    name: "Canard Caméléon",
    scale: 1,
    storeKey: "chameleon_claimed",
    metric: "families",
    threshold: 1,
    unit: "famille",
    lockedHint: "Collectionne toutes les couleurs d'une même espèce.",
    claimToast: "Canard Caméléon a rejoint ta collection !",
    variant: () => ({
      body: "#8FD14F",
      beak: "#F5811F",
      acc: "none",
      pattern: "scales",
      effect: "chameleon",
    }),
  },
  {
    id: "canardex-peacock",
    group: "colors",
    name: "Canard Paon",
    scale: 1.2,
    storeKey: "peacock_claimed",
    metric: "families",
    threshold: 5,
    unit: "familles",
    lockedHint: "Complète les couleurs de 5 espèces.",
    claimToast: "Canard Paon déploie sa roue !",
    variant: () => ({ body: "#2E6B5E", beak: "#F5811F", acc: "none", effect: "peacock" }),
  },
  {
    id: "canardex-phoenix",
    group: "colors",
    name: "Canard Phénix Chromatique",
    scale: 1.7,
    storeKey: "phoenix_claimed",
    metric: "families",
    threshold: 10,
    unit: "familles",
    lockedHint: "Complète les couleurs de 10 espèces.",
    claimToast: "Le Phénix Chromatique renaît de ses cendres !",
    variant: () => ({
      body: "#FFF3D6",
      beak: "#E8B93C",
      acc: "none",
      pattern: "ember",
      effect: "phoenix",
    }),
  },
  {
    id: "canardex-reward",
    group: "collection",
    name: "Canard Supernova",
    scale: 1.15,
    storeKey: "reward_claimed",
    metric: "species",
    threshold: SPECIES.length,
    unit: "espèces",
    lockedHint: `Découvre les ${SPECIES.length} espèces.`,
    claimToast: "Canard Supernova a rejoint ta collection !",
    variant: () => ({
      body: "#1B1035",
      beak: "#FFD21E",
      acc: "halo",
      pattern: "galaxy",
      effect: "nova",
    }),
  },
  {
    id: "canardex-god",
    group: "collection",
    name: "Zeus, le Dieu Canard",
    scale: 1.7,
    storeKey: "god_claimed",
    metric: "shiny",
    threshold: SPECIES.length,
    unit: "shiny",
    lockedHint: `Collectionne la version shiny des ${SPECIES.length} espèces.`,
    claimToast: "Zeus, le Dieu Canard descend de l'Olympe !",
    variant: () => ({ body: "#F4EFE4", beak: "#E8B93C", acc: "laurel", effect: "godly" }),
  },
];

export const REWARDS_BY_ID = new Map(REWARDS.map((r) => [r.id, r]));
export const COLOR_REWARDS = REWARDS.filter((r) => r.group === "colors");
export const COLLECTION_REWARDS = REWARDS.filter((r) => r.group === "collection");

// Progression affichée sur une carte, plafonnée au seuil: le compteur de
// familles peut dépasser 10 sans que la carte affiche 15/10.
export function rewardProgress(r: DuckReward, p: DexProgress): { done: number; total: number } {
  return { done: Math.min(p[r.metric], r.threshold), total: r.threshold };
}

// La récompense que ce nombre exact de familles vient de débloquer, s'il y en a.
export function familyRewardAt(families: number): DuckReward | undefined {
  return REWARDS.find((r) => r.metric === "families" && r.threshold === families);
}

const REWARD_EFFECTS = new Set<Effect>(REWARDS.map((r) => r.variant().effect!));

// Une récompense n'est pas une espèce: la re-sauvegarder ne doit rien débloquer.
export function isRewardEffect(e?: Effect): boolean {
  return !!e && REWARD_EFFECTS.has(e);
}
