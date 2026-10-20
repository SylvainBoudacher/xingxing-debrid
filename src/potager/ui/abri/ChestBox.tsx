import type { ChestStack } from "../../core/types";
import { ItemTile } from "./ItemTile";
import { IRON, WOOD } from "./leather";

const CELL = "border-2 border-[#2a180a] bg-[#22140a]/70 shadow-[inset_0_2px_3px_rgba(0,0,0,0.6)]";

// Le coffre ouvert : couvercle relevé, intérieur à casiers, façade cerclée de fer.
export function ChestBox({
  chest,
  capacity,
  onWithdraw,
  onHover,
}: {
  chest: ChestStack[];
  capacity: number;
  onWithdraw: (index: number) => void;
  onHover: (label: string | null) => void;
}) {
  return (
    <section aria-label="Coffre" className="mx-auto w-full">
      <div
        className="relative mx-3 flex h-9 items-center justify-center rounded-t-[30px] border-[3px] border-b-0 border-[#2e1a0c]"
        style={{ background: "linear-gradient(180deg, #4a2c14, #3a2210)" }}
      >
        <span className="absolute inset-y-0 left-8 w-2" style={{ background: IRON }} />
        <span className="absolute inset-y-0 right-8 w-2" style={{ background: IRON }} />
        <span className="text-sm italic text-[#f0d8a0]">
          Coffre · {chest.length} / {capacity}
        </span>
      </div>
      <div
        className="relative border-[3px] border-[#2e1a0c] p-2 shadow-[0_6px_10px_rgba(0,0,0,0.5)]"
        style={{ background: WOOD }}
      >
        <span className="absolute inset-y-0 left-3 w-2" style={{ background: IRON }} />
        <span className="absolute inset-y-0 right-3 w-2" style={{ background: IRON }} />
        <div className="relative mx-6 grid max-h-[13rem] grid-cols-6 justify-items-center gap-1.5 overflow-y-auto border-[3px] border-[#1c1008] bg-[#2a180a] p-2 shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)]">
          {Array.from({ length: capacity }, (_, i) => (
            <ItemTile
              key={i}
              item={chest[i] ?? null}
              className={CELL}
              onClick={() => onWithdraw(i)}
              onHover={onHover}
            />
          ))}
        </div>
      </div>
      <div
        className="relative flex h-8 items-center justify-center border-[3px] border-t-0 border-[#2e1a0c]"
        style={{ background: WOOD }}
      >
        <span className="absolute inset-y-0 left-3 w-2" style={{ background: IRON }} />
        <span className="absolute inset-y-0 right-3 w-2" style={{ background: IRON }} />
        <span className="relative h-5 w-6 border-2 border-[#6a4c10] bg-[#e0b040] shadow-[inset_0_-3px_0_#a8801c]">
          <span className="absolute top-1.5 left-1/2 h-1.5 w-1 -translate-x-1/2 bg-[#2a1808]" />
        </span>
      </div>
    </section>
  );
}
