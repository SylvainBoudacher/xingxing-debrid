import type { BrewStatus } from "../../core/atelier";
import { recipeById } from "../../core/catalog/recipes";
import { formatDuration } from "../../core/labels";
import { SpriteIcon } from "../SpriteIcon";
import { CauldronBubbles } from "./CauldronBubbles";
import { HEADING, PANEL } from "./styles";

export function Cauldron({
  status,
  onCollect,
}: {
  status: BrewStatus | null;
  onCollect: () => void;
}) {
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
        <p className="text-[#a99a8a]">Le chaudron est vide</p>
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
