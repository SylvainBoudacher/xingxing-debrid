import type { ReadingDirection } from "@/lib/mangaLibrary";
import type { FitMode, PageMode } from "@/lib/readerPrefs";
import {
  ArrowLeft,
  ArrowLeftRight,
  BookOpen,
  Columns2,
  Maximize2,
  MoveHorizontal,
  MoveVertical,
} from "lucide-react";
import { motion } from "motion/react";

interface ReaderToolbarProps {
  title: string;
  subtitle: string;
  pageMode: PageMode;
  fit: FitMode;
  direction: ReadingDirection;
  onPageMode: (mode: PageMode) => void;
  onFit: (fit: FitMode) => void;
  onDirection: (direction: ReadingDirection) => void;
  onClose: () => void;
}

const FIT_ICON: Record<FitMode, typeof MoveVertical> = {
  height: MoveVertical,
  width: MoveHorizontal,
  actual: Maximize2,
};

const FIT_LABEL: Record<FitMode, string> = {
  height: "Ajuster à la hauteur",
  width: "Ajuster à la largeur",
  actual: "Taille réelle",
};

const NEXT_FIT: Record<FitMode, FitMode> = { height: "width", width: "actual", actual: "height" };

export function ReaderToolbar({
  title,
  subtitle,
  pageMode,
  fit,
  direction,
  onPageMode,
  onFit,
  onDirection,
  onClose,
}: ReaderToolbarProps) {
  const FitIcon = FIT_ICON[fit];
  return (
    <div className="flex items-center gap-3 border-b border-white/5 bg-black/40 px-4 py-2 backdrop-blur-xl">
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={onClose}
        className="flex items-center gap-1.5 text-indigo-300 transition-colors hover:text-indigo-200"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Retour</span>
      </motion.button>

      <div className="min-w-0 flex-1 text-center">
        <p className="truncate text-sm font-semibold text-white">{title}</p>
        <p className="truncate text-xs text-zinc-400">{subtitle}</p>
      </div>

      <div className="flex items-center gap-1">
        <ToolbarButton
          label={pageMode === "single" ? "Passer en double page" : "Passer en page simple"}
          onClick={() => onPageMode(pageMode === "single" ? "double" : "single")}
        >
          {pageMode === "single" ? (
            <BookOpen className="h-4 w-4" />
          ) : (
            <Columns2 className="h-4 w-4" />
          )}
        </ToolbarButton>

        <ToolbarButton label={FIT_LABEL[fit]} onClick={() => onFit(NEXT_FIT[fit])}>
          <FitIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          label={
            direction === "rtl" ? "Lecture japonaise (droite à gauche)" : "Lecture occidentale"
          }
          onClick={() => onDirection(direction === "rtl" ? "ltr" : "rtl")}
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span className="text-[10px] font-semibold uppercase">{direction}</span>
        </ToolbarButton>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </motion.button>
  );
}
