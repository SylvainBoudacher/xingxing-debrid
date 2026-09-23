import { motion, useReducedMotion } from "motion/react";
import { seedLabel } from "../../core/labels";
import type { Seed } from "../../core/types";
import { seedCanvas } from "../../sprites/seed";
import { LiveSprite } from "../cards/LiveSprite";
import { RARITY_COLOR } from "../toolMeta";
import { CardBack } from "./CardBack";
import { FLIP_MS, REVEAL_FX } from "./packFlow";

const SIZE = {
  big: { box: "h-[356px] w-[224px]", art: "w-[196px]", name: "text-xl" },
  small: { box: "h-[232px] w-[144px]", art: "w-[112px]", name: "text-sm" },
};

const SHAKE = [0, -2, 2, -3, 3, -4, 4, -5, 5, 0];

// Carte de graine : elle ne dit que la rareté, la fleur attend l'éclosion. Quand faceUp
// passe à vrai, la grande carte tremble le temps de la pause de sa rareté puis se retourne
// (en fondu si le mouvement est réduit).
export function RevealCard({
  seed,
  size,
  faceUp = true,
}: {
  seed: Seed;
  size: "big" | "small";
  faceUp?: boolean;
}) {
  const reduced = useReducedMotion();
  const s = SIZE[size];
  const color = RARITY_COLOR[seed.rarity];
  const hold = faceUp && size === "big" ? REVEAL_FX[seed.rarity].hold / 1000 : 0;
  const shake = hold > 0 && !reduced;
  const flip = !reduced;
  const turn = { delay: hold, duration: FLIP_MS / 1000, ease: "easeOut" as const };
  return (
    <motion.div
      className={`relative ${s.box}`}
      style={{ perspective: 1200 }}
      animate={shake ? { x: SHAKE } : undefined}
      transition={shake ? { duration: hold, ease: "easeIn" } : undefined}
    >
      <motion.div
        className="relative size-full"
        style={{ transformStyle: "preserve-3d" }}
        initial={false}
        animate={{ rotateY: flip && !faceUp ? 180 : 0 }}
        transition={turn}
      >
        {flip && (
          <div
            className="absolute inset-0 [backface-visibility:hidden]"
            style={{ transform: "rotateY(180deg)" }}
          >
            <CardBack rarity={seed.rarity} className="size-full" />
          </div>
        )}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl bg-[#241a20] p-3 [backface-visibility:hidden]"
          style={{ boxShadow: `inset 0 0 0 3px ${color}` }}
        >
          <LiveSprite
            sprite={seedCanvas(seed.rarity)}
            rarity={seed.rarity}
            variant={null}
            className={s.art}
          />
          <b className={`text-center font-serif ${s.name}`} style={{ color }}>
            {seedLabel(seed.rarity)}
          </b>
        </div>
        {!flip && (
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: faceUp ? 0 : 1 }}
            transition={turn}
          >
            <CardBack rarity={seed.rarity} className="size-full" />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
