import { motion } from "motion/react";
import type { Seed } from "../../core/types";
import { RevealCard } from "./RevealCard";
import { BUTTON, BUTTON_GHOST } from "./styles";

export function PackSummary({
  seeds,
  fresh,
  pending,
  onNextPack,
  onGoToField,
}: {
  seeds: Seed[];
  fresh: boolean[];
  pending: number;
  onNextPack: () => void;
  onGoToField: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-3">
        {seeds.map((seed, i) => (
          <motion.div
            key={i}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.08 }}
          >
            <RevealCard seed={seed} fresh={fresh[i]} size="small" />
          </motion.div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {pending > 0 && (
          <button onClick={onNextPack} className={BUTTON}>
            Sachet suivant ({pending})
          </button>
        )}
        <button onClick={onGoToField} className={BUTTON_GHOST}>
          Aller au champ
        </button>
      </div>
    </div>
  );
}
