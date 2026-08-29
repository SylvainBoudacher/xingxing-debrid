import { RouletteCard } from "@/components/RouletteCard";
import { CARD_GAP, PITCH, marqueeDuration } from "@/lib/rouletteStrip";
import type { RarityScale } from "@/lib/rouletteRarity";
import type { TmdbItem } from "@/lib/tmdbItem";
import { motion } from "motion/react";

// Ruban d'attente : la tuile est rendue deux fois et defile exactement de sa
// propre longueur, si bien que la reprise tombe sur une case identique et que
// la boucle ne montre pas de couture.
export function RouletteMarquee({
  cells,
  scale,
}: {
  cells: (TmdbItem | null)[];
  scale: RarityScale;
}) {
  return (
    <motion.div
      animate={{ x: [0, -PITCH * cells.length] }}
      transition={{ duration: marqueeDuration(cells.length), ease: "linear", repeat: Infinity }}
      style={{ gap: CARD_GAP }}
      className="flex"
    >
      {[...cells, ...cells].map((item, i) => (
        <RouletteCard key={i} item={item} scale={scale} highlight={false} />
      ))}
    </motion.div>
  );
}
