import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { RARITY_FR } from "../../core/labels";
import type { Seed } from "../../core/types";
import { RARITY_COLOR } from "../toolMeta";
import { delays } from "./reveal";

// Remonté à chaque sachet (clé = numéro de lot), donc l'état repart de zéro tout seul.
export function SeedReveal({ seeds }: { seeds: Seed[] }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const timers = delays(seeds).map((at, i) =>
      setTimeout(() => setShown((n) => Math.max(n, i + 1)), at),
    );
    return () => timers.forEach(clearTimeout);
  }, [seeds]);

  if (!seeds.length) return null;
  return (
    <div
      className="flex cursor-pointer gap-3.5"
      onClick={() => setShown(seeds.length)}
      title="Cliquer pour tout révéler"
    >
      {seeds.map((seed, i) => {
        const open = i < shown;
        const color = RARITY_COLOR[seed.rarity];
        return (
          <div key={i} className="flex w-[70px] flex-col items-center gap-1.5">
            <motion.div
              className="relative size-[52px]"
              style={{ transformStyle: "preserve-3d" }}
              initial={{ rotateY: 0 }}
              animate={{ rotateY: open ? 180 : 0 }}
              transition={{ duration: 0.4 }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-[#3a2b33] text-[#7a6a5a] ring-2 ring-inset ring-amber-300/35"
                style={{ backfaceVisibility: "hidden" }}
              >
                ?
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-[#241a20] text-xl"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  color,
                  boxShadow:
                    seed.rarity === "legendaire"
                      ? `inset 0 0 0 2px ${color}, 0 0 20px rgba(243,195,74,.6)`
                      : `inset 0 0 0 2px ${color}`,
                }}
              >
                ●
              </div>
            </motion.div>
            <small className="text-[10px]" style={{ color: open ? color : "transparent" }}>
              {RARITY_FR[seed.rarity]}
            </small>
          </div>
        );
      })}
    </div>
  );
}
