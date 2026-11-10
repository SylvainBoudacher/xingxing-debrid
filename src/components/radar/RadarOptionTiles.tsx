import { RadarField } from "@/components/radar/RadarField";
import type { RadarOption } from "@/components/radar/expectationOptions";
import { useId } from "react";

interface RadarOptionTilesProps<T extends string> {
  label: string;
  options: RadarOption<T>[];
  value: T;
  onChange: (value: T) => void;
  columns: 2 | 3 | 4;
}

const GRID = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };

export function RadarOptionTiles<T extends string>({
  label,
  options,
  value,
  onChange,
  columns,
}: RadarOptionTilesProps<T>) {
  const name = useId();
  return (
    <RadarField label={label}>
      <div role="radiogroup" aria-label={label} className={`grid gap-1.5 ${GRID[columns]}`}>
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <label
              key={option.id}
              className={`cursor-pointer rounded-xl px-3 py-2 ring-1 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-400 ${
                selected
                  ? "bg-indigo-500/15 ring-indigo-500/60"
                  : "bg-black/[0.03] ring-black/10 hover:bg-black/[0.06] dark:bg-white/[0.04] dark:ring-white/10 dark:hover:bg-white/[0.08]"
              }`}
            >
              <input
                type="radio"
                name={name}
                checked={selected}
                onChange={() => onChange(option.id)}
                className="sr-only"
              />
              <span
                className={`block text-sm font-semibold ${
                  selected
                    ? "text-indigo-700 dark:text-indigo-200"
                    : "text-zinc-900 dark:text-white"
                }`}
              >
                {option.label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                {option.hint}
              </span>
            </label>
          );
        })}
      </div>
    </RadarField>
  );
}
