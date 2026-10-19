import { slotView, TOOL_LABEL } from "../core/inventory";
import type { PotagerSave, ToolId } from "../core/types";
import { PANEL_STYLE } from "./hdPanel";
import { SlotTile } from "./SlotTile";

export function AbriPanel({
  save,
  onDeposit,
  onWithdrawTool,
  onWithdrawStack,
  onClose,
}: {
  save: PotagerSave;
  onDeposit: (slot: number) => void;
  onWithdrawTool: (id: ToolId) => void;
  onWithdrawStack: (chestIndex: number) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute top-1/2 left-1/2 z-10 w-[560px] -translate-x-1/2 -translate-y-1/2 p-5"
      style={PANEL_STYLE}
    >
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-3xl font-bold italic">Abri de jardin</h2>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-sm text-[#c8b890] hover:text-white"
        >
          Fermer (Échap)
        </button>
      </div>
      <p className="mb-1 text-lg">Ton sac (clic pour ranger)</p>
      <div className="mb-4 flex gap-1.5">
        {save.inventory.map((s, i) => (
          <SlotTile key={i} view={s ? slotView(s) : null} onClick={() => s && onDeposit(i)} />
        ))}
      </div>
      <p className="mb-1 text-lg">Râtelier (clic pour prendre)</p>
      <div className="mb-4 flex min-h-16 gap-1.5">
        {save.rack.map((t) => (
          <SlotTile
            key={t.id}
            view={{ kind: "tool", label: TOOL_LABEL[t.id], count: 1, water: t.water }}
            onClick={() => onWithdrawTool(t.id)}
          />
        ))}
      </div>
      <p className="mb-1 text-lg">Coffre (clic pour prendre)</p>
      <div className="flex min-h-16 flex-wrap gap-1.5">
        {save.chest.length === 0 && <p className="text-sm text-[#a8977a] italic">Vide</p>}
        {save.chest.map((c, i) => (
          <SlotTile key={i} view={slotView(c)} onClick={() => onWithdrawStack(i)} />
        ))}
      </div>
    </div>
  );
}
