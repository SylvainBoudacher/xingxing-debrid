import { useEffect, type RefObject } from "react";
import type { ColorId, Rarity, SpeciesId, VariantId } from "../../core/types";
import { spriteCanvas } from "../../sprites/sprite";
import { createCardFx, drawCardFx } from "./cardFx";

// Anime une carte ; en pause quand la fenêtre est cachée.
export function useCardFx(
  ref: RefObject<HTMLCanvasElement | null>,
  species: SpeciesId,
  color: ColorId,
  rarity: Rarity,
  variant: VariantId | null,
) {
  useEffect(() => {
    const g = ref.current?.getContext("2d");
    if (!g) return;
    const sprite = spriteCanvas({ name: species, color, ...(variant && { variant }) });
    const fx = createCardFx(sprite, rarity, variant);
    let raf = 0;
    let last = 0;
    const frame = (ms: number) => {
      raf = requestAnimationFrame(frame);
      if (document.visibilityState !== "visible") return;
      const t = ms / 1000;
      drawCardFx(g, fx, t, last ? Math.min(0.1, t - last) : 0);
      last = t;
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [ref, species, color, rarity, variant]);
}
