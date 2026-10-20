import { motion } from "motion/react";
import type { Grade } from "../../core/types";

const LABEL: Record<Grade, [string, string]> = {
  parfait: ["Parfait !", "#a8e070"],
  bien: ["Bien", "#f5c84a"],
  rate: ["Raté", "#f07a62"],
};

// Résultat du mini-jeu, posé en bandeau sur la toile.
export function GradeBanner({ grade }: { grade: Grade }) {
  const [label, color] = LABEL[grade];
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        className="w-full py-1.5 text-center text-4xl font-bold italic"
        style={{ background: "rgba(20, 14, 10, 0.7)", color }}
        initial={{ opacity: 0, scale: 1.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {label}
      </motion.div>
    </div>
  );
}
