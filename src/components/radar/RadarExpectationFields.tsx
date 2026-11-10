import { RadarOptionTiles } from "@/components/radar/RadarOptionTiles";
import {
  LANGUAGE_OPTIONS,
  MODE_OPTIONS,
  RESOLUTION_OPTIONS,
} from "@/components/radar/expectationOptions";
import { expectationSummary } from "@/lib/radar/labels";
import type { RadarExpectation } from "@/lib/radar/types";
import { Radar } from "lucide-react";

interface RadarExpectationFieldsProps {
  value: RadarExpectation;
  onChange: (value: RadarExpectation) => void;
}

export function RadarExpectationFields({ value, onChange }: RadarExpectationFieldsProps) {
  return (
    <div className="space-y-3">
      <RadarOptionTiles
        label="Dans quelle langue ?"
        options={LANGUAGE_OPTIONS}
        value={value.language}
        onChange={(language) => onChange({ ...value, language })}
        columns={3}
      />
      <RadarOptionTiles
        label="Quelle qualité minimum ?"
        options={RESOLUTION_OPTIONS}
        value={value.resolution}
        onChange={(resolution) => onChange({ ...value, resolution })}
        columns={4}
      />
      <RadarOptionTiles
        label="Si une autre version sort ?"
        options={MODE_OPTIONS}
        value={value.mode}
        onChange={(mode) => onChange({ ...value, mode })}
        columns={2}
      />
      <p className="flex min-h-14 items-start gap-2 rounded-xl bg-indigo-500/10 px-3 py-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-200">
        <Radar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500 dark:text-indigo-300" />
        {expectationSummary(value)}
      </p>
    </div>
  );
}
