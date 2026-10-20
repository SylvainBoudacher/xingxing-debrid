import { PARCEL_PRICE } from "../core/economy/catalog";
import type { ParcelId } from "../core/types";
import { HD_BUTTON } from "./hdButton";
import { PANEL_STYLE } from "./hdPanel";

export function ParcelSignPanel({
  parcel,
  po,
  onBuy,
  onClose,
}: {
  parcel: ParcelId;
  po: number;
  onBuy: () => void;
  onClose: () => void;
}) {
  const price = PARCEL_PRICE[parcel];
  const missing = price - po;
  return (
    <div
      className="absolute top-1/2 left-1/2 z-10 w-[420px] -translate-x-1/2 -translate-y-1/2 p-5 text-center"
      style={PANEL_STYLE}
    >
      <p className="mb-2 text-2xl font-bold italic">Acheter cette parcelle pour {price} PO ?</p>
      {missing > 0 && <p className="mb-2 text-[#e09070]">Il te manque {missing} PO</p>}
      <div className="mt-4 flex justify-center gap-3">
        <button type="button" onClick={onBuy} disabled={missing > 0} className={HD_BUTTON}>
          Acheter
        </button>
        <button type="button" onClick={onClose} className={HD_BUTTON}>
          Annuler
        </button>
      </div>
    </div>
  );
}
