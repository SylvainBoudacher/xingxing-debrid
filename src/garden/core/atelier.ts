import { recipeById, type RecipeId } from "./catalog/recipes";
import { bump } from "./counters";
import type { Flower, GardenSave, Rarity } from "./types";
import { knownRecipes } from "./unlocks";

export type Ingredients = Partial<Record<Rarity, number>>;

export interface BrewStatus {
  recipe: RecipeId;
  remaining: number;
  ready: boolean;
}

const entriesOf = (need: Ingredients) => Object.entries(need) as [Rarity, number][];

// Les plus anciennes fleurs de chaque rareté, celles qui portent une variante en dernier.
export function pickIngredients(basket: Flower[], need: Ingredients): number[] | null {
  const picked: number[] = [];
  for (const [rarity, n] of entriesOf(need)) {
    const candidates = basket
      .map((flower, i) => ({ flower, i }))
      .filter(({ flower }) => flower.rarity === rarity)
      .sort((a, b) => Number(!!a.flower.variant) - Number(!!b.flower.variant) || a.i - b.i);
    if (candidates.length < n) return null;
    picked.push(...candidates.slice(0, n).map(({ i }) => i));
  }
  return picked;
}

export function missingFor(save: GardenSave, id: RecipeId): Ingredients {
  const missing: Ingredients = {};
  for (const [rarity, n] of entriesOf(recipeById(id).ingredients)) {
    const have = save.inventory.basket.filter((f) => f.rarity === rarity).length;
    if (have < n) missing[rarity] = n - have;
  }
  return missing;
}

export function startBrew(save: GardenSave, id: RecipeId, now: number): GardenSave | null {
  if (save.atelier.brew || !knownRecipes(save).includes(id)) return null;
  const picked = pickIngredients(save.inventory.basket, recipeById(id).ingredients);
  if (!picked) return null;
  const used = new Set(picked);
  return {
    ...save,
    inventory: {
      ...save.inventory,
      basket: save.inventory.basket.filter((_, i) => !used.has(i)),
    },
    atelier: { brew: { recipe: id, startedAt: now } },
  };
}

export function brewStatus(save: GardenSave, now: number): BrewStatus | null {
  const brew = save.atelier.brew;
  if (!brew) return null;
  const remaining = Math.max(0, brew.startedAt + recipeById(brew.recipe).durationMs - now);
  return { recipe: brew.recipe, remaining, ready: remaining === 0 };
}

export function collectBrew(save: GardenSave, now: number): GardenSave | null {
  const status = brewStatus(save, now);
  if (!status?.ready) return null;
  const potions = save.inventory.potions;
  const doses = (potions[status.recipe] ?? 0) + recipeById(status.recipe).doses;
  return bump(
    {
      ...save,
      inventory: { ...save.inventory, potions: { ...potions, [status.recipe]: doses } },
      atelier: { brew: null },
    },
    "brewed",
  );
}
