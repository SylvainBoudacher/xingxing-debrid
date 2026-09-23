import { motion } from "motion/react";
import type { Reels } from "@/game/slots";
import { PixelSprite } from "./PixelSprite";
import { ARROW_PATHS } from "./slotPixelArt";
import { PX, pixelFrame } from "./slotPixel";
import { SlotReel } from "./SlotReel";

// La vitre des rouleaux, encadrée des deux encoches de la ligne de paie. Elles
// clignotent en rose pendant le tirage, en jaune sur un gain.
export function SlotWindow({
  reels,
  spin,
  durations,
  rolling,
  won,
}: {
  reels: Reels;
  spin: number;
  durations: number[];
  rolling: boolean;
  won: boolean;
}) {
  const color = won ? PX.yellow : rolling ? PX.pink : PX.cabinetDark;
  const blink = won || rolling ? `slot-notch ${won ? 0.3 : 0.5}s steps(1) infinite` : undefined;

  return (
    <div className="flex items-center justify-center gap-2" style={{ color }}>
      <PixelSprite paths={ARROW_PATHS} w={4} h={7} scale={3} style={{ animation: blink }} />
      <motion.div
        animate={rolling ? { x: [0, -2, 2, -1, 1, 0] } : { x: 0 }}
        transition={
          rolling ? { duration: 0.28, repeat: Infinity, ease: "linear" } : { duration: 0.2 }
        }
        className="flex gap-2.5 p-3"
        style={pixelFrame(PX.ink, won ? PX.yellow : PX.outline)}
      >
        {reels.map((s, i) => (
          <SlotReel key={i} symbol={s} spin={spin} duration={durations[i]} />
        ))}
      </motion.div>
      <PixelSprite
        paths={ARROW_PATHS}
        w={4}
        h={7}
        scale={3}
        style={{ animation: blink, transform: "scaleX(-1)" }}
      />
      <style>{`@keyframes slot-notch { 0% { opacity: 1 } 50% { opacity: 0.25 } }`}</style>
    </div>
  );
}
