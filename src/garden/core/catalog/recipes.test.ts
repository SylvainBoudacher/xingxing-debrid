import { describe, expect, it } from "vitest";
import { isRecipeId, recipeById, RECIPES } from "./recipes";

describe("catalogue des recettes", () => {
  it("compte 7 recettes aux identifiants uniques", () => {
    expect(RECIPES).toHaveLength(7);
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(7);
  });

  it("demande des ingrédients, une durée et des doses positifs", () => {
    for (const r of RECIPES) {
      const counts = Object.values(r.ingredients);
      expect(counts.length).toBeGreaterThan(0);
      for (const n of counts) expect(n).toBeGreaterThan(0);
      expect(r.durationMs).toBeGreaterThan(0);
      expect(r.doses).toBeGreaterThan(0);
      expect(r.name.length).toBeGreaterThan(0);
      expect(r.effect.length).toBeGreaterThan(0);
    }
  });

  it("retrouve une recette par son identifiant", () => {
    expect(recipeById("teinture").ingredients).toEqual({ commune: 2, rare: 1 });
    expect(isRecipeId("lune")).toBe(true);
    expect(isRecipeId("philtre")).toBe(false);
    expect(isRecipeId(3)).toBe(false);
  });
});
