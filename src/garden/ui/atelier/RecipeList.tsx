import { RECIPES, type RecipeId } from "../../core/catalog/recipes";
import { SpriteIcon } from "../SpriteIcon";

export function RecipeList({
  known,
  selected,
  onSelect,
}: {
  known: RecipeId[];
  selected: RecipeId;
  onSelect: (id: RecipeId) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {RECIPES.map((r) => {
        const open = known.includes(r.id);
        const on = r.id === selected;
        return (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            aria-pressed={on}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left ${
              on ? "bg-amber-300/15 ring-1 ring-amber-300/40" : "hover:bg-amber-300/10"
            } ${open ? "" : "opacity-45"}`}
          >
            <SpriteIcon sprite={r.icon} cropped className={`h-6 ${open ? "" : "grayscale"}`} />
            <span className="flex-1">{r.name}</span>
            {!open && <small className="text-[10px] text-[#a99a8a]">verrouillée</small>}
          </button>
        );
      })}
    </div>
  );
}
