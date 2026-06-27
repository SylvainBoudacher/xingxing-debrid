import {
  Compass,
  Download,
  KeyRound,
  Layers,
  Library,
  Magnet,
  Monitor,
  Sparkles,
  Sun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PanelId =
  | "appearance"
  | "api-keys"
  | "display"
  | "magnets"
  | "downloads"
  | "library"
  | "nyaa"
  | "discover"
  | "summer";

export type PanelAccent = "indigo" | "amber";

export interface SettingsNavItem {
  id: PanelId;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  accent?: PanelAccent;
}

export interface SettingsNavGroup {
  id: string;
  label: string;
  items: SettingsNavItem[];
}

export const SETTINGS_GROUPS: SettingsNavGroup[] = [
  {
    id: "general",
    label: "Général",
    items: [
      {
        id: "appearance",
        label: "Apparence et fenêtre",
        subtitle: "Taille de la fenêtre au lancement.",
        icon: Monitor,
      },
      {
        id: "api-keys",
        label: "Comptes et clés API",
        subtitle: "Les clés C411 et AllDebrid utilisées par l'application.",
        icon: KeyRound,
      },
    ],
  },
  {
    id: "contenu",
    label: "Contenu",
    items: [
      {
        id: "display",
        label: "Affichage des listes",
        subtitle: "Comment les noms de release s'affichent partout dans l'app.",
        icon: Layers,
      },
      {
        id: "magnets",
        label: "Magnets et fichiers",
        subtitle: "Filtrage des fichiers .nfo et suppression.",
        icon: Magnet,
      },
      {
        id: "downloads",
        label: "Téléchargement",
        subtitle: "Dossier de destination et fichiers simultanés.",
        icon: Download,
      },
      {
        id: "library",
        label: "Bibliothèque",
        subtitle: "Marquage automatique des contenus vus.",
        icon: Library,
      },
      {
        id: "nyaa",
        label: "Nyaa",
        subtitle: "Préremplissage des filtres de recherche Nyaa.",
        icon: Sparkles,
      },
      {
        id: "discover",
        label: "Découverte et listes",
        subtitle: "Sauvegarde et restauration de votre liste.",
        icon: Compass,
      },
    ],
  },
  {
    id: "extras",
    label: "Extras",
    items: [
      {
        id: "summer",
        label: "Summer et canards",
        subtitle: "Petits plaisirs estivaux dans l'application.",
        icon: Sun,
        accent: "amber",
      },
    ],
  },
];

export const ALL_NAV_ITEMS: SettingsNavItem[] = SETTINGS_GROUPS.flatMap((g) => g.items);
