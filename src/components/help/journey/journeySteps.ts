import { Download, Library, Search, type LucideIcon } from "lucide-react";

export interface JourneyStep {
  icon: LucideIcon;
  title: string;
  text: string;
}

export const JOURNEY_STEPS: JourneyStep[] = [
  {
    icon: Search,
    title: "Rechercher",
    text: `Tapez un titre sur l'accueil, ou parcourez la page Découverte pour trouver une idée. Choisissez ensuite une version dans la liste : vous pouvez la trier par seeders, taille ou date.`,
  },
  {
    icon: Library,
    title: "Ajouter",
    text: `En choisissant une version, deux choses se passent en même temps : le film rejoint Ma bibliothèque, et AllDebrid récupère le fichier de son côté. Vous suivez l'avancement dans la page Magnets.`,
  },
  {
    icon: Download,
    title: "Regarder ou télécharger",
    text: `Une fois le fichier prêt, à vous de choisir : le regarder tout de suite en streaming avec VLC, sans attendre, ou télécharger le fichier dans le dossier choisi dans les paramètres.`,
  },
];
