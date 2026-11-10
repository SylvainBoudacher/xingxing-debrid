import { chipClass } from "@/components/chipStyles";

interface RadarChipGroupProps<T extends string> {
  options: [T, string][];
  active: T;
  onSelect: (value: T) => void;
}

export function RadarChipGroup<T extends string>({
  options,
  active,
  onSelect,
}: RadarChipGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className={chipClass(active === value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
