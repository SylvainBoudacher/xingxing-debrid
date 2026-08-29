import type { LucideIcon } from "lucide-react";

/** Couleurs d'un vivier-classement : elles le distinguent du catalogue brut. */
export interface SourceAccent {
  /** Fond du bouton actif. */
  activeBg: string;
  /** Classes Tailwind de l'anneau actif et de l'icone au repos. */
  ringClass: string;
  iconClass: string;
}

interface RouletteSourceButtonProps {
  active: boolean;
  disabled: boolean;
  Icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick: () => void;
  /** Absent : bouton indigo du catalogue. Present : bouton aux couleurs du classement. */
  accent?: SourceAccent;
}

const BOX =
  "flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium ring-1 transition-colors disabled:cursor-default disabled:opacity-40";
const IDLE =
  "bg-white/70 text-zinc-600 ring-black/10 hover:bg-white dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10 dark:hover:bg-white/10";

export function RouletteSourceButton({
  active,
  disabled,
  Icon,
  title,
  subtitle,
  onClick,
  accent,
}: RouletteSourceButtonProps) {
  const activeClass = accent
    ? `text-white shadow-sm ${accent.ringClass}`
    : "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 ring-indigo-500";

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      // Le fond des classements est une couleur de marque, hors palette Tailwind.
      style={active && accent ? { backgroundColor: accent.activeBg } : undefined}
      className={`${BOX} ${active ? activeClass : IDLE}`}
    >
      <Icon className={`h-4 w-4 ${!active && accent ? accent.iconClass : ""}`} />
      <span className="text-left">
        {title}
        <span
          className={`block text-[10px] font-normal ${
            active ? "text-white/70" : "text-zinc-500 dark:text-zinc-500"
          }`}
        >
          {subtitle}
        </span>
      </span>
    </button>
  );
}
