import { motion } from "motion/react";
import type { Seed } from "../../core/types";
import { CardBack } from "./CardBack";

// Cartes encore face cachée, la première sur le dessus ; offset = index de la première
// dans le lot, pour garder des clés stables quand le paquet s'amincit.
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
      className="relative h-[232px] w-[144px] disabled:cursor-default"
    >
      {seeds.map((seed, i) => (
        <motion.div
          key={offset + i}
          className="absolute inset-0"
          style={{ zIndex: seeds.length - i }}
          initial={{ y: 80, opacity: 0, scale: 0.6 }}
          animate={{ y: i * -6, x: i * 4, opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 22 }}
        >
          <CardBack rarity={seed.rarity} className="size-full" />
        </motion.div>
      ))}
    </button>
  );
}
