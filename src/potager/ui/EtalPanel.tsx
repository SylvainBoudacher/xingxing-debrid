import { STALL_PRICES } from "../core/economy/catalog";
import { stallCapacity } from "../core/economy/stall";
import type { PotagerSave } from "../core/types";
import { BagBoard } from "./abri/BagBoard";
import { ClientNote } from "./etal/ClientNote";
import { StallBoard } from "./etal/StallBoard";
import { HD_BUTTON } from "./hdButton";
import { PANEL_STYLE } from "./hdPanel";
import { PanelHeader } from "./PanelHeader";
import { floristServing } from "./staffView";
import { useState } from "react";

const HINT = "Clique une fleur de ton sac pour la mettre en vente";

export function EtalPanel({
  save,
  onStock,
  onUnstock,
  onServe,
  onUpgrade,
  onToggle,
  onClose,
}: {
  save: PotagerSave;
  onStock: (slot: number) => void;
  onUnstock: (stallIndex: number) => void;
  onServe: (stallIndex: number) => void;
  onUpgrade: () => void;
  onToggle: () => void;
  onClose: () => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const demand = save.client?.demand;
  const florist = floristServing(save);
  const price = STALL_PRICES[save.stallLevel];
  return (
    <div
      className="absolute top-1/2 left-1/2 z-10 max-h-[96vh] w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-5"
      style={PANEL_STYLE}
    >
      <PanelHeader title="Étal" onClose={onClose} />
      {!save.stallOpen && (
        <p className="mb-3 text-base text-[#e8c060]">L'étal est fermé : aucun client ne viendra</p>
      )}
      {demand && <ClientNote demand={demand} />}
      {demand && florist && (
        <p className="mb-3 text-base text-[#e8c060]">Le fleuriste sert ce client</p>
      )}
      <StallBoard
        stall={save.stall}
        capacity={stallCapacity(save)}
        demand={demand}
        onUnstock={onUnstock}
        onServe={florist ? null : onServe}
        onHover={setHover}
      />
      <div className="mt-4 grid grid-cols-2 gap-4">
        <BagBoard
          inventory={save.inventory}
          onDeposit={(i) => save.inventory[i]?.kind === "flowers" && onStock(i)}
          onHover={setHover}
        />
        <div className="flex flex-col justify-end gap-3 pb-2">
          <p className="min-h-12 text-base text-[#ecd3a0]">{hover ?? HINT}</p>
          <button type="button" onClick={onToggle} className={HD_BUTTON}>
            {save.stallOpen ? "Fermer l'étal" : "Ouvrir l'étal"}
          </button>
          {price !== undefined && (
            <button type="button" onClick={onUpgrade} className={HD_BUTTON}>
              Agrandir la réserve ({price} PO)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
