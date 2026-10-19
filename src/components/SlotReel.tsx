import { useMemo } from "react";
import { motion } from "motion/react";
import { SYMBOLS, type SlotSymbol } from "@/game/slots";
import { randOf } from "./duckRandom";
import { PX, pixelFrame } from "./slotPixel";
import { SlotSymbolIcon } from "./slotSymbols";

// Un rouleau. La fenêtre montre trois symboles; seule la ligne du milieu paie.
// La bande fait plusieurs tours de catalogue puis se termine par le symbole
// visé encadré de deux voisins aléatoires: le résultat étant déjà tiré,
// l'animation ne fait que le montrer. Remonter la bande à chaque tirage
// (key={spin}) relance l'animation depuis le haut sans état intermédiaire.

const CELL = 56;
const LOOPS = 5;
const SHADE = "rgba(42,10,20,0.32)";
const SHADE_SOFT = "rgba(42,10,20,0.14)";

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
      className="relative overflow-hidden"
      style={{ ...pixelFrame(PX.ivory, PX.outline), height: CELL * 3, width: CELL }}
    >
      <motion.div
        key={spin}
        initial={{ y: spin === 0 ? end : 0 }}
        animate={{ y: end }}
        transition={{ duration: spin === 0 ? 0 : duration, ease: [0.1, 0.55, 0.15, 1] }}
      >
        {strip.map((s, i) => (
          <div key={i} className="flex items-center justify-center" style={{ height: CELL }}>
            <SlotSymbolIcon symbol={s} size={48} />
          </div>
        ))}
      </motion.div>
      {/* ombre en bandes dures en haut et en bas: le rouleau est un tambour */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(${SHADE} 0 6px, ${SHADE_SOFT} 6px 15px, transparent 15px calc(100% - 15px), ${SHADE_SOFT} calc(100% - 15px) calc(100% - 6px), ${SHADE} calc(100% - 6px))`,
        }}
      />
      {/* éclair d'une image quand le rouleau se verrouille */}
      {spin > 0 && (
        <span
          key={`flash-${spin}`}
          className="pointer-events-none absolute inset-0 bg-white"
          style={{ opacity: 0, animation: `slot-lock 0.16s steps(1) ${duration}s` }}
        />
      )}
      <style>{`@keyframes slot-lock { 0% { opacity: 0.7 } 100% { opacity: 0 } }`}</style>
    </div>
  );
}
