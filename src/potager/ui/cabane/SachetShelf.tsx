import { SACHETS, type SachetId } from "../../core/economy/catalog";
import { IRON, WOOD } from "../abri/leather";
import { sachetDataUrl } from "../sachets/sachet";
import { PriceTag } from "./PriceTag";

const IDS = Object.keys(SACHETS) as SachetId[];

// L'étagère à sachets : les paquets debout sur la planche, l'étiquette dessous.
export function SachetShelf({ onBuy }: { onBuy: (id: SachetId) => void }) {
  return (
    <section aria-label="Sachets de graines">
      <div
        className="grid grid-cols-3 items-end justify-items-center border-[3px] border-b-0 border-[#2e1a0c] px-4 pt-4 shadow-[inset_0_4px_8px_rgba(0,0,0,0.7)]"
        style={{ background: "linear-gradient(180deg, #2a180a, #3a2210)" }}
      >
        {IDS.map((id) => (
          <img
            key={id}
            src={sachetDataUrl(id)}
            alt=""
            draggable={false}
            className="-mb-px w-[70px] origin-bottom transition-transform hover:-rotate-3 hover:scale-105"
            style={{
              imageRendering: "pixelated",
              filter: "drop-shadow(0 3px 2px rgba(0,0,0,0.6))",
            }}
          />
        ))}
      </div>
      <div
        className="relative h-4 border-[3px] border-[#2e1a0c] shadow-[0_6px_10px_rgba(0,0,0,0.5)]"
        style={{ background: WOOD }}
      >
        <span className="absolute inset-y-0 left-6 w-2" style={{ background: IRON }} />
        <span className="absolute inset-y-0 right-6 w-2" style={{ background: IRON }} />
      </div>
      <div className="mt-1 grid grid-cols-3 justify-items-center">
        {IDS.map((id) => (
          <div key={id} className="flex flex-col items-center">
            <p className="text-lg">{SACHETS[id].label}</p>
            <PriceTag price={SACHETS[id].price} onBuy={() => onBuy(id)} />
          </div>
        ))}
      </div>
    </section>
  );
}
