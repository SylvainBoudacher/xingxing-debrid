import { PAYOUTS, PRIZE_LABEL } from "./slotCopy";
import { PIXEL_FONT, PX, pixelFrame } from "./slotPixel";
import { SlotSymbolIcon } from "./slotSymbols";

// Table des gains peinte sur la vitre de la borne, au-dessus des rouleaux.
// Le 777 est le seul lot à exiger les trois rouleaux, le reste se paie à la
// paire.
export function SlotPayouts() {
  return (
    <ul className="space-y-1 px-3 py-2.5" style={pixelFrame(PX.ink, PX.outline)}>
      {PAYOUTS.map((p) => (
        <li
          key={p.prize}
          className="flex items-center gap-2 text-[19px] leading-none"
          style={{ fontFamily: PIXEL_FONT }}
        >
          <span className="flex w-[48px] shrink-0">
            {Array.from({ length: p.prize === "jackpot" ? 3 : 2 }, (_, i) => (
              <SlotSymbolIcon key={i} symbol={p.symbol} size={16} />
            ))}
          </span>
          <span className="flex-1 truncate" style={{ color: PX.ivory }}>
            {PRIZE_LABEL[p.prize]}
          </span>
          <span className="tabular-nums" style={{ color: PX.yellow }}>
            {p.note}
          </span>
        </li>
      ))}
    </ul>
  );
}
