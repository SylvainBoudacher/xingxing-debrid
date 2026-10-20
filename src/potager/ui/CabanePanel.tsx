import { SACHETS, TOOL_UPGRADE_PRICE, type SachetId } from "../core/economy/catalog";
import type { PotagerSave, ToolId } from "../core/types";
import { TOOL_OFFERS, toolLevel } from "./cabaneOffers";
import { PANEL_STYLE } from "./hdPanel";
import { PanelHeader } from "./PanelHeader";
import { ShopOffer } from "./ShopOffer";

export function CabanePanel({
  save,
  onBuySachet,
  onBuyTool,
  onClose,
}: {
  save: PotagerSave;
  onBuySachet: (id: SachetId) => void;
  onBuyTool: (id: ToolId) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute top-1/2 left-1/2 z-10 w-[560px] -translate-x-1/2 -translate-y-1/2 p-5"
      style={PANEL_STYLE}
    >
      <PanelHeader title="Cabane à graines" onClose={onClose} />
      <p className="mb-1 text-lg text-[#c8b890]">Sachets de 3 graines</p>
      <ul className="mb-4">
        {(Object.keys(SACHETS) as SachetId[]).map((id) => (
          <ShopOffer
            key={id}
            label={SACHETS[id].label}
            price={SACHETS[id].price}
            onBuy={() => onBuySachet(id)}
          />
        ))}
      </ul>
      <p className="mb-1 text-lg text-[#c8b890]">Outils améliorés</p>
      <ul>
        {TOOL_OFFERS.map((t) => (
          <ShopOffer
            key={t.id}
            label={t.label}
            price={TOOL_UPGRADE_PRICE}
            owned={toolLevel(save, t.id) === 2}
            onBuy={() => onBuyTool(t.id)}
          />
        ))}
      </ul>
    </div>
  );
}
