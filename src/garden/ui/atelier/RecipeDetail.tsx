import { missingFor } from "../../core/atelier";
import { recipeById, type RecipeId } from "../../core/catalog/recipes";
import { formatDuration, ingredientLabel, missingLabel } from "../../core/labels";
import type { GardenSave, Rarity } from "../../core/types";
import { recipeNode } from "../../core/unlocks";
import { RARITY_COLOR } from "../toolMeta";
import { HEADING } from "./styles";

export function RecipeDetail({
  save,
  recipe,
  known,
  busy,
  onBrew,
}: {
  save: GardenSave;
  recipe: RecipeId;
  known: boolean;
  busy: boolean;
  onBrew: () => void;
}) {
  const r = recipeById(recipe);
  const reason = !known
    ? `Débloquée par : ${recipeNode(recipe)?.title ?? "l'arbre de progression"}`
    : busy
      ? "Le chaudron est occupé"
      : missingLabel(missingFor(save, recipe));
  const have = (rarity: Rarity) => save.inventory.basket.filter((f) => f.rarity === rarity).length;
  return (
    <div className="mt-3 flex flex-col gap-1.5 border-t border-amber-300/20 pt-3">
      <h4 className={HEADING}>{r.name}</h4>
      <p className="italic text-[#d8cbb6]">{r.effect}</p>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-[#a99a8a]">Ingrédients</div>
      {(Object.entries(r.ingredients) as [Rarity, number][]).map(([rarity, n]) => (
        <div key={rarity} className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-[3px]"
            style={{ background: RARITY_COLOR[rarity] }}
          />
          {ingredientLabel(rarity, n)}
          <span className="text-[#a99a8a]">({have(rarity)} au panier)</span>
        </div>
      ))}
      <div className="text-[#a99a8a]">
        Durée {formatDuration(r.durationMs)} - donne {r.doses} doses
      </div>
      <div className="mt-1 flex items-center gap-3">
        <button
          onClick={onBrew}
          disabled={!!reason}
          className="rounded-md border border-amber-300/50 px-3 py-1 text-[#f3dca0] enabled:hover:bg-amber-300/15 disabled:opacity-40"
        >
          Brasser
        </button>
        {reason && <span className="text-[11px] text-[#d98a7a]">{reason}</span>}
      </div>
    </div>
  );
}
