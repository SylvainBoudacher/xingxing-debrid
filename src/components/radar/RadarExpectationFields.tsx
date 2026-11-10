import { RadarChipGroup } from "@/components/radar/RadarChipGroup";
import type {
  ExpectedLanguage,
  ExpectedResolution,
  RadarExpectation,
  RadarMode,
} from "@/lib/radar/types";
import type { ReactNode } from "react";

const LANGUAGES: [ExpectedLanguage, string][] = [
  ["vf", "VF"],
  ["vostfr", "VOSTFR"],
  ["any", "Peu importe"],
];
const RESOLUTIONS: [ExpectedResolution, string][] = [
  ["720p", "720p"],
  ["1080p", "1080p"],
  ["2160p", "2160p"],
  ["any", "Peu importe"],
];
const MODES: [RadarMode, string][] = [
  ["soft", "Souple"],
  ["strict", "Strict"],
];

const MODE_HINTS: Record<RadarMode, string> = {
  soft: "Une autre version du même contenu donne une mi-alerte.",
  strict: "Seule la version attendue déclenche une alerte.",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      {children}
    </div>
  );
}

interface RadarExpectationFieldsProps {
  value: RadarExpectation;
  onChange: (value: RadarExpectation) => void;
}

export function RadarExpectationFields({ value, onChange }: RadarExpectationFieldsProps) {
  return (
    <div className="space-y-3">
      <Field label="Langue attendue">
        <RadarChipGroup
          options={LANGUAGES}
          active={value.language}
          onSelect={(language) => onChange({ ...value, language })}
        />
      </Field>
      <Field label="Résolution minimale">
        <RadarChipGroup
          options={RESOLUTIONS}
          active={value.resolution}
          onSelect={(resolution) => onChange({ ...value, resolution })}
        />
      </Field>
      <Field label="Mode d'alerte">
        <RadarChipGroup
          options={MODES}
          active={value.mode}
          onSelect={(mode) => onChange({ ...value, mode })}
        />
        <p className="text-xs text-zinc-500">{MODE_HINTS[value.mode]}</p>
      </Field>
    </div>
  );
}
