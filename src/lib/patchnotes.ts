export interface PatchNote {
  version: string;
  date: string;
  sections: { title: string; items: string[] }[];
}

export const PATCH_NOTES: PatchNote[] = [
  {
    version: "0.2",
    date: "11 juin 2026",
    sections: [
      {
        title: "Nouveau système de paramètres",
        items: [
          "Nouvelle page Paramètres accessible depuis le menu, avec son fond quadrillé distinctif.",
          "Choix de l'affichage des titres : vue simplifiée (titre reformaté, qualité et codec en labels) ou vue détaillée (nom de fichier brut).",
          "Les clés API C411 et AllDebrid se gèrent désormais directement dans les Paramètres.",
        ],
      },
      {
        title: "Page Magnets",
        items: [
          "Confirmation avant la suppression d'un magnet, et bouton pour supprimer d'un coup tous les magnets en erreur.",
          "Mode sélection multiple pour télécharger plusieurs magnets à la fois.",
          "Bouton \"Tout télécharger\" dans la fenêtre des fichiers pour récupérer une série entière en une fois.",
          "\"Lire avec VLC\" n'apparaît plus que pour les fichiers vidéo.",
          "Mise en page modernisée : contenu centré, header fixe, filtres par statut et recherche.",
        ],
      },
      {
        title: "Autres améliorations",
        items: [
          "Welcome page entièrement repensée en deux étapes : présentation du logiciel puis configuration des clés.",
          "Recherche plus fluide : animations optimisées et retour à l'accueil retravaillé.",
          "Menus harmonisés sur toutes les pages, avec retour rapide à l'accueil.",
        ],
      },
    ],
  },
];

export const LATEST_VERSION = PATCH_NOTES[0].version;
