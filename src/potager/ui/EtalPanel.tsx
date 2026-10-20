import { STALL_PRICES } from "../core/economy/catalog";
import { stallCapacity } from "../core/economy/stall";
import { slotView } from "../core/inventory";
import type { PotagerSave } from "../core/types";
import { flowerDataUrl } from "../textures/flowers";
import { demandLabel, matchLabel } from "./demandLabel";
import { HD_BUTTON } from "./hdButton";
import { PANEL_STYLE } from "./hdPanel";
import { PanelHeader } from "./PanelHeader";
import { SlotTile } from "./SlotTile";

export function EtalPanel({
  save,
  onStock,
  onUnstock,
  onServe,
  onUpgrade,
  onClose,
}: {
  save: PotagerSave;
  onStock: (slot: number) => void;
  onUnstock: (stallIndex: number) => void;
  onServe: (stallIndex: number) => void;
  onUpgrade: () => void;
  onClose: () => void;
}) {
  const demand = save.client?.demand;
  const price = STALL_PRICES[save.stallLevel];
  return (
    <div
      className="absolute top-1/2 left-1/2 z-10 w-[560px] -translate-x-1/2 -translate-y-1/2 p-5"
      style={PANEL_STYLE}
    >
      <PanelHeader title="Étal" onClose={onClose} />
      {demand && (
        <div className="mb-4 flex items-center gap-3 border border-[#5a4630] bg-[rgba(20,14,10,0.7)] px-3 py-2">
          <img
            src={flowerDataUrl(demand.species, demand.color)}
            alt=""
            className="h-12 w-12"
            style={{ imageRendering: "pixelated" }}
          />
          <p className="text-lg">
            Un client demande : <span className="font-bold">{demandLabel(demand)}</span>
          </p>
        </div>
      )}
      <p className="mb-1 text-lg">Ton sac (clic pour mettre en réserve)</p>
      <div className="mb-4 flex gap-1.5">
        {save.inventory.map((s, i) => (
          <SlotTile
            key={i}
            view={s ? slotView(s) : null}
            onClick={() => s?.kind === "flowers" && onStock(i)}
          />
        ))}
      </div>
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-lg">Réserve (clic pour reprendre)</p>
        <p className="text-sm text-[#c8b890]">
          {save.stall.length} / {stallCapacity(save)} piles
        </p>
      </div>
      <div className="flex min-h-16 flex-wrap gap-1.5">
        {save.stall.length === 0 && <p className="text-sm text-[#a8977a] italic">Vide</p>}
        {save.stall.map((p, i) => {
          const match = demand && matchLabel(p, demand);
          return (
            <div key={i} className="flex w-16 flex-col items-center gap-1">
              <SlotTile view={slotView(p)} onClick={() => onUnstock(i)} />
              {demand && (
                <>
                  <span className="h-4 text-center text-[11px] leading-4 text-[#e8c060]">
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
      {price !== undefined && (
        <button type="button" onClick={onUpgrade} className={`mt-4 ${HD_BUTTON}`}>
          Agrandir la réserve ({price} PO)
        </button>
      )}
    </div>
  );
}
