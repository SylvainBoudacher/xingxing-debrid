import { motion } from "motion/react";
import { SYMBOLS, type SlotSymbol } from "@/game/slots";
import { SlotSymbolIcon } from "./slotSymbols";

// Un rouleau. La bande fait plusieurs tours de catalogue puis se termine par le
// symbole visé: le résultat étant déjà tiré, l'animation ne fait que le montrer.
// Remonter la bande à chaque tirage (key={spin}) relance l'animation depuis le
// haut sans avoir à gérer d'état intermédiaire.

const CELL = 68;
const LOOPS = 5;

export function SlotReel({
  symbol,
  spin,
  duration,
}: {
  symbol: SlotSymbol;
  spin: number; // numéro du tirage, 0 = jamais joué
  duration: number;
}) {
  const strip = [...Array(LOOPS)].flatMap(() => SYMBOLS).concat(symbol);
  const end = -(LOOPS * SYMBOLS.length * CELL);

  return (
    <div
      className="overflow-hidden rounded-lg bg-zinc-950/90 ring-1 ring-white/15 shadow-inner"
      style={{ height: CELL, width: CELL }}
    >
      <motion.div
        key={spin}
        initial={{ y: spin === 0 ? end : 0 }}
        animate={{ y: end }}
        transition={{ duration: spin === 0 ? 0 : duration, ease: [0.1, 0.55, 0.15, 1] }}
      >
        {strip.map((s, i) => (
          <div key={i} className="flex items-center justify-center" style={{ height: CELL }}>
            <SlotSymbolIcon symbol={s} size={44} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
