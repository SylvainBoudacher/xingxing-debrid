import { ChipScroller } from "@/components/ChipScroller";
import { chipClass } from "@/components/chipStyles";
import { isItemWatched, type TitleSection } from "@/lib/libraryTitle";
import { Check } from "lucide-react";

interface TitleSectionPickerProps {
  sections: TitleSection[];
  activeKey: string;
  onChange: (key: string) => void;
}

// Sélecteur de saisons (ou de dossiers) avec la progression de chacune.
export function TitleSectionPicker({ sections, activeKey, onChange }: TitleSectionPickerProps) {
  return (
    <ChipScroller>
      {sections.map((s) => {
        const seen = s.items.filter(isItemWatched).length;
        const active = s.key === activeKey;
        return (
          <button key={s.key} onClick={() => onChange(s.key)} className={chipClass(active)}>
            {s.label}
            {seen === s.items.length ? (
              <Check
                className="-mt-0.5 ml-1.5 inline-block h-3 w-3 align-middle text-emerald-500"
                strokeWidth={3}
              />
            ) : (
              <span
                className={`ml-1.5 tabular-nums ${
                  active ? "text-zinc-400" : "text-zinc-400/70 dark:text-zinc-600"
                }`}
              >
                {seen}/{s.items.length}
              </span>
            )}
          </button>
        );
      })}
    </ChipScroller>
  );
}
