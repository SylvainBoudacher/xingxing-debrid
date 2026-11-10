import { toast } from "sonner";
import type { RadarAlert, RadarEntry } from "./types";
import { summarizeAlerts } from "./view";

export function notifyRadar(
  items: { entry: RadarEntry; alert: RadarAlert }[],
  onOpen?: () => void,
): void {
  const summary = summarizeAlerts(items);
  if (!summary) return;
  const options = onOpen ? { action: { label: "Voir", onClick: onOpen } } : undefined;
  if (summary.level === "full") toast.success(summary.text, options);
  else toast.info(summary.text, options);
}
