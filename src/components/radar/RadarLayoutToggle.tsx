import type { RadarLayout } from "@/lib/radar/types";
import { LayoutGrid, List } from "lucide-react";

interface RadarLayoutToggleProps {
  layout: RadarLayout;
  onChange: (layout: RadarLayout) => void;
}

export function RadarLayoutToggle({ layout, onChange }: RadarLayoutToggleProps) {
  return (
    <div className="flex items-center rounded-full bg-black/5 p-0.5 dark:bg-white/10">
      {(
        [
          ["list", List],
          ["grid", LayoutGrid],
        ] as const
      ).map(([id, Icon]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          title={id === "list" ? "Vue liste" : "Vue grille"}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
            layout === id
              ? "bg-white text-indigo-600 shadow-sm dark:bg-zinc-700 dark:text-indigo-300"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
