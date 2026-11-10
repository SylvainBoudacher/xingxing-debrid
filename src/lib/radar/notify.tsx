import { RadarToastCard } from "@/components/radar/RadarToastCard";
import { toast } from "sonner";
import type { RadarAlert, RadarEntry } from "./types";
import { radarToastContent } from "./view";

const DURATION_MS = { full: 12_000, partial: 8_000 };

export function notifyRadar(
  items: { entry: RadarEntry; alert: RadarAlert }[],
  onOpen?: () => void,
): void {
  const content = radarToastContent(items);
  if (!content) return;
  toast.custom(
    (id) => (
      <RadarToastCard
        content={content}
        onOpen={
          onOpen &&
          (() => {
            toast.dismiss(id);
            onOpen();
          })
        }
      />
    ),
    {
      duration: DURATION_MS[content.level],
      unstyled: true,
      classNames: { toast: "!bg-transparent !border-0 !p-0 !shadow-none" },
    },
  );
}
