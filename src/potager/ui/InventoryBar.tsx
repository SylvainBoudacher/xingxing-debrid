import { slotView } from "../core/inventory";
import type { Slot } from "../core/types";
import { PANEL_STYLE } from "./hdPanel";
import { SlotTile } from "./SlotTile";

export function InventoryBar({
  inventory,
  selected,
  onSelect,
}: {
  inventory: (Slot | null)[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5 p-1.5"
      style={PANEL_STYLE}
    >
      {inventory.map((s, i) => (
        <SlotTile
          key={i}
          view={s ? slotView(s) : null}
          selected={i === selected}
          onClick={() => onSelect(i)}
        />
      ))}
    </div>
  );
}
