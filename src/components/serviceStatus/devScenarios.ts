import { diagnoseAllDebrid, diagnoseC411 } from "@/lib/serviceDiagnosis";
import type { simulateHealth } from "@/lib/serviceHealth";

// Pannes simulables depuis le menu DEV de la page de statut. Les messages
// viennent des vraies fonctions de diagnostic.
export const DEV_SCENARIOS: { label: string; sim: Parameters<typeof simulateHealth>[0] }[] = [
  {
    label: "C411 en panne",
    sim: {
      internet: true,
      services: {
        C411: diagnoseC411({ internet: true, statusPage: "outage", api: "unreachable" }),
      },
      failMonitors: true,
    },
  },
  {
    label: "C411 injoignable (page de statut aussi)",
    sim: {
      internet: true,
      services: {
        C411: diagnoseC411({ internet: true, statusPage: "unreachable", api: "unreachable" }),
      },
    },
  },
  {
    label: "C411 bloqué par le FAI (DNS)",
    sim: {
      internet: true,
      services: { C411: diagnoseC411({ internet: true, statusPage: "unreachable", api: "dns" }) },
    },
  },
  {
    label: "API C411 en erreur",
    sim: {
      internet: true,
      services: { C411: diagnoseC411({ internet: true, statusPage: "ok", api: "error" }) },
    },
  },
  {
    label: "AllDebrid en panne",
    sim: {
      internet: true,
      services: { AllDebrid: diagnoseAllDebrid({ internet: true, ping: false }) },
    },
  },
  {
    label: "C411 et AllDebrid en panne",
    sim: {
      internet: true,
      services: {
        C411: diagnoseC411({ internet: true, statusPage: "outage", api: "unreachable" }),
        AllDebrid: diagnoseAllDebrid({ internet: true, ping: false }),
      },
      failMonitors: true,
    },
  },
  {
    label: "Internet coupé",
    sim: {
      internet: false,
      services: {
        C411: diagnoseC411({ internet: false, statusPage: "unreachable", api: "unreachable" }),
        AllDebrid: diagnoseAllDebrid({ internet: false, ping: false }),
      },
    },
  },
];
