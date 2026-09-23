import { motion } from "motion/react";
import type { Rarity } from "../../core/types";
import { sachetDataUrl } from "../../sprites/sachet";
import { RARITY_COLOR } from "../toolMeta";

const NEUTRAL = "#7a6a5a";

// La teinte du dos trahit la rareté ; la lueur pulse à partir de rare.
export function CardBack({ rarity, className }: { rarity: Rarity; className?: string }) {
  const color = rarity === "commune" ? NEUTRAL : RARITY_COLOR[rarity];
  const ring = `inset 0 0 0 3px ${color}`;
  const glow = rarity !== "commune";
  return (
    <motion.div
      className={`flex items-center justify-center rounded-xl bg-[#2c2027] bg-[repeating-linear-gradient(45deg,rgba(255,255,255,.04)_0_6px,transparent_6px_12px)] ${className ?? ""}`}
      style={{ boxShadow: ring }}
      animate={
        glow
          ? { boxShadow: [`${ring}, 0 0 8px ${color}55`, `${ring}, 0 0 28px ${color}cc`] }
          : undefined
      }
      transition={glow ? { duration: 1.1, repeat: Infinity, repeatType: "reverse" } : undefined}
    >
      <img
        src={sachetDataUrl("quotidien")}
        alt=""
        draggable={false}
        className="w-1/3 opacity-30 [image-rendering:pixelated]"
      />
    </motion.div>
  );
}
