export interface PatchNoteImage {
  src: string; // fichier dans public/patchnotes/, ex: "/patchnotes/discover.png"
  caption?: string;
}

export interface PatchNoteSection {
  title: string;
  items: string[];
  images?: PatchNoteImage[];
}

export interface PatchNote {
  version: string;
  date: string;
  intro?: string;
  sections: PatchNoteSection[];
}

export const PATCH_NOTES: PatchNote[] = [
  {
    version: "1.0",
    date: "11 juin 2026",
    intro:
      "L'application passe en version 1.0 ! Au programme : une toute nouvelle page Découvrir pour explorer films et séries, une liste de favoris, un mode sombre, et une interface entièrement repensée.",
    sections: [
      {
        title: "Nouvelle page Découvrir",
        items: [
          "Explorez les films, séries et animations les mieux notés grâce au catalogue TMDB, avec affiches, notes et résumés.",
          "Recherchez n'importe quel titre et trouvez en un clic les releases disponibles sur C411, sans quitter la page.",
          "Triez et filtrez le catalogue pour trouver exactement ce que vous cherchez.",
        ],
        images: [
          { src: "/patchnotes/v1-discover.png", caption: "La page Découvrir avec le catalogue TMDB" },
        ],
      },
      {
        title: "Ma liste",
        items: [
          "Ajoutez vos films et séries en favoris d'un simple clic sur le cœur.",
          "Retrouvez-les à tout moment dans l'onglet \"Ma liste\" de la page Découvrir, avec leur résumé.",
        ],
        images: [
          { src: "/patchnotes/v1-likes.png", caption: "Vos favoris regroupés dans Ma liste" },
        ],
      },
      {
        title: "Mode sombre",
        items: [
          "Passez du mode clair au mode sombre depuis le menu, sur toutes les pages de l'application.",
          "L'ensemble de l'interface a été harmonisé pour être agréable dans les deux modes.",
        ],
        images: [
          { src: "/patchnotes/v1-dark-mode.png", caption: "L'application en mode sombre" },
        ],
      },
      {
        title: "Fichiers .nfo",
        items: [
          "Deux nouvelles options dans les Paramètres : masquer les fichiers .nfo dans les listes, et ne pas les télécharger. Les deux sont activées par défaut.",
        ],
      },
      {
        title: "Première configuration repensée",
        items: [
          "La page de bienvenue a été entièrement revue, avec des animations et des explications pas à pas pour chaque clé.",
          "Une clé TMDB (gratuite et optionnelle) peut être ajoutée pour activer la page Découvrir.",
        ],
        images: [
          { src: "/patchnotes/v1-setup.png", caption: "Le nouvel écran de bienvenue" },
        ],
      },
      {
        title: "Interface et confort",
        items: [
          "Animations et transitions plus fluides sur toutes les pages.",
          "Les Paramètres disposent d'un sommaire qui suit votre lecture.",
          "Navigation harmonisée : le menu donne accès à l'Accueil, Découvrir, Magnets et Paramètres depuis n'importe quelle page.",
        ],
      },
    ],
  },
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
