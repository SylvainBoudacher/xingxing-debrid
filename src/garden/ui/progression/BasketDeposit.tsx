import { speciesOf } from "../../core/catalog/species";
import type { Task } from "../../core/catalog/tree";
import type { GardenSave, SpeciesId } from "../../core/types";
import { SpriteIcon } from "../SpriteIcon";

export function BasketDeposit({
  save,
  task,
  deposits,
  onDeposit,
}: {
  save: GardenSave;
  task: Task & { kind: "panier" };
  deposits: Partial<Record<SpeciesId, number>>;
  onDeposit: (species: SpeciesId) => void;
}) {
  return (
    <ul className="flex flex-col gap-1.5">
      {task.items.map(({ species, count }) => {
        const given = deposits[species] ?? 0;
        const inBasket = save.inventory.basket.some((f) => f.species === species);
        const full = given >= count;
        return (
          <li key={species} className="flex items-center gap-2">
            <SpriteIcon
              sprite={{ name: species, color: speciesOf(species).colors[0].color }}
              cropped
              className={`h-7 ${full ? "" : "opacity-60"}`}
            />
            <span className="flex-1 text-[12px] leading-tight text-[#d8c9b4]">
              {speciesOf(species).name}
              <b className="ml-1 text-[#f3dca0]">
                {given} / {count}
              </b>
            </span>
            <button
              onClick={() => onDeposit(species)}
              disabled={full || !inBasket}
              className="rounded-md border border-amber-300/40 px-2 py-0.5 text-[11px] text-[#f3dca0] hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:border-amber-300/15 disabled:text-[#6f6358]"
            >
              Déposer
            </button>
          </li>
        );
      })}
    </ul>
  );
}
