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
          "La recherche affiche désormais tous les résultats disponibles, pas seulement les premiers : un bouton \"Charger plus\" permet de voir la suite, avec un compteur pour savoir où vous en êtes (ex. 50 résultats affichés sur 230).",
        ],
      },
      {
        title: "Filtres et tri",
        items: [
          "Triez les résultats par type de contenu : Films, Séries, Musique, Logiciels & Jeux ou Livres, avec le nombre de résultats pour chaque type.",
          "Filtrez par qualité d'image (4K, 1080p, 720p...) : l'application la détecte automatiquement pour vous. Pour les connaisseurs, un filtre par format vidéo (H265, X264...) est aussi disponible.",
          "Classez les résultats comme vous voulez : du plus populaire au moins populaire, du plus gros au plus petit fichier, ou du plus récent au plus ancien.",
          "Tous ces filtres peuvent se combiner et le résultat s'affiche instantanément.",
        ],
      },
      {
        title: "Affichage de la recherche",
        items: [
          "Nouveau choix dans les Paramètres : afficher les résultats avec des titres clairs et lisibles (recommandé), ou avec le nom de fichier complet d'origine pour ceux qui préfèrent tout voir.",
        ],
      },
      {
        title: "Vos clés mieux protégées",
        items: [
          "Vos clés C411 et AllDebrid sont maintenant rangées dans le coffre-fort sécurisé de votre ordinateur (le même endroit où sont protégés vos mots de passe), et non plus dans un simple fichier. Vous n'avez rien à faire : le transfert se fait tout seul au lancement de l'application.",
          "Vos clés sont aussi mieux protégées pendant l'utilisation : elles ne peuvent plus apparaître dans un message d'erreur à l'écran.",
        ],
      },
    ],
  },
  {
    version: "0.2",
    date: "11 juin 2026",
    sections: [
      {
        title: "Nouvelle page Paramètres",
        items: [
          "Une page Paramètres accessible depuis le menu pour régler l'application à votre goût.",
          "Choisissez comment afficher les titres : version claire et lisible, ou nom de fichier complet d'origine.",
          "Vos clés C411 et AllDebrid peuvent désormais être modifiées directement dans les Paramètres.",
        ],
      },
      {
        title: "Page Magnets",
        items: [
          "L'application demande confirmation avant de supprimer un téléchargement, et un bouton permet de nettoyer d'un coup tous ceux qui ont échoué.",
          "Sélectionnez plusieurs éléments à la fois pour les télécharger ensemble.",
          "Un bouton \"Tout télécharger\" permet de récupérer une série entière en un seul clic.",
          "Le bouton \"Lire avec VLC\" n'apparaît plus que pour les vidéos.",
          "Présentation améliorée : contenu centré, barre du haut toujours visible, recherche et filtres par état (en cours, terminé, en erreur).",
        ],
      },
      {
        title: "Autres améliorations",
        items: [
          "La page de bienvenue a été repensée en deux étapes simples : découverte du logiciel, puis configuration de vos clés.",
          "Navigation plus fluide et plus agréable, avec un retour à l'accueil depuis toutes les pages.",
        ],
      },
    ],
  },
];

export const LATEST_VERSION = PATCH_NOTES[0].version;
