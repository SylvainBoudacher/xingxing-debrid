import { motion } from "motion/react";

// Tombe sur la carte une fois retournée ; delay en secondes.
export function NewStamp({ delay }: { delay: number }) {
  return (
    <motion.span
      className="absolute -right-3 -top-3 z-10 rounded-md border-2 border-[#e8603a] bg-[#2a1410] px-2 py-0.5 font-serif text-sm font-bold text-[#ffb08a] shadow-[0_0_12px_rgba(232,96,58,.6)]"
      initial={{ scale: 2.4, opacity: 0, rotate: -12 }}
      animate={{ scale: 1, opacity: 1, rotate: -12 }}
      transition={{ delay, type: "spring", stiffness: 500, damping: 18 }}
    >
      Nouveau !
    </motion.span>
  );
}
