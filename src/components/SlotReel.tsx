import { useMemo } from "react";
import { motion } from "motion/react";
import { SYMBOLS, type SlotSymbol } from "@/game/slots";
import { randOf } from "./duckRandom";
import { SlotSymbolIcon } from "./slotSymbols";

// Un rouleau. La fenêtre montre trois symboles; seule la ligne du milieu paie.
// La bande fait plusieurs tours de catalogue puis se termine par le symbole
// visé encadré de deux voisins aléatoires: le résultat étant déjà tiré,
// l'animation ne fait que le montrer. Remonter la bande à chaque tirage
// (key={spin}) relance l'animation depuis le haut sans état intermédiaire.

const CELL = 56;
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
  // mémoïsé pour que les re-rendus (compte à rebours...) ne re-tirent pas les
  // voisins sous une bande déjà affichée
  const strip = useMemo(
    () =>
      [...Array(LOOPS)]
        .flatMap(() => SYMBOLS)
        .concat(
          randOf(SYMBOLS.filter((s) => s !== symbol)),
          symbol,
          randOf(SYMBOLS.filter((s) => s !== symbol)),
        ),
    // spin force un nouveau tirage des voisins meme si le symbole est identique
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [symbol, spin],
  );
  const end = -(LOOPS * SYMBOLS.length * CELL);

  return (
    <div
      className="relative overflow-hidden rounded-lg bg-[#0D0205] ring-1 ring-amber-400/20 shadow-inner"
      style={{ height: CELL * 3, width: CELL }}
    >
      <motion.div
        key={spin}
        initial={{ y: spin === 0 ? end : 0 }}
        animate={{ y: end }}
        transition={{ duration: spin === 0 ? 0 : duration, ease: [0.1, 0.55, 0.15, 1] }}
      >
        {strip.map((s, i) => (
          <div key={i} className="flex items-center justify-center" style={{ height: CELL }}>
            <SlotSymbolIcon symbol={s} size={38} />
          </div>
        ))}
      </motion.div>
      {/* éclair quand le rouleau se verrouille */}
      {spin > 0 && (
        <span
          key={`flash-${spin}`}
          className="pointer-events-none absolute inset-0 bg-white"
          style={{ opacity: 0, animation: `slot-lock 0.4s ${duration}s forwards` }}
        />
      )}
      <style>{`@keyframes slot-lock { 0% { opacity: 0.4 } 100% { opacity: 0 } }`}</style>
    </div>
  );
}
