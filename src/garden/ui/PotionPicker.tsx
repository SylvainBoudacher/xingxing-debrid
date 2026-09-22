import { RECIPES, type RecipeId } from "../core/catalog/recipes";
import type { GardenSave } from "../core/types";
import { SpriteIcon } from "./SpriteIcon";

export function PotionPicker({
  potions,
  selected,
  onSelect,
}: {
  potions: GardenSave["inventory"]["potions"];
  selected: RecipeId | null;
  onSelect: (id: RecipeId) => void;
}) {
  const owned = RECIPES.filter((r) => (potions[r.id] ?? 0) > 0);
  return (
    <section className="rounded-xl border border-amber-300/30 bg-[#1a1216]/85 px-2.5 py-2 backdrop-blur">
      <h4 className="mb-1.5 font-serif text-[17px] text-[#f3dca0]">Préparations</h4>
      {!owned.length && (
        <em className="text-[11px] text-[#a99a8a]">Plus rien en stock. Passe à l'atelier.</em>
      )}
      <div className="flex flex-col gap-0.5">
        {owned.map((r) => {
          const on = r.id === selected;
          return (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              aria-pressed={on}
              className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left ${
                on ? "bg-amber-300/15 ring-1 ring-amber-300/40" : "hover:bg-amber-300/10"
              }`}
            >
              <SpriteIcon sprite={r.icon} cropped className="h-5" />
              <span className="flex-1 leading-tight">
                {r.name}
                <small className="block text-[10px] text-[#a99a8a]">{r.effect}</small>
              </span>
              <b className="text-[#f3dca0]">x{potions[r.id]}</b>
            </button>
          );
        })}
      </div>
    </section>
  );
}
