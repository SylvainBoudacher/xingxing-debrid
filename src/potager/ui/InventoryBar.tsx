import { useState } from "react";
import { slotView } from "../core/inventory";
import type { Slot } from "../core/types";
import { ItemTile } from "./abri/ItemTile";
import { LEATHER, POCKET } from "./abri/leather";

// La ceinture : une bande de cuir cousue, une poche par emplacement du sac.
export function InventoryBar({
  inventory,
  selected,
  onSelect,
}: {
  inventory: (Slot | null)[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const current = inventory[selected];
  const caption = hover ?? (current ? slotView(current).label : null);
  return (
    <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
      <p
        className="h-6 text-lg text-[#f2e2b0] italic"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
      >
        {caption}
      </p>
      <div
        className="relative flex gap-1.5 rounded-md border-[3px] border-[#2e1a0c] p-2 shadow-[0_6px_10px_rgba(0,0,0,0.5)]"
        style={{ background: LEATHER }}
      >
        <div className="pointer-events-none absolute inset-1 rounded border-2 border-dashed border-[#c89a5a]/45" />
        {inventory.map((s, i) => (
          <ItemTile
            key={i}
            item={s}
            selected={i === selected}
            enabled
            className={POCKET}
            onClick={() => onSelect(i)}
            onHover={setHover}
          />
        ))}
      </div>
    </div>
  );
}
