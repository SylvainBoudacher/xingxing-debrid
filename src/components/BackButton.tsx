import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

// default : barre claire/sombre du thème. overlay : pastille lisible sur une
// image. dark : barre toujours sombre (lecteur, étape thème été).
export type BackButtonTone = "default" | "overlay" | "dark";

const TONE: Record<BackButtonTone, string> = {
  default: "text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300",
  overlay: "bg-black/35 text-white backdrop-blur-md hover:bg-black/50",
  dark: "text-indigo-300 hover:text-indigo-200",
};

interface BackButtonProps {
  onClick: () => void;
  tone?: BackButtonTone;
}

// La marge négative compense le padding de la pastille : l'icône tombe au même
// pixel quel que soit le ton, posée dans une barre en px-6.
export function BackButton({ onClick, tone = "default" }: BackButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={`-ml-2.5 flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium transition-colors ${TONE[tone]}`}
    >
      <ArrowLeft className="h-4 w-4" />
      Retour
    </motion.button>
  );
}
