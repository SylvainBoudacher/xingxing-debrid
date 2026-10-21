import { PARCEL_PRICE } from "../core/economy/catalog";
import type { ParcelId } from "../core/types";
import { PriceSignPanel } from "./PriceSignPanel";

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
  return (
    <PriceSignPanel
      question={`Acheter cette parcelle pour ${price} PO ?`}
      price={price}
      po={po}
      onBuy={onBuy}
      onClose={onClose}
    />
  );
}
