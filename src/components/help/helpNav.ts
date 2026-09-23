import {
  CircleAlert,
  KeyRound,
  Lightbulb,
  MonitorPlay,
  Route,
  Wifi,
  type LucideIcon,
} from "lucide-react";

export type HelpPanelId = "how" | "journey" | "keys" | "dns" | "vlc" | "errors";

export interface HelpNavItem {
  id: HelpPanelId;
  label: string;
  subtitle: string;
  icon: LucideIcon;
}

export const HELP_GROUPS: { id: string; label: string; items: HelpNavItem[] }[] = [
  {
    id: "start",
    label: "Prise en main",
    items: [
      {
        id: "how",
        label: "Comment ça marche",
        subtitle: "Les trois services sur lesquels s'appuie l'application.",
        icon: Lightbulb,
      },
      {
        id: "journey",
        label: "Le parcours d'un film",
        subtitle: "De la recherche à la lecture, étape par étape.",
        icon: Route,
      },
      {
        id: "keys",
        label: "Récupérer ses clés API",
        subtitle: "Où trouver les clés C411, AllDebrid et TMDB.",
        icon: KeyRound,
      },
    ],
  },
  {
    id: "troubleshoot",
    label: "Dépannage",
    items: [
      {
        id: "dns",
        label: "Configurer le DNS",
        subtitle: "Vérifier l'accès à C411 et changer de DNS si besoin.",
        icon: Wifi,
      },
      {
        id: "vlc",
        label: "Lecteur VLC",
        subtitle: "Vérifier que VLC est installé et trouvé par l'application.",
        icon: MonitorPlay,
      },
      {
        id: "errors",
        label: "Erreurs fréquentes",
        subtitle: "Ce que veulent dire les messages d'erreur, et quoi faire.",
        icon: CircleAlert,
      },
    ],
  },
];

export const HELP_NAV_ITEMS: HelpNavItem[] = HELP_GROUPS.flatMap((g) => g.items);
