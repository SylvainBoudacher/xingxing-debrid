import type { SachetId } from "../core/economy/catalog";
import type { PotagerSave, ToolId } from "../core/types";
import { PANEL_STYLE } from "./hdPanel";
import { PanelHeader } from "./PanelHeader";
import { SachetShelf } from "./cabane/SachetShelf";
import { ToolUpgradeBoard } from "./cabane/ToolUpgradeBoard";

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
      className="absolute top-1/2 left-1/2 z-10 max-h-[96vh] w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-5"
      style={PANEL_STYLE}
    >
      <PanelHeader title="Cabane à graines" onClose={onClose} />
      <p className="mb-2 text-lg text-[#c8b890] italic">Sachets de 3 graines</p>
      <div className="mb-5">
        <SachetShelf onBuy={onBuySachet} />
      </div>
      <p className="mb-2 text-lg text-[#c8b890] italic">Outils améliorés</p>
      <ToolUpgradeBoard save={save} onBuy={onBuyTool} />
    </div>
  );
}
