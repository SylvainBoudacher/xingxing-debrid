export interface PatchNote {
  version: string;
  date: string;
  sections: { title: string; items: string[] }[];
}

export const PATCH_NOTES: PatchNote[] = [
  {
    version: "0.3",
    date: "11 juin 2026",
    sections: [
      {
        title: "Recherche complète",
        items: [
          "La recherche ne s'arrête plus à la première page : un bouton \"Charger plus\" récupère la suite des résultats, avec un compteur indiquant la progression (ex. 50 / 230).",
        ],
      },
      {
        title: "Filtres et tri",
        items: [
          "Filtres par catégorie (Films, Séries, Musique, Logiciels & Jeux, Livres) avec le nombre de résultats par catégorie.",
          "Filtres par qualité (4K, 2160p, 1080p, 720p...) et par encodage (H265, X264...), détectés automatiquement dans les résultats.",
          "Tri par pertinence, seeders, taille ou date, en ordre croissant ou décroissant.",
          "Les filtres se combinent et s'appliquent instantanément, avec des animations fluides lors du filtrage et du tri.",
        ],
      },
      {
        title: "Affichage de la recherche",
        items: [
          "Nouveau paramètre \"Affichage de la recherche\" : vue simplifiée des résultats (titre reformaté, qualité et codec en labels) ou vue détaillée (nom brut), comme pour les titres des Magnets.",
        ],
      },
    ],
  },
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
