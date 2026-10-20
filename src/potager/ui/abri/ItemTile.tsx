import { RARITY_COLOR } from "../../core/catalog/rarity";
import { slotView } from "../../core/inventory";
import type { ChestStack, Slot } from "../../core/types";
import { itemIconUrl } from "./abriSprites";

export type Item = Slot | ChestStack;

// Une poche, un crochet ou un casier : l'objet qui s'y trouve, ou rien.
export function ItemTile({
  item,
  selected,
  enabled = item !== null,
  className = "",
  onClick,
  onHover,
}: {
  item: Item | null;
  selected?: boolean;
  // une case vide reste cliquable quand on peut y choisir la main libre
  enabled?: boolean;
  className?: string;
  onClick?: () => void;
  onHover?: (label: string | null) => void;
}) {
  const view = item && slotView(item);
  return (
    <button
      type="button"
      aria-label={view?.label ?? "Vide"}
      disabled={!enabled}
      onClick={onClick}
      onMouseEnter={() => onHover?.(view?.label ?? null)}
      onMouseLeave={() => onHover?.(null)}
      className={`relative flex h-14 w-14 items-center justify-center transition-transform enabled:cursor-pointer enabled:hover:-translate-y-0.5 enabled:hover:brightness-125 disabled:cursor-default ${className} ${
        selected ? "!border-[#e8c060] bg-[#e8c060]/20 shadow-[0_0_8px_#e8c06080]" : ""
      }`}
    >
      {item && view && (
        <>
          <img
            src={itemIconUrl(item)}
            alt=""
            draggable={false}
            className="h-10 w-10 object-contain drop-shadow-[0_2px_1px_rgba(0,0,0,0.6)]"
            style={{ imageRendering: "pixelated" }}
          />
          {view.rarity && (
            <span
              className="absolute top-1 left-1 block h-2.5 w-2.5 rotate-45 border border-black/50"
              style={{ background: RARITY_COLOR[view.rarity] }}
            />
          )}
          {view.water !== undefined && (
            <span className="absolute bottom-0 left-1 text-[11px] text-[#9ac0e8]">
              {view.water}/5
            </span>
          )}
          {view.count > 1 && (
            <span className="absolute right-1 bottom-0 text-[13px] font-bold text-[#f8e08a]">
              {view.count}
            </span>
          )}
        </>
      )}
    </button>
  );
}
