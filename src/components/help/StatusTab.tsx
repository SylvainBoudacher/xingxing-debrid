import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Activity, ExternalLink } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { stagger } from "@/components/setup/motionVariants";
import { MonitorRow } from "@/components/serviceStatus/MonitorRow";
import { RefreshButton } from "@/components/serviceStatus/RefreshButton";
import { StatusDevMenu } from "@/components/serviceStatus/StatusDevMenu";
import { ServiceStatusCard } from "@/components/serviceStatus/ServiceStatusCard";
import { StatusSummary } from "@/components/serviceStatus/StatusSummary";
import { checkAllServices, type HealthState } from "@/lib/serviceHealth";
import { MONITORED_SERVICES } from "@/lib/serviceDiagnosis";
import { useServiceHealth } from "@/lib/useServiceHealth";

function summarize(h: HealthState) {
  const all = MONITORED_SERVICES.map((s) => h.services[s]);
  if (all.every((s) => s.status === "unknown"))
    return {
      tone: "checking" as const,
      title: "Vérification en cours...",
      detail: "Test de votre connexion, de C411 et d'AllDebrid.",
    };
  if (h.internet === false)
    return {
      tone: "down" as const,
      title: "Votre connexion internet semble coupée",
      detail: "Aucun service ne peut être joint tant qu'elle n'est pas rétablie.",
    };
  const down = MONITORED_SERVICES.filter((s) => h.services[s].status === "down");
  if (down.length > 0)
    return {
      tone: "down" as const,
      title: `Problème détecté sur ${down.join(" et ")}`,
      detail: h.services[down[0]].message ?? "",
    };
  return {
    tone: "ok" as const,
    title: "Tous les services fonctionnent",
    detail: "Votre connexion, C411 et AllDebrid répondent normalement.",
  };
}

export function StatusTab() {
  const health = useServiceHealth();
  const [now, setNow] = useState(Date.now);
  const checking = MONITORED_SERVICES.some((s) => health.services[s].checking);

  // Vérification à l'ouverture (services pas vérifiés récemment), ensuite
  // uniquement à la main. L'horloge ne sert qu'aux "Vérifié il y a X s".
  useEffect(() => {
    void checkAllServices();
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const summary = summarize(health);
  const { C411: c411, AllDebrid: ad } = health.services;
  const internetTone = health.internet === null ? "unknown" : health.internet ? "ok" : "down";

  return (
    <SettingsPanel
      icon={Activity}
      title="État des services"
      subtitle="Savoir d'où vient un problème : votre connexion, C411 ou AllDebrid."
    >
      <div className="mb-4 flex items-center justify-end gap-2">
        {import.meta.env.DEV && <StatusDevMenu />}
        <RefreshButton checking={checking} onRefresh={() => void checkAllServices(true)} />
      </div>

      <StatusSummary {...summary} />

      <motion.div initial="hidden" animate="visible" variants={stagger} className="mt-5 space-y-3">
        <ServiceStatusCard
          name="Votre connexion"
          description="Accès à internet depuis cet appareil."
          tone={internetTone}
          checking={checking}
          message="Vérifiez votre Wi-Fi ou votre câble, puis réessayez."
          now={now}
        />

        <ServiceStatusCard
          name="C411"
          description="Recherche et téléchargement des torrents."
          tone={c411.status}
          checking={c411.checking}
          message={c411.message}
          checkedAt={c411.checkedAt}
          latencyMs={c411.latencyMs}
          now={now}
        >
          {health.c411Monitors.map((m) => (
            <MonitorRow key={m.key} label={m.label} samples={m.results} />
          ))}
          <button
            onClick={() => openUrl("https://status.c411.org/")}
            className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Voir la page de statut officielle de C411
            <ExternalLink className="h-3 w-3" />
          </button>
        </ServiceStatusCard>

        <ServiceStatusCard
          name="AllDebrid"
          description="Débridage des torrents et liens de lecture."
          tone={ad.status}
          checking={ad.checking}
          message={ad.message}
          checkedAt={ad.checkedAt}
          latencyMs={ad.latencyMs}
          now={now}
        />
      </motion.div>
    </SettingsPanel>
  );
}
