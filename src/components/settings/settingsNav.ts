import {
  ArchiveRestore,
  Download,
  Keyboard,
  KeyRound,
  Layers,
  Library,
  Magnet,
  Monitor,
  MonitorPlay,
  Sparkles,
  Sun,
  ZoomIn,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PanelId =
  | "appearance"
  | "text-scale"
  | "api-keys"
  | "shortcuts"
  | "display"
  | "magnets"
  | "playback"
  | "downloads"
  | "library"
  | "nyaa"
  | "backup-transfer"
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

const ALL_SETTINGS_GROUPS: SettingsNavGroup[] = [
  {
    id: "interface",
    label: "Interface",
    items: [
      {
        id: "appearance",
        label: "Apparence et fenêtre",
        subtitle: "Taille de la fenêtre et page d'ouverture au lancement.",
        icon: Monitor,
      },
      {
        id: "text-scale",
        label: "Taille de l'interface",
        subtitle: "Ajuster la taille de toute l'application.",
        icon: ZoomIn,
      },
      {
        id: "display",
        label: "Affichage des listes",
        subtitle: "Comment les noms de release s'affichent partout dans l'app.",
        icon: Layers,
      },
      {
        id: "shortcuts",
        label: "Raccourcis clavier",
        subtitle: "Naviguer entre les pages et agir sur le bassin au clavier.",
        icon: Keyboard,
      },
    ],
  },
  {
    id: "sources",
    label: "Sources",
    items: [
      {
        id: "api-keys",
        label: "Comptes et clés API",
        subtitle: "Les clés C411, AllDebrid et TMDB utilisées par l'application.",
        icon: KeyRound,
      },
      {
        id: "nyaa",
        label: "Nyaa",
        subtitle: "Préremplissage des filtres de recherche Nyaa.",
        icon: Sparkles,
      },
    ],
  },
  {
    id: "files",
    label: "Fichiers et lecture",
    items: [
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
        id: "playback",
        label: "Lecture",
        subtitle: "Le lecteur utilisé pour ouvrir les vidéos.",
        icon: MonitorPlay,
      },
      {
        id: "library",
        label: "Bibliothèque",
        subtitle: "Marquage automatique des contenus vus.",
        icon: Library,
      },
    ],
  },
  {
    id: "data",
    label: "Données",
    items: [
      {
        id: "backup-transfer",
        label: "Sauvegarde et transfert",
        subtitle: "Exporter et importer votre profil, votre bibliothèque et votre liste.",
        icon: ArchiveRestore,
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

// Le chemin de VLC se regle sur Windows et macOS ; Linux passe par le PATH.
const hasVlcPathSetting =
  navigator.userAgent.includes("Windows") || navigator.userAgent.includes("Mac");

export const SETTINGS_GROUPS: SettingsNavGroup[] = ALL_SETTINGS_GROUPS.map((g) => ({
  ...g,
  items: g.items.filter((i) => i.id !== "playback" || hasVlcPathSetting),
}));

export const ALL_NAV_ITEMS: SettingsNavItem[] = SETTINGS_GROUPS.flatMap((g) => g.items);
