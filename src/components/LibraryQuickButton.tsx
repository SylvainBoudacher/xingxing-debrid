import { motion } from "motion/react";
import { Library } from "lucide-react";

interface LibraryQuickButtonProps {
  onClick: () => void;
}

export function LibraryQuickButton({ onClick }: LibraryQuickButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex h-8 items-center gap-1.5 rounded-full bg-white/90 dark:bg-zinc-800/80 px-3 ring-1 ring-black/10 dark:ring-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition-colors"
    >
      <Library className="h-4 w-4" />
      <span className="text-sm font-medium">Ma bibliothèque</span>
    </motion.button>
  );
}
