import { BackButton } from "@/components/BackButton";
import { motion } from "motion/react";
import type { ReactNode, Ref } from "react";

interface PageHeaderProps {
  title: string;
  onBack: () => void;
  menu: ReactNode;
  // Glisse depuis le haut à l'arrivée sur la page.
  entrance?: boolean;
  inert?: boolean;
  ref?: Ref<HTMLDivElement>;
  zIndex?: "z-10" | "z-30";
}

// Barre ancrée aux bords de la fenêtre (h-14, px-10) : Retour et menu restent
// au même endroit sur toutes les pages, quelle que soit la largeur.
export function PageHeader({
  title,
  onBack,
  menu,
  entrance = false,
  inert,
  ref,
  zIndex = "z-10",
}: PageHeaderProps) {
  return (
    <motion.div
      ref={ref}
      inert={inert}
      initial={entrance ? { opacity: 0, y: -16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      data-page-header
      className={`sticky top-0 ${zIndex} border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/30 backdrop-blur-xl`}
    >
      <div className="relative flex h-14 items-center justify-between px-10">
        <BackButton onClick={onBack} />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
          {title}
        </h1>
        {menu}
      </div>
    </motion.div>
  );
}
