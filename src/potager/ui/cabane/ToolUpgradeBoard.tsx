import { TOOL_UPGRADE_PRICE } from "../../core/economy/catalog";
import type { PotagerSave, ToolId } from "../../core/types";
import { toolIconUrl } from "../abri/abriSprites";
import { TOOL_OFFERS, toolLevel } from "../cabaneOffers";
import { PriceTag } from "./PriceTag";

const PLANKS =
  "repeating-linear-gradient(90deg, #7a4c24 0 46px, #5e3a1a 46px 48px), linear-gradient(180deg, #86562a, #6a4220)";

// Le panneau des outils améliorés : un crochet, un outil et son étiquette chacun.
export function ToolUpgradeBoard({
  save,
  onBuy,
}: {
  save: PotagerSave;
  onBuy: (id: ToolId) => void;
}) {
  return (
    <section
      aria-label="Outils améliorés"
      className="grid grid-cols-3 justify-items-center border-[3px] border-[#2e1a0c] px-3 pt-3 pb-4 shadow-[0_6px_10px_rgba(0,0,0,0.5)]"
      style={{ background: PLANKS }}
    >
      {TOOL_OFFERS.map((t) => (
        <div key={t.id} className="flex flex-col items-center">
          <span className="z-10 h-3.5 w-3.5 rounded-full border-2 border-[#2a1808] bg-[#3a2412] shadow-[inset_0_1px_0_#7a5a38]" />
          <span className="-mt-0.5 h-3 w-1 bg-[#6a4a28]" />
          <div className="relative flex h-16 w-16 items-center justify-center">
            <img
              src={toolIconUrl(t.id)}
              alt=""
              className="h-12 w-12 object-contain drop-shadow-[0_2px_1px_rgba(0,0,0,0.6)]"
              style={{ imageRendering: "pixelated" }}
            />
            <span className="absolute top-1 right-1 block h-3 w-3 rotate-45 border border-black/50 bg-[#e8b040]" />
          </div>
          <p className="text-lg leading-tight">{t.name}</p>
          <p className="mb-1 text-sm text-[#f0d8a0]/80 italic">{t.effect}</p>
          <PriceTag
            price={TOOL_UPGRADE_PRICE}
            owned={toolLevel(save, t.id) === 2}
            onBuy={() => onBuy(t.id)}
          />
        </div>
      ))}
    </section>
  );
}
