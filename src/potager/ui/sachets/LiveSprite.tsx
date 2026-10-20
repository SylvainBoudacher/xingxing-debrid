import { useRef } from "react";
import type { Rarity } from "../../core/types";
import { CARD_H, CARD_W } from "./cardFx";
import { useCardFx } from "./useCardFx";

// Sprite animé d'une carte : halo, lueur et particules selon la rareté.
export function LiveSprite({
  sprite,
  rarity,
  className,
}: {
  sprite: HTMLCanvasElement;
  rarity: Rarity;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useCardFx(ref, sprite, rarity);
  return (
    <canvas
      ref={ref}
      width={CARD_W}
      height={CARD_H}
      className={`block [image-rendering:pixelated] ${className ?? ""}`}
    />
  );
}
