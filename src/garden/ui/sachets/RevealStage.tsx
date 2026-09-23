import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Rarity, Seed } from "../../core/types";
import { FLIP_MS, lockFor, REVEAL_FX } from "./packFlow";
import { RevealCard } from "./RevealCard";
import { BUTTON_GHOST } from "./styles";

// Du centre de la pile au centre d'une case, et d'une case à la suivante.
const TO_SLOTS = 310;
const SLOT_STEP = 156;
const BIG_TO_SMALL = 224 / 144;

// Pile en grand au centre : un clic retourne la carte du dessus, le suivant la range dans
// sa case en bas. Rien ne se décale d'une carte à l'autre.
export function RevealStage({
  seeds,
  current,
  flipped,
  onNext,
  onRevealAll,
  onFlip,
}: {
  seeds: Seed[];
  current: number;
  flipped: boolean;
  onNext: () => void;
  onRevealAll: () => void;
  onFlip: (rarity: Rarity, clientX: number, clientY: number) => void;
}) {
  const top = useRef<HTMLDivElement>(null);
  const lockUntil = useRef(0);

  // Effets au milieu du retournement, une fois la pause de la rareté écoulée.
  useEffect(() => {
    if (!flipped) return;
    const { rarity } = seeds[current];
    lockUntil.current = performance.now() + lockFor(rarity);
    const id = setTimeout(
      () => {
        const box = top.current?.getBoundingClientRect();
        if (box) onFlip(rarity, box.left + box.width / 2, box.top + box.height * 0.4);
      },
      REVEAL_FX[rarity].hold + FLIP_MS / 2,
    );
    return () => clearTimeout(id);
  }, [current, flipped, seeds, onFlip]);

  const next = () => {
    if (performance.now() >= lockUntil.current) onNext();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <div
          className="relative h-[356px] w-[224px] cursor-pointer"
          onClick={next}
          title={flipped ? "Ranger la carte" : "Retourner la carte"}
        >
          {seeds.map((seed, i) => {
            if (i < current) return null;
            const depth = i - current;
            return (
              <motion.div
                key={i}
                ref={depth === 0 ? top : undefined}
                className="absolute inset-0"
                style={{ zIndex: seeds.length - i }}
                initial={{ y: 80, opacity: 0, scale: 0.6 }}
                animate={{ x: depth * 6, y: depth * -5, rotate: depth * 2, opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 22 }}
              >
                <RevealCard seed={seed} size="big" faceUp={depth === 0 && flipped} />
              </motion.div>
            );
          })}
        </div>
        <p className="text-xs text-[#a99a8a]">
          {flipped ? "Cliquer pour ranger la carte" : "Cliquer pour retourner la carte"}
        </p>
      </div>
      <div className="flex gap-3">
        {seeds.map((seed, i) => (
          <div key={i} className="relative h-[232px] w-[144px]">
            {i < current ? (
              <motion.div
                initial={{
                  x: -(i - (seeds.length - 1) / 2) * SLOT_STEP,
                  y: -TO_SLOTS,
                  scale: BIG_TO_SMALL,
                }}
                animate={{ x: 0, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 26 }}
              >
                <RevealCard seed={seed} size="small" />
              </motion.div>
            ) : (
              <div className="size-full rounded-xl border-2 border-dashed border-amber-300/15" />
            )}
          </div>
        ))}
      </div>
      <button onClick={onRevealAll} className={BUTTON_GHOST}>
        Tout révéler
      </button>
    </div>
  );
}
