import type { BrewStatus } from "../../core/atelier";
import { recipeById } from "../../core/catalog/recipes";
import { formatDuration, ingredientLabel } from "../../core/labels";
import type { Flower, Rarity } from "../../core/types";
import { SpriteIcon } from "../SpriteIcon";
import { CauldronBubbles } from "./CauldronBubbles";
import { HEADING, PANEL } from "./styles";

const RARITIES: Rarity[] = ["commune", "rare", "epique", "legendaire"];

export function Cauldron({
  status,
  basket,
  onCollect,
}: {
  status: BrewStatus | null;
  basket: Flower[];
  onCollect: () => void;
}) {
  const inBasket = RARITIES.map((r) => [r, basket.filter((f) => f.rarity === r).length] as const)
    .filter(([, n]) => n > 0)
    .map(([r, n]) => ingredientLabel(r, n));
  const recipe = status && recipeById(status.recipe);
  const progress =
    status && recipe ? Math.min(1, Math.max(0, 1 - status.remaining / recipe.durationMs)) : 0;
  return (
    <section
      className={`${PANEL} flex flex-1 flex-col items-center justify-center gap-3 text-center`}
    >
      <h3 className={HEADING}>Chaudron</h3>
      <div className="relative">
        <SpriteIcon sprite={{ name: "chaudron" }} cropped className="h-40" />
        {status && !status.ready && <CauldronBubbles />}
      </div>
      {!status || !recipe ? (
        <div className="flex flex-col gap-1">
          <p className="text-[#a99a8a]">Le chaudron est vide</p>
          <p className="text-xs text-[#d8cbb6]">
            {inBasket.length
              ? `Au panier : ${inBasket.join(", ")}`
              : "Panier vide : cueille des fleurs au champ"}
          </p>
        </div>
      ) : (
        <div className="flex w-full max-w-[260px] flex-col items-center gap-2">
          <div>{recipe.name}</div>
          <div className="h-2 w-full overflow-hidden rounded bg-[#2c2027] ring-1 ring-amber-300/25">
            <div
              className="h-full bg-gradient-to-r from-[#4d8a36] to-[#9be07a]"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          {status.ready ? (
            <button
              onClick={onCollect}
              className="rounded-md border border-amber-300/50 px-3 py-1 text-[#f3dca0] hover:bg-amber-300/15"
            >
              Récupérer {recipe.doses} doses
            </button>
          ) : (
            <div className="text-[#a99a8a]">
              Prêt dans ~{formatDuration(status.remaining)} - {recipe.doses} doses
            </div>
          )}
        </div>
      )}
    </section>
  );
}
