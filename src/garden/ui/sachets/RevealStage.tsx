import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Rarity, Seed } from "../../core/types";
import { CardDeck } from "./CardDeck";
import { FLIP_MS, lockFor, REVEAL_FX } from "./packFlow";
import { RevealCard } from "./RevealCard";
import { BUTTON_GHOST } from "./styles";

// Distance du centre de la scène au paquet posé dessous : la carte en sort.
const FROM_DECK = 207;

// Scène fixe : carte en grand au centre, paquet dessous, une case par carte en bas.
// Rien ne se décale d'une carte à l'autre.
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
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-[318px] w-[200px] items-center justify-center">
        {current >= 0 ? (
          <motion.div
            key={current}
            ref={card}
            className="cursor-pointer"
            onClick={next}
            initial={{ y: FROM_DECK, scale: 0.24, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
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
      <div className="relative">
        <CardDeck seeds={seeds.slice(current + 1)} offset={current + 1} onNext={next} />
        <button
          onClick={onRevealAll}
          className={`absolute left-full top-1/2 ml-8 -translate-y-1/2 whitespace-nowrap ${BUTTON_GHOST}`}
        >
          Tout révéler
        </button>
      </div>
      <div className="flex gap-3">
        {seeds.map((seed, i) => (
          <div key={i} className="relative h-[232px] w-[144px]">
            {i < current ? (
              <motion.div
                initial={{ opacity: 0, y: -60, scale: 1.2 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
              >
                <RevealCard seed={seed} fresh={fresh[i]} size="small" />
              </motion.div>
            ) : (
              <div className="size-full rounded-xl border-2 border-dashed border-amber-300/15" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
