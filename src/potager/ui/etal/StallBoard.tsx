import type { Demand, FlowerStack } from "../../core/types";
import { ItemTile } from "../abri/ItemTile";
import { IRON, WOOD } from "../abri/leather";
import { matchLabel } from "../demandLabel";
import { HD_BUTTON } from "../hdButton";

const RED = "#c8453a";
const CREAM = "#f2e2b0";
const AWNING = `repeating-linear-gradient(90deg, ${RED} 0 28px, ${CREAM} 28px 56px)`;
const SCALLOPS = `radial-gradient(circle at 14px 0, ${RED} 14px, transparent 14.5px) 0 0 / 56px 14px repeat-x, radial-gradient(circle at 42px 0, ${CREAM} 14px, transparent 14.5px) 0 0 / 56px 14px repeat-x`;
const CRATE = "border-2 border-[#2a180a] bg-[#22140a]/70 shadow-[inset_0_2px_3px_rgba(0,0,0,0.6)]";

// L'étal de marché : auvent rayé, montants de bois et comptoir à casiers.
export function StallBoard({
  stall,
  capacity,
  demand,
  onUnstock,
  onServe,
  onHover,
}: {
  stall: FlowerStack[];
  capacity: number;
  demand: Demand | undefined;
  onUnstock: (index: number) => void;
  onServe: (index: number) => void;
  onHover: (label: string | null) => void;
}) {
  return (
    <section aria-label="Réserve de l'étal">
      <div
        className="relative flex h-10 items-center justify-center border-[3px] border-b-0 border-[#2e1a0c]"
        style={{ background: AWNING }}
      >
        <span className="border-2 border-[#2e1a0c] bg-[#3a2210] px-3 text-sm text-[#f0d8a0] italic">
          Réserve · {stall.length} / {capacity}
        </span>
      </div>
      <div className="h-3.5" style={{ background: SCALLOPS }} />
      <div className="relative -mt-3.5 px-1">
        <span className="absolute inset-y-0 left-1 z-0 w-2.5" style={{ background: WOOD }} />
        <span className="absolute inset-y-0 right-1 z-0 w-2.5" style={{ background: WOOD }} />
        <div
          className="relative mx-4 mt-5 mb-0 grid grid-cols-6 items-start justify-items-center gap-x-1.5 gap-y-3 border-[3px] border-b-0 border-[#2e1a0c] p-2 pb-3 shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)]"
          style={{ background: "linear-gradient(180deg, #4a2c14, #3a2210)" }}
        >
          {Array.from({ length: capacity }, (_, i) => {
            const pile = stall[i] ?? null;
            const match = pile && demand && matchLabel(pile, demand);
            return (
              <div key={i} className="flex w-16 flex-col items-center gap-1">
                <ItemTile
                  item={pile}
                  className={CRATE}
                  onClick={() => onUnstock(i)}
                  onHover={onHover}
                />
                {pile && demand && (
                  <>
                    <span className="-mx-2 h-4 text-center text-[11px] leading-4 whitespace-nowrap text-[#e8c060]">
                      {match}
                    </span>
                    <button
                      type="button"
                      onClick={() => onServe(i)}
                      className={`w-full !px-0 !text-sm ${HD_BUTTON}`}
                    >
                      Servir
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div
        className="relative mx-1 flex h-7 items-center justify-center border-[3px] border-[#2e1a0c] shadow-[0_6px_10px_rgba(0,0,0,0.5)]"
        style={{ background: WOOD }}
      >
        <span className="absolute inset-y-0 left-6 w-2" style={{ background: IRON }} />
        <span className="absolute inset-y-0 right-6 w-2" style={{ background: IRON }} />
      </div>
    </section>
  );
}
