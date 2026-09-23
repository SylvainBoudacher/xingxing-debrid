import { useRef } from "react";
import type { ColorId, Rarity, SpeciesId, VariantId } from "../../core/types";
import { CARD_H, CARD_W } from "./cardFx";
import { useCardFx } from "./useCardFx";

// Fleur animée d'une carte : halo, lueur, reflet et particules selon la rareté.
export function LiveFlower({
  species,
  color,
  rarity,
  variant,
  className,
}: {
  species: SpeciesId;
  color: ColorId;
  rarity: Rarity;
  variant: VariantId | null;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useCardFx(ref, species, color, rarity, variant);
  return (
    <canvas
      ref={ref}
      width={CARD_W}
      height={CARD_H}
      className={`block [image-rendering:pixelated] ${className ?? ""}`}
    />
  );
}
