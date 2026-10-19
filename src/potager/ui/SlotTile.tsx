import { RARITY_COLOR } from "../core/catalog/rarity";
import type { SlotView } from "../core/inventory";

// Une case d'inventaire ou de coffre : une graine n'y montre que sa rareté.
export function SlotTile({
  view,
  selected,
  onClick,
}: {
  view: SlotView | null;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex h-16 w-16 cursor-pointer flex-col items-center justify-center border-2 text-center text-[13px] leading-tight transition-colors ${
        selected
          ? "border-[#e8c060] bg-[rgba(232,192,96,0.15)]"
          : "border-[#5a4630] bg-[rgba(20,14,10,0.7)] hover:border-[#b8975a]"
      }`}
    >
      {view && (
        <>
          {view.rarity && (
            <span
              className="mb-1 block h-3 w-3 rotate-45"
              style={{ background: RARITY_COLOR[view.rarity] }}
            />
          )}
          <span className="px-1">{view.label}</span>
          {view.water !== undefined && (
            <span className="text-[11px] text-[#9ac0e8]">{view.water} / 5</span>
          )}
          {view.count > 1 && (
            <span className="absolute right-1 bottom-0.5 text-[12px] text-[#e8c060]">
              {view.count}
            </span>
          )}
        </>
      )}
    </button>
  );
}
