import { useState } from "react";
import { CHEST_PRICES } from "../core/economy/catalog";
import { chestCapacity } from "../core/economy/stall";
import type { PotagerSave, ToolId } from "../core/types";
import { BagBoard } from "./abri/BagBoard";
import { ChestBox } from "./abri/ChestBox";
import { ToolRack } from "./abri/ToolRack";
import { HD_BUTTON } from "./hdButton";
import { PANEL_STYLE } from "./hdPanel";
import { PanelHeader } from "./PanelHeader";

const HINT = "Clique pour ranger ou reprendre";

export function AbriPanel({
  save,
  onDeposit,
  onWithdrawTool,
  onWithdrawStack,
  onUpgrade,
  onClose,
}: {
  save: PotagerSave;
  onDeposit: (slot: number) => void;
  onWithdrawTool: (id: ToolId) => void;
  onWithdrawStack: (chestIndex: number) => void;
  onUpgrade: () => void;
  onClose: () => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const price = CHEST_PRICES[save.chestLevel];
  return (
    <div
      className="absolute top-1/2 left-1/2 z-10 max-h-[96vh] w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-5"
      style={PANEL_STYLE}
    >
      <PanelHeader title="Abri de jardin" onClose={onClose} />
      <div className="mb-4 grid grid-cols-2 gap-4">
        <BagBoard inventory={save.inventory} onDeposit={onDeposit} onHover={setHover} />
        <ToolRack rack={save.rack} onWithdraw={onWithdrawTool} onHover={setHover} />
      </div>
      <ChestBox
        chest={save.chest}
        capacity={chestCapacity(save)}
        onWithdraw={onWithdrawStack}
        onHover={setHover}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-base text-[#c8b890] italic">{hover ?? HINT}</p>
        {price !== undefined && (
          <button type="button" onClick={onUpgrade} className={`shrink-0 ${HD_BUTTON}`}>
            Agrandir le coffre ({price} PO)
          </button>
        )}
      </div>
    </div>
  );
}
