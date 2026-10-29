import type { Availability } from "@/lib/releasePicks";

export const AVAILABILITY: Record<Availability, { label: string; dot: string }> = {
  fast: { label: "rapide", dot: "bg-green-500" },
  ok: { label: "correcte", dot: "bg-amber-400" },
  slow: { label: "lente", dot: "bg-rose-500" },
};
