import type { RadarStatus } from "@/lib/radar/view";

export const STATUS_RING: Record<RadarStatus, string> = {
  released: "ring-emerald-500",
  partial: "ring-amber-500",
  waiting: "ring-black/10 dark:ring-white/10",
  finished: "ring-black/10 dark:ring-white/10",
};
