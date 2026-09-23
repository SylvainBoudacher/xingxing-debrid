import { motion } from "motion/react";
import type { Seed } from "../../core/types";
import { CardBack } from "./CardBack";

// Paquet compact posé sous la scène : la première carte est dessus, les autres dépassent
// en éventail. offset = index de la première dans le lot, pour des clés stables.
export function CardDeck({
  seeds,
  offset,
  onNext,
}: {
  seeds: Seed[];
  offset: number;
  onNext: () => void;
}) {
  return (
    <button
      onClick={onNext}
      disabled={!seeds.length}
      title="Retourner la carte suivante"
      className="relative h-[72px] w-[46px] disabled:cursor-default"
    >
      {seeds.map((seed, i) => (
        <motion.div
          key={offset + i}
          className="absolute inset-0"
          style={{ zIndex: seeds.length - i }}
          initial={{ y: 40, opacity: 0, scale: 0.6 }}
          animate={{ x: i * 7, rotate: i * 5, opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 22 }}
        >
          <CardBack rarity={seed.rarity} className="size-full" />
        </motion.div>
      ))}
    </button>
  );
}
