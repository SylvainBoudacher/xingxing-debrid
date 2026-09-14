import { BackButton } from "@/components/BackButton";
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
      <div className="flex h-14 items-center gap-4 px-10">
        <BackButton onClick={onBack} tone={solid ? "default" : "overlay"} />
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
