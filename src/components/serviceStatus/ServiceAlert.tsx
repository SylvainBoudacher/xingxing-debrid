import { AnimatePresence } from "motion/react";
import { ServiceAlertPill } from "./ServiceAlertPill";
import { openHelpPanel } from "@/lib/helpNavigation";
import { CAUSE_LABELS, MONITORED_SERVICES } from "@/lib/serviceDiagnosis";
import { useServiceHealth } from "@/lib/useServiceHealth";

// Label en haut à droite, visible seulement quand C411 ou AllDebrid a un
// problème confirmé. Un clic ouvre l'état des services dans l'Aide.
export function ServiceAlert() {
  const { services } = useServiceHealth();
  const down = MONITORED_SERVICES.filter((s) => services[s].status === "down");
  const offline = down.length > 0 && down.every((s) => services[s].cause === "internet");
  const open = () => openHelpPanel("status");

  return (
    <div className="pointer-events-none fixed top-[68px] right-4 z-[55] flex flex-col items-end gap-2">
      <AnimatePresence>
        {offline ? (
          <ServiceAlertPill
            key="internet"
            title="Internet"
            label={CAUSE_LABELS.internet}
            message={services[down[0]].message}
            since={services[down[0]].since}
            checking={down.some((s) => services[s].checking)}
            onClick={open}
          />
        ) : (
          down.map((s) => {
            const h = services[s];
            return (
              <ServiceAlertPill
                key={s}
                title={s}
                label={h.cause ? CAUSE_LABELS[h.cause] : "Problème détecté"}
                message={h.message}
                since={h.since}
                checking={h.checking}
                onClick={open}
              />
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
}
