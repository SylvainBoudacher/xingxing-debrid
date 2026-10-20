import { HD_BUTTON } from "../hdButton";

// Étiquette de prix accrochée à son article, avec le bouton d'achat.
export function PriceTag({
  price,
  owned,
  onBuy,
}: {
  price: number;
  owned?: boolean;
  onBuy: () => void;
}) {
  return (
    <div className="flex w-full flex-col items-center">
      <span className="h-3 w-px bg-[#c8b890]/70" />
      <span
        className="border-2 border-[#8a7048] px-3 py-0.5 text-base font-bold text-[#3a2814] shadow-[1px_2px_3px_rgba(0,0,0,0.5)]"
        style={{ background: "linear-gradient(180deg, #f2e2b0, #e0cc92)", textShadow: "none" }}
      >
        {price} PO
      </span>
      <button type="button" onClick={onBuy} disabled={owned} className={`mt-2 w-24 ${HD_BUTTON}`}>
        {owned ? "Acquis" : "Acheter"}
      </button>
    </div>
  );
}
