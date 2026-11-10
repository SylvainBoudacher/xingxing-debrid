import { MODE_HINTS } from "@/lib/radar/labels";
import type { ExpectedLanguage, ExpectedResolution, RadarMode } from "@/lib/radar/types";

export interface RadarOption<T extends string> {
  id: T;
  label: string;
  hint: string;
}

export const LANGUAGE_OPTIONS: RadarOption<ExpectedLanguage>[] = [
  { id: "vf", label: "VF", hint: "Doublé en français" },
  { id: "vostfr", label: "VOSTFR", hint: "Sous-titré en français" },
  { id: "any", label: "Peu importe", hint: "Toutes les langues" },
];

export const RESOLUTION_OPTIONS: RadarOption<ExpectedResolution>[] = [
  { id: "720p", label: "720p", hint: "HD" },
  { id: "1080p", label: "1080p", hint: "Full HD" },
  { id: "2160p", label: "2160p", hint: "4K" },
  { id: "any", label: "Toutes", hint: "Sans minimum" },
];

export const MODE_OPTIONS: RadarOption<RadarMode>[] = [
  { id: "soft", label: "Souple", hint: MODE_HINTS.soft },
  { id: "strict", label: "Strict", hint: MODE_HINTS.strict },
];
