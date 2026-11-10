import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODE_HINTS } from "@/lib/radar/labels";
import type { RadarFilters } from "@/lib/radar/view";

interface RadarModeSelectProps {
  value: RadarFilters["mode"];
  onChange: (value: RadarFilters["mode"]) => void;
}

const OPTIONS: { id: RadarFilters["mode"]; label: string; hint?: string }[] = [
  { id: "all", label: "Tous" },
  { id: "soft", label: "Souple", hint: MODE_HINTS.soft },
  { id: "strict", label: "Strict", hint: MODE_HINTS.strict },
];

export function RadarModeSelect({ value, onChange }: RadarModeSelectProps) {
  const current = OPTIONS.find((o) => o.id === value)?.label.toLowerCase();
  return (
    <Select value={value} onValueChange={(v) => onChange(v as RadarFilters["mode"])}>
      <SelectTrigger
        aria-label="Mode d'alerte"
        className="h-9 w-auto shrink-0 gap-2 rounded-xl border-black/10 bg-white/70 px-3 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300"
      >
        <SelectValue>Mode d'alerte : {current}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="w-72">
        {OPTIONS.map((o) => (
          <SelectItem key={o.id} value={o.id} className="text-xs">
            <span className="font-medium">{o.label}</span>
            {o.hint && (
              <span className="mt-0.5 block text-zinc-500 dark:text-zinc-400">{o.hint}</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
