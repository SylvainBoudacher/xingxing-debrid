import type { Slot } from "../../core/types";
import { LEATHER, POCKET } from "./leather";
import { ItemTile } from "./ItemTile";

// Le sac à dos : rabat cousu, boucle en laiton et six poches.
export function BagBoard({
  inventory,
  onDeposit,
  onHover,
}: {
  inventory: (Slot | null)[];
  onDeposit: (slot: number) => void;
  onHover: (label: string | null) => void;
}) {
  return (
    <section aria-label="Ton sac" className="relative pt-7">
      <div className="absolute top-0 left-1/2 h-10 w-28 -translate-x-1/2 rounded-t-full border-[5px] border-b-0 border-[#3a2210] bg-transparent" />
      <div
        className="relative rounded-t-md rounded-b-[26px] border-[3px] border-[#2e1a0c] px-3 pt-12 pb-4 shadow-[0_6px_10px_rgba(0,0,0,0.5)]"
        style={{ background: LEATHER }}
      >
        <div
          className="absolute inset-x-0 top-0 h-11 border-b-[3px] border-[#2e1a0c]"
          style={{
            background: "linear-gradient(180deg, #5e3a1c, #4a2c14)",
            clipPath: "polygon(0 0, 100% 0, 100% 62%, 56% 62%, 50% 100%, 44% 62%, 0 62%)",
          }}
        />
        <span className="absolute top-[34px] left-1/2 h-4 w-4 -translate-x-1/2 border-2 border-[#6a4c10] bg-[#e0b040] shadow-[inset_0_-2px_0_#a8801c]" />
        <span className="absolute top-1.5 left-3 text-sm italic text-[#f0d8a0]">Ton sac</span>
        <div className="pointer-events-none absolute inset-1.5 rounded-b-[22px] border-2 border-dashed border-[#c89a5a]/45" />
        <div className="relative mt-1 grid grid-cols-3 justify-items-center gap-2">
          {inventory.map((s, i) => (
            <ItemTile
              key={i}
              item={s}
              className={POCKET}
              onClick={() => s && onDeposit(i)}
              onHover={onHover}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
