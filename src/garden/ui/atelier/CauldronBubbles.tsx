import { motion } from "motion/react";

const BUBBLES = [
  { left: "38%", delay: 0 },
  { left: "52%", delay: 0.6 },
  { left: "62%", delay: 1.2 },
];

export function CauldronBubbles() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[18%]">
      {BUBBLES.map((b) => (
        <motion.span
          key={b.left}
          className="absolute size-2.5 rounded-full bg-[#b9f09a]/80 shadow-[0_0_8px_#8fcf5a]"
          style={{ left: b.left }}
          animate={{ y: [0, -36], opacity: [0.9, 0] }}
          transition={{ duration: 1.8, delay: b.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
