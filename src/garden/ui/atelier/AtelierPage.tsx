import { useState } from "react";
import { brewStatus } from "../../core/atelier";
import type { RecipeId } from "../../core/catalog/recipes";
import type { GardenSave } from "../../core/types";
import { knownRecipes } from "../../core/unlocks";
import { DEV_BUTTON } from "../devButton";
import { Cauldron } from "./Cauldron";
import { PotionStock } from "./PotionStock";
import { RecipeDetail } from "./RecipeDetail";
import { RecipeList } from "./RecipeList";
import { HEADING, PANEL } from "./styles";

export function AtelierPage({
  save,
  now,
  onBrew,
  onCollect,
  onDevFinish,
}: {
  save: GardenSave;
  now: number;
  onBrew: (recipe: RecipeId) => void;
  onCollect: () => void;
  onDevFinish: () => void;
}) {
  const known = knownRecipes(save);
  const [selected, setSelected] = useState<RecipeId>(known[0] ?? "croissance");
  const status = brewStatus(save, now);
  return (
    <div className="grid flex-1 grid-cols-[1fr_1.1fr] grid-rows-[1fr_auto] gap-4 overflow-auto p-5">
      <div className="flex flex-col gap-2">
        <Cauldron status={status} onCollect={onCollect} />
        {import.meta.env.DEV && status && !status.ready && (
          <button onClick={onDevFinish} className={`${DEV_BUTTON} self-center`}>
            Dev : finir le brassage
          </button>
        )}
      </div>
      <section className={`${PANEL} overflow-auto`}>
        <h3 className={`${HEADING} mb-2`}>Recettes</h3>
        <RecipeList known={known} selected={selected} onSelect={setSelected} />
        <RecipeDetail
          save={save}
          recipe={selected}
          known={known.includes(selected)}
          busy={!!status}
          onBrew={() => onBrew(selected)}
        />
      </section>
      <PotionStock potions={save.inventory.potions} />
    </div>
  );
}
