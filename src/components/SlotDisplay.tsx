import type { SlotResult } from "@/game/slots";
import { PRIZE_LABEL } from "./slotCopy";
import { PIXEL_FONT, PX, pixelFrame } from "./slotPixel";

// Afficheur de la borne, sous les rouleaux: consigne ou résultat du tirage.
export function SlotDisplay({
  rolling,
  reveal,
  ready,
}: {
  rolling: boolean;
  reveal: SlotResult | null;
  ready: boolean;
}) {
  const lost = !rolling && reveal?.prize === "none";

  const title = rolling
    ? "Ça tourne..."
    : reveal
      ? reveal.jackpotUnlock
        ? "Jackpot !"
        : PRIZE_LABEL[reveal.prize]
      : ready
        ? "Tire le levier"
        : "En charge";

  const line = rolling
    ? ""
    : reveal
      ? reveal.jackpotUnlock
        ? "Le Canard Croupier est débloqué dans le Canardex."
        : reveal.variant
          ? "Attrape-le dans le bassin pour le garder."
          : "Le pity du bassin avance."
      : ready
        ? "Attrape le pommeau et tire vers le bas."
        : "Reviens quand la borne sera rechargée.";

  return (
    <div
      className="flex h-[60px] flex-col items-center justify-center px-2 text-center"
      style={{ ...pixelFrame(PX.ink, PX.outline), fontFamily: PIXEL_FONT }}
    >
      <p className="text-[26px] leading-none" style={{ color: lost ? PX.steel : PX.yellow }}>
        {title}
      </p>
      {line && (
        <p className="mt-1 text-[16px] leading-none" style={{ color: PX.ivoryShade }}>
          {line}
        </p>
      )}
    </div>
  );
}
