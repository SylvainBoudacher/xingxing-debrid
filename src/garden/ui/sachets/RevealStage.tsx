import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Rarity, Seed } from "../../core/types";
import { CardDeck } from "./CardDeck";
import { FLIP_MS, lockFor, REVEAL_FX } from "./packFlow";
import { RevealCard } from "./RevealCard";
import { BUTTON_GHOST } from "./styles";

export function RevealStage({
  seeds,
  fresh,
  current,
  onNext,
  onRevealAll,
  onFlip,
}: {
  seeds: Seed[];
  fresh: boolean[];
  current: number;
  onNext: () => void;
  onRevealAll: () => void;
  onFlip: (rarity: Rarity, clientX: number, clientY: number) => void;
}) {
  const card = useRef<HTMLDivElement>(null);
  const lockUntil = useRef(0);

  // Effets au milieu du retournement, une fois la pause de la rareté écoulée.
  useEffect(() => {
    if (current < 0) return;
    const { rarity } = seeds[current];
    lockUntil.current = performance.now() + lockFor(rarity);
    const id = setTimeout(
      () => {
        const box = card.current?.getBoundingClientRect();
        if (box) onFlip(rarity, box.left + box.width / 2, box.top + box.height * 0.4);
      },
      REVEAL_FX[rarity].hold + FLIP_MS / 2,
    );
    return () => clearTimeout(id);
  }, [current, seeds, onFlip]);

  const next = () => {
    if (performance.now() >= lockUntil.current) onNext();
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-10">
        <CardDeck seeds={seeds.slice(current + 1)} offset={current + 1} onNext={next} />
        <div className="flex h-[400px] w-[256px] items-center justify-center">
          {current >= 0 ? (
            <motion.div
              key={current}
              ref={card}
              className="cursor-pointer"
              onClick={next}
              initial={{ x: -180, scale: 0.55, opacity: 0 }}
              animate={{ x: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
            >
              <RevealCard seed={seeds[current]} fresh={fresh[current]} size="big" />
            </motion.div>
          ) : (
            <p className="text-center text-sm text-[#a99a8a]">
              Cliquer sur le paquet pour retourner une carte
            </p>
          )}
        </div>
      </div>
      <div className="flex h-[232px] gap-3">
        {seeds.slice(0, Math.max(0, current)).map((seed, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <RevealCard seed={seed} fresh={fresh[i]} size="small" />
          </motion.div>
        ))}
      </div>
      <button onClick={onRevealAll} className={BUTTON_GHOST}>
        Tout révéler
      </button>
    </div>
  );
}
