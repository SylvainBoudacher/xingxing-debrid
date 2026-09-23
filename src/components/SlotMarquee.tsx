import { PX, pixelFrame } from "./slotPixel";
import { SlotSymbolIcon } from "./slotSymbols";

// Fronton de la borne: l'enseigne 777 et sa rangée d'ampoules. Une ampoule
// sur deux s'allume en alternance quand un tirage est disponible, le rythme
// s'emballe pendant le tirage, et tout reste éteint pendant le cooldown.

const BULBS = 13;

export function SlotMarquee({ lit, rolling }: { lit: boolean; rolling: boolean }) {
  const on = lit || rolling;
  const period = rolling ? 0.2 : 0.8;
  return (
    <div
      className="px-4 pb-2 pt-3"
      style={pixelFrame(on ? PX.gold : PX.goldOff, PX.outline, 3, {
        light: on ? PX.goldLight : "#A8927E",
        dark: on ? PX.goldDark : "#6A5646",
      })}
    >
      <div className="flex justify-between px-1">
        {Array.from({ length: BULBS }, (_, i) => (
          <span
            key={i}
            className="h-[6px] w-[6px]"
            style={{
              background: on ? PX.ivory : "#6A5646",
              animation: on
                ? `slot-bulb ${period}s steps(1) ${i % 2 ? period / 2 : 0}s infinite`
                : undefined,
            }}
          />
        ))}
      </div>
      <div
        className="mt-1.5 flex justify-center gap-1"
        style={{
          filter: on ? undefined : "grayscale(1) brightness(0.6)",
          animation: rolling ? "slot-777 0.4s steps(1) infinite" : undefined,
        }}
      >
        {[0, 1, 2].map((i) => (
          <SlotSymbolIcon key={i} symbol="seven" size={32} />
        ))}
      </div>
      <style>{`
        @keyframes slot-bulb { 0% { opacity: 1 } 50% { opacity: 0.2 } }
        @keyframes slot-777 { 0% { opacity: 1 } 50% { opacity: 0.6 } }
      `}</style>
    </div>
  );
}
