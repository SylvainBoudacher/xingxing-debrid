export type DayPhase = "matin" | "jour" | "soir" | "nuit";

export interface Lighting {
  phase: DayPhase;
  sun: string;
  sunIntensity: number;
  sky: string;
  ground: string;
  hemi: number;
  fog: string;
  lanterns: boolean;
}

const DAY = { sky: "#b8c8e8", ground: "#5a4430", lanterns: false };

const PHASES: Record<DayPhase, Lighting> = {
  matin: { phase: "matin", sun: "#ffe6c8", sunIntensity: 1.8, hemi: 1.0, fog: "#d8d0c0", ...DAY },
  jour: { phase: "jour", sun: "#fff2dc", sunIntensity: 2.6, hemi: 1.2, fog: "#d0c8a8", ...DAY },
  soir: { phase: "soir", sun: "#ffd8a0", sunIntensity: 2.6, hemi: 1.1, fog: "#c9b892", ...DAY },
  nuit: {
    phase: "nuit",
    sun: "#a8bce8",
    sunIntensity: 1.3,
    hemi: 0.95,
    fog: "#34405e",
    sky: "#7080b0",
    ground: "#3a3040",
    lanterns: true,
  },
};

export function lightingAt(hour: number): Lighting {
  if (hour >= 6 && hour < 10) return PHASES.matin;
  if (hour >= 10 && hour < 17) return PHASES.jour;
  if (hour >= 17 && hour < 20) return PHASES.soir;
  return PHASES.nuit;
}
