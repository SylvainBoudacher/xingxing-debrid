import type { SlotSymbol } from "@/game/slots";
import { PixelSprite } from "./PixelSprite";
import { SYMBOL_LABELS } from "./slotCopy";
import { SYMBOL_PATHS } from "./slotPixelArt";

// Les symboles des rouleaux, en SVG plutôt qu'en canvas: ils vivent dans un
// rouleau qui défile en CSS, et un <svg> se laisse empiler et animer sans
// contexte de dessin. La taille reste un multiple de 16 pour des pixels nets.

export function SlotSymbolIcon({ symbol, size = 48 }: { symbol: SlotSymbol; size?: number }) {
  return (
    <PixelSprite
      paths={SYMBOL_PATHS[symbol]}
      w={16}
      h={16}
      scale={size / 16}
      label={SYMBOL_LABELS[symbol]}
    />
  );
}
