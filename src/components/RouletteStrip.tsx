import { RouletteCard } from "@/components/RouletteCard";
import { RouletteMarquee } from "@/components/RouletteMarquee";
import {
  CARD_GAP,
  IDLE_LEN,
  SPIN_EASE,
  SPIN_MS,
  STRIP_LEN,
  WINNER_INDEX,
  stripOffset,
} from "@/lib/rouletteStrip";
import type { RarityScale } from "@/lib/rouletteRarity";
import type { TmdbItem } from "@/lib/tmdbItem";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

interface RouletteStripProps {
  strip: TmdbItem[];
  /** Apercu du vivier : alimente le ruban tant qu'aucun tirage n'a eu lieu. */
  preview: TmdbItem[];
  /** Echelle de raretes du vivier courant. */
  scale: RarityScale;
  /** Incremente a chaque tirage : remonte le ruban pour repartir de x = 0. */
  spin: number;
  spinning: boolean;
  revealed: boolean;
  /** Mouvement reduit : pas de boucle, le ruban se pose sur le gagnant. */
  instant: boolean;
  onSpinEnd: () => void;
}

const PLACEHOLDERS: null[] = Array.from({ length: STRIP_LEN }, () => null);

export function RouletteStrip({
  strip,
  preview,
  scale,
  spin,
  spinning,
  revealed,
  instant,
  onSpinEnd,
}: RouletteStripProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  // Le ruban est remonte par cet etat, pas par spin : il ne doit naitre qu'une
  // fois sa cible connue. Le monter avant lui donnerait une cible a zero, dont
  // la fin immediate revelerait le gagnant des le debut de l'animation.
  const [anim, setAnim] = useState({ spin: 0, offset: 0 });

  useLayoutEffect(() => {
    if (spin === 0) return;
    setAnim({ spin, offset: stripOffset(boxRef.current?.clientWidth ?? 0) });
  }, [spin]);

  const idle = spin === 0;
  const cells: (TmdbItem | null)[] = idle
    ? preview.length
      ? preview
      : PLACEHOLDERS.slice(0, IDLE_LEN)
    : strip;

  return (
    <div
      ref={boxRef}
      className="relative overflow-hidden py-5 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
    >
      {idle && !instant ? (
        <RouletteMarquee cells={cells} scale={scale} />
      ) : (
        <motion.div
          key={anim.spin}
          initial={{ x: 0 }}
          animate={{ x: -anim.offset }}
          transition={instant ? { duration: 0 } : { duration: SPIN_MS / 1000, ease: SPIN_EASE }}
          onAnimationComplete={() => {
            if (spinning) onSpinEnd();
          }}
          style={{ gap: CARD_GAP }}
          className="flex"
        >
          {cells.map((item, i) => (
            <RouletteCard
              key={i}
              item={item}
              scale={scale}
              highlight={revealed && i === WINNER_INDEX}
            />
          ))}
        </motion.div>
      )}

      <div className="pointer-events-none absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-indigo-400 shadow-[0_0_12px_2px_rgba(129,140,248,0.7)]" />
      <ChevronDown className="pointer-events-none absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 text-indigo-400" />
      <ChevronUp className="pointer-events-none absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 text-indigo-400" />
    </div>
  );
}
