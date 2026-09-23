import { useState } from "react";
import { colorName } from "../../core/catalog/colors";
import { speciesOf } from "../../core/catalog/species";
import { pressedLabel, RARITY_FR } from "../../core/labels";
import type { Rarity, SpeciesId, VariantId } from "../../core/types";
import { spriteCanvas } from "../../sprites/sprite";
import { LiveSprite } from "../cards/LiveSprite";
import { SpriteIcon } from "../SpriteIcon";
import type { Specimen } from "./plate";
import { VariantSlots } from "./VariantSlots";

// Teintes de rareté lisibles sur le papier du carnet.
const INK: Record<Rarity, string> = {
  commune: "#6a5a48",
  rare: "#2a6aa8",
  epique: "#7a44b0",
  legendaire: "#a8740c",
};

export function SpecimenCard({
  species,
  specimen,
  tilt,
}: {
  species: SpeciesId;
  specimen: Specimen;
  tilt: number;
}) {
  const [shown, setShown] = useState<VariantId | null>(null);
  const { entry, color, rarity } = specimen;
  return (
    <div className="w-[128px] text-center">
      <div
        className="rounded-sm border border-[#b08a5a] bg-[#f6eedb] p-1 shadow-[0_2px_3px_rgba(0,0,0,0.15)]"
        style={{ transform: `rotate(${tilt}deg)` }}
      >
        {entry ? (
          <LiveSprite
            sprite={spriteCanvas({
              name: species,
              color: specimen.color,
              ...(shown && { variant: shown }),
            })}
            rarity={specimen.rarity}
            variant={shown}
            className="mx-auto w-[112px]"
          />
        ) : (
          <div className="flex h-[152px] items-end justify-center">
            <SpriteIcon
              sprite={{ name: species, color }}
              className="w-[96px] [filter:brightness(0)_opacity(0.25)]"
            />
          </div>
        )}
      </div>
      <div className="mt-1 text-sm text-[#3a2418]">
        {entry ? colorName(color, speciesOf(species).feminine) : "?"}
      </div>
      <div className="text-[11px]" style={{ color: entry ? INK[rarity] : "#9a8a70" }}>
        {RARITY_FR[rarity]}
      </div>
      {entry && entry.pressed > 0 && (
        <div className="text-[11px] text-[#6a5a48]">{pressedLabel(entry.pressed)}</div>
      )}
      {entry && (
        <VariantSlots
          seen={entry.variants}
          shown={shown}
          onToggle={(v) => setShown((cur) => (cur === v ? null : v))}
        />
      )}
    </div>
  );
}
