import type { HelpPanelId } from "./helpNav";

export interface HelpError {
  message: string;
  why: string;
  fix: string;
  link?: { panel: HelpPanelId; label: string };
}

export const HELP_ERRORS: HelpError[] = [
  {
    message: '"C411 ne répond pas" ou "Impossible de joindre C411"',
    why: "Le plus souvent, votre opérateur bloque C411 au niveau du DNS : le site paraît hors ligne alors qu'il fonctionne.",
    fix: "Lancez le test de connexion, puis changez de DNS si le test échoue.",
    link: { panel: "dns", label: "Configurer le DNS" },
  },
  {
    message: '"Cette clé semble incorrecte"',
    why: "La clé a été mal copiée (un espace en trop, un caractère manquant), ou elle a été supprimée ou régénérée sur le site du service.",
    fix: "Récupérez une nouvelle clé sur le site du service et remplacez l'ancienne dans les paramètres.",
    link: { panel: "keys", label: "Récupérer ses clés API" },
  },
  {
    message: '"AllDebrid a renvoyé une erreur" ou "Clé AllDebrid manquante"',
    why: "Votre abonnement AllDebrid a peut-être expiré, une limite du compte est atteinte, ou aucune clé n'est enregistrée.",
    fix: "Vérifiez l'état de votre abonnement sur alldebrid.fr, puis votre clé dans les paramètres.",
    link: { panel: "keys", label: "Récupérer ses clés API" },
  },
  {
    message: '"Aucun résultat"',
    why: "C411 ne trouve rien qui corresponde exactement à votre recherche.",
    fix: "Vérifiez l'orthographe, essayez le titre original (souvent en anglais) ou un autre mode de recherche, et retirez l'année ou la saison.",
  },
  {
    message: "La vidéo ne se lance pas",
    why: "VLC n'est pas installé, ou XingXing ne sait pas où il se trouve.",
    fix: "Vérifiez la détection de VLC et indiquez son emplacement si besoin.",
    link: { panel: "vlc", label: "Lecteur VLC" },
  },
];
