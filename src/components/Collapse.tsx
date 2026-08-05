import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

// Durée proportionnelle à la hauteur : à durée fixe, une saison de 24 épisodes
// défile 4x plus vite qu'une saison de 6 et l'animation devient invisible.
function durationFor(height: number) {
  return Math.min(0.55, Math.max(0.35, height / 1400));
}

// Accordéon animé. Le contenu est monté avant que l'animation ne démarre :
// monter des dizaines de lignes bloque le thread une frame entière, et motion
// rattrape ce délai d'un coup, ce qui rend l'ouverture instantanée.
export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const [mounted, setMounted] = useState(open);
  const [expanded, setExpanded] = useState(open);
  const contentRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0.5);

  // Ajustement pendant le rendu plutôt que dans un effet : la fermeture doit
  // être prise en compte avant la peinture, sinon une frame passe à l'état ouvert.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setMounted(true);
    else setExpanded(false);
  }

  useEffect(() => {
    if (!mounted || !open) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        setDuration(durationFor(contentRef.current?.offsetHeight ?? 0));
        setExpanded(true);
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [mounted, open]);

  if (!mounted) return null;

  return (
    <motion.div
      initial={false}
      animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
      transition={{
        height: { duration, ease: EASE },
        opacity: { duration: expanded ? duration * 0.6 : 0.2, ease: "easeOut" },
      }}
      onAnimationComplete={() => {
        if (!open) setMounted(false);
      }}
      className="overflow-hidden"
      style={{ willChange: "height" }}
    >
      {/* `contain` évite de relayouter les dizaines de lignes à chaque frame :
          seule la hauteur du conteneur change. */}
      <motion.div
        ref={contentRef}
        initial={false}
        animate={{ y: expanded ? 0 : -10 }}
        transition={{ duration, ease: EASE }}
        style={{ contain: "layout paint" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
