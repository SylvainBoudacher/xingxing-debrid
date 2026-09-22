import { RECIPES } from "../../core/catalog/recipes";
import type { GardenSave } from "../../core/types";
import { SpriteIcon } from "../SpriteIcon";
import { PANEL } from "./styles";

export function PotionStock({ potions }: { potions: GardenSave["inventory"]["potions"] }) {
  const owned = RECIPES.filter((r) => (potions[r.id] ?? 0) > 0);
  return (
    <section className={`${PANEL} col-span-2 flex flex-wrap items-center gap-x-5 gap-y-2`}>
      <h4 className="font-serif text-[17px] text-[#f3dca0]">Préparations</h4>
      {!owned.length && (
        <em className="text-[11px] text-[#a99a8a]">Aucune préparation en stock.</em>
      )}
      {owned.map((r) => (
        <span key={r.id} className="flex items-center gap-1.5">
          <SpriteIcon sprite={r.icon} cropped className="h-5" />
          {r.name}
          <b className="text-[#f3dca0]">x{potions[r.id]}</b>
        </span>
      ))}
      <span className="ml-auto text-[11px] text-[#a99a8a]">
        À utiliser dans le champ avec l'outil Préparer
      </span>
    </section>
  );
}
