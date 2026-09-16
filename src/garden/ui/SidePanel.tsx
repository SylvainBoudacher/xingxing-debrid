import { flowerName, RARITY_FR } from "../core/labels";
import type { GardenSave } from "../core/types";
import { SpriteIcon } from "./SpriteIcon";
import { RARITY_COLOR } from "./toolMeta";

const section = "rounded-xl border border-amber-300/30 bg-[#1a1216]/85 px-2.5 py-2 backdrop-blur";
const heading = "mb-1.5 font-serif text-[17px] text-[#f3dca0]";

export function SidePanel({ save, raining }: { save: GardenSave; raining: boolean }) {
  const { seeds, basket } = save.inventory;
  const counters = save.progress.counters;
  return (
    <aside className="absolute right-3 top-2.5 flex w-[210px] flex-col gap-2 text-xs">
      <section className={section}>
        <h4 className={heading}>Graines</h4>
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-[3px] bg-[#c8c6a8]" />
          Graine mystère
          <b className="ml-auto text-[#f3dca0]">x{seeds.length}</b>
        </div>
      </section>
      <section className={section}>
        <h4 className={heading}>Panier</h4>
        <div className="flex max-h-[150px] flex-col gap-1 overflow-auto">
          {basket.length === 0 && (
            <em className="text-[11px] text-[#a99a8a]">Rien de cueilli pour l'instant.</em>
          )}
          {basket.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <SpriteIcon sprite={{ name: f.species, color: f.color }} className="w-[22px]" />
              <span className="flex-1 leading-tight">
                {flowerName(f)}
                <small className="block text-[10px]" style={{ color: RARITY_COLOR[f.rarity] }}>
                  {RARITY_FR[f.rarity]}
                </small>
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className={section}>
        <div className="flex justify-between">
          <span className="text-[#a99a8a]">Corbeaux chassés</span>
          <b className="text-[#f3dca0]">{counters.crowsChased ?? 0}</b>
        </div>
        <div className="flex justify-between">
          <span className="text-[#a99a8a]">Tas ramassés</span>
          <b className="text-[#f3dca0]">{counters.raked ?? 0}</b>
        </div>
        {raining && <div className="mt-1 text-[#9fc4e6]">La pluie arrose tout le champ</div>}
      </section>
    </aside>
  );
}
