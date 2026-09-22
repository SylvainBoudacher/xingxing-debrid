import type { SpriteRef } from "../../sprites/sprite";
import { HOUR } from "../time";
import type { Rarity } from "../types";

export type RecipeId =
  "croissance" | "rosee" | "clairvoyance" | "teinture" | "givre" | "or" | "lune";

export interface Recipe {
  id: RecipeId;
  name: string;
  // phrase courte pour le panneau du champ et la page Atelier
  effect: string;
  ingredients: Partial<Record<Rarity, number>>;
  durationMs: number;
  doses: number;
  icon: SpriteRef;
}

// Ordre du catalogue : celui de la page Atelier.
export const RECIPES: Recipe[] = [
  {
    id: "croissance",
    name: "Élixir de croissance",
    effect: "La plante gagne une étape d'un coup.",
    ingredients: { commune: 3 },
    durationMs: 2 * HOUR,
    doses: 3,
    icon: { name: "fiole", color: "lime" },
  },
  {
    id: "rosee",
    name: "Rosée du matin",
    effect: "Arrose toutes les plantes d'un carré de 3 x 3 cases.",
    ingredients: { commune: 2 },
    durationMs: HOUR,
    doses: 2,
    icon: { name: "fiole", color: "blue" },
  },
  {
    id: "clairvoyance",
    name: "Élixir de clairvoyance",
    effect: "Révèle l'espèce et la couleur d'une plante avant l'éclosion.",
    ingredients: { commune: 2 },
    durationMs: HOUR,
    doses: 3,
    icon: { name: "fiole", color: "violet" },
  },
  {
    id: "teinture",
    name: "Teinture",
    effect: "Change la couleur d'une plante pour une autre de même rareté, et la révèle.",
    ingredients: { commune: 2, rare: 1 },
    durationMs: 3 * HOUR,
    doses: 2,
    icon: { name: "fiole", color: "pink" },
  },
  {
    id: "givre",
    name: "Poudre de givre",
    effect: "Une chance sur deux que la plante éclose givrée.",
    ingredients: { commune: 2, rare: 1 },
    durationMs: 4 * HOUR,
    doses: 2,
    icon: { name: "poudre", color: "white" },
  },
  {
    id: "or",
    name: "Poudre d'or",
    effect: "Une chance sur deux que la plante éclose dorée.",
    ingredients: { rare: 2 },
    durationMs: 5 * HOUR,
    doses: 2,
    icon: { name: "poudre", color: "yellow" },
  },
  {
    id: "lune",
    name: "Poudre de lune",
    effect: "Une chance sur deux que la plante éclose lumineuse.",
    ingredients: { epique: 1, rare: 1 },
    durationMs: 6 * HOUR,
    doses: 2,
    icon: { name: "poudre", color: "lilac" },
  },
];

const BY_ID = new Map(RECIPES.map((r) => [r.id, r]));

export const isRecipeId = (v: unknown): v is RecipeId =>
  typeof v === "string" && BY_ID.has(v as RecipeId);

export const recipeById = (id: RecipeId): Recipe => BY_ID.get(id)!;
