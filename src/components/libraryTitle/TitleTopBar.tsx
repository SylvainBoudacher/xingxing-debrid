import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

interface TitleTopBarProps {
  title: string;
  // Vrai une fois le bandeau sorti de l'écran : la barre devient opaque et
  // reprend le titre.
  solid: boolean;
  onBack: () => void;
  menu: ReactNode;
}

export function TitleTopBar({ title, solid, onBack, menu }: TitleTopBarProps) {
  return (
    <div
      className={`sticky top-0 z-20 border-b transition-[background-color,border-color] duration-200 ${
        solid
          ? "border-black/5 bg-white/70 backdrop-blur-xl dark:border-white/5 dark:bg-black/60"
          : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-6">
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={onBack}
          className={`flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium transition-colors ${
            solid
              ? "text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              : "bg-black/35 text-white backdrop-blur-md hover:bg-black/50"
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </motion.button>
        <p
          className={`min-w-0 flex-1 truncate text-center text-sm font-semibold text-zinc-900 transition-opacity duration-200 dark:text-white ${
            solid ? "opacity-100" : "opacity-0"
          }`}
        >
          {title}
        </p>
        {menu}
      </div>
    </div>
  );
}
