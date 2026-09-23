import { motion, useReducedMotion } from "motion/react";
import { flowerName, RARITY_FR, VARIANT_FR } from "../../core/labels";
import type { Seed } from "../../core/types";
import { LiveFlower } from "../cards/LiveFlower";
import { RARITY_COLOR } from "../toolMeta";
import { CardBack } from "./CardBack";
import { NewStamp } from "./NewStamp";
import { FLIP_MS, REVEAL_FX } from "./packFlow";

const SIZE = {
  big: { box: "h-[400px] w-[256px]", flower: "w-[224px]", name: "text-xl" },
  small: { box: "h-[232px] w-[144px]", flower: "w-[112px]", name: "text-sm" },
};

// big : tremble le temps de la pause de sa rareté, puis se retourne.
// small : déjà retournée, pour la rangée et le récapitulatif.
export function RevealCard({
  seed,
  fresh,
  size,
}: {
  seed: Seed;
  fresh: boolean;
  size: "big" | "small";
}) {
  const reduced = useReducedMotion();
  const s = SIZE[size];
  const big = size === "big";
  const color = RARITY_COLOR[seed.rarity];
  const hold = big ? REVEAL_FX[seed.rarity].hold / 1000 : 0;
  const shake = big && hold > 0 && !reduced;
  return (
    <motion.div
      className={`relative ${s.box}`}
      style={{ perspective: 1200 }}
      animate={shake ? { x: [0, -2, 2, -3, 3, -4, 4, -5, 5, 0] } : undefined}
      transition={shake ? { duration: hold, ease: "easeIn" } : undefined}
    >
      <motion.div
        className="relative size-full"
        style={{ transformStyle: "preserve-3d" }}
        initial={big ? { rotateY: 180 } : false}
        animate={{ rotateY: 0 }}
        transition={{ delay: hold, duration: FLIP_MS / 1000, ease: "easeOut" }}
      >
        <div
          className="absolute inset-0 [backface-visibility:hidden]"
          style={{ transform: "rotateY(180deg)" }}
        >
          <CardBack rarity={seed.rarity} className="size-full" />
        </div>
        <div
          className="absolute inset-0 flex flex-col items-center gap-1 rounded-xl bg-[#241a20] p-3 [backface-visibility:hidden]"
          style={{ boxShadow: `inset 0 0 0 3px ${color}` }}
        >
          <LiveFlower
            species={seed.species}
            color={seed.color}
            rarity={seed.rarity}
            variant={seed.variant ?? null}
            className={s.flower}
          />
          <b className={`text-center font-serif ${s.name} text-[#f3dca0]`}>{flowerName(seed)}</b>
          <span className="text-xs" style={{ color }}>
            {RARITY_FR[seed.rarity]}
            {seed.variant && ` - ${VARIANT_FR[seed.variant]}`}
          </span>
          {fresh && <NewStamp delay={big ? hold + FLIP_MS / 1000 : 0} />}
        </div>
      </motion.div>
    </motion.div>
  );
}
