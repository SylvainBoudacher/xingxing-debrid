import type { Grade } from "../core/types";

export const SOW_LABEL: Record<Grade, string> = { parfait: "Parfait", bien: "Bon", rate: "Raté" };

export function formatDuration(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`;
}
