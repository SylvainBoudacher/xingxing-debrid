import { HD_BUTTON } from "./hdButton";

// Une ligne de la boutique : libellé, prix, bouton.
export function ShopOffer({
  label,
  price,
  owned,
  onBuy,
}: {
  label: string;
  price: number;
  owned?: boolean;
  onBuy: () => void;
}) {
  return (
    <li className="flex items-center justify-between border-b border-[#3a2c20] py-1.5">
      <span className="text-lg">{label}</span>
      <span className="flex items-center gap-3">
        <span className="text-[#e8c060]">{price} PO</span>
        <button type="button" onClick={onBuy} disabled={owned} className={`w-24 ${HD_BUTTON}`}>
          {owned ? "Acquis" : "Acheter"}
        </button>
      </span>
    </li>
  );
}
