import nyaaPatchImg from "@/assets/patchnote/v1.2/nyaa.webp";
import shopPatchImg from "@/assets/patchnote/v1.2/shop.webp";
import mainPageImg from "@/assets/patchnote/v1.1/mainPage.webp";
import discoverImg from "@/assets/patchnote/v1.0/discover-with-IMDB.webp";
import paramsImg from "@/assets/patchnote/v1.0/params.webp";
import themeImg from "@/assets/patchnote/v1.0/theme.webp";
import torrentFilterImg from "@/assets/patchnote/v1.0/torrent-filter.webp";

export interface PatchNoteImage {
  src: string; // image importée depuis src/assets/patchnote/
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
  introImage?: PatchNoteImage;
  sections: PatchNoteSection[];
}

export const PATCH_NOTES: PatchNote[] = [
  {
    version: "1.2.0",
    date: "24 juin 2026",
    intro:
      "Deux grandes nouveautes : une nouvelle source de recherche Nyaa avec ses filtres dedies, et le Coin des Canards pour adopter, nommer et collectionner vos canards.",
    sections: [
      {
        title: "Nouvelle source de recherche : Nyaa",
        items: [
          "En plus de C411, vous pouvez desormais rechercher directement sur nyaa.si. Une bascule sous la barre de recherche permet de choisir la source.",
          "Des filtres dedies affinent vos recherches Nyaa : team, qualite (2160p, 1080p, 720p, 480p), codec (x265, x264, hevc, av1) et langue (vostfr, vost, multi, truefrench, french, vf).",
          "Vos filtres Nyaa par defaut sont configurables dans les Preferences pour les retrouver automatiquement a chaque recherche.",
        ],
        images: [{ src: nyaaPatchImg, caption: "La recherche Nyaa et ses filtres dedies" }],
      },
      {
        title: "Le Coin des Canards",
        items: [
          "Un petit stand est apparu en bas a gauche de la piscine. Attrapez un canard et deposez-le dedans pour lui donner un nom et l'enregistrer.",
          "Vos canards enregistres reviennent nager automatiquement a chaque ouverture de l'application.",
          "Survolez un canard nomme pour afficher son nom au-dessus de lui.",
          "Gerez votre collection depuis le stand : renommer, relacher dans la piscine, ou supprimer un canard.",
          "Les canards enregistres sont proteges : impossible de les jeter dans le siphon par accident.",
        ],
        images: [{ src: shopPatchImg, caption: "Le Coin des Canards et votre collection" }],
      },
      {
        title: "Des canards uniques",
        items: [
          "L'apparence des canards est desormais generee aleatoirement a chaque apparition, avec de vraies raretes : couleurs, accessoires, motifs et canards legendaires.",
        ],
      },
      {
        title: "Import / Export",
        items: [
          "Sauvegardez ou restaurez votre collection de canards dans un fichier JSON depuis les parametres Summer.",
        ],
      },
    ],
  },
  {
    version: "1.1.4",
    date: "23 juin 2026",
    intro:
      "Corrections visuelles et amelioration du comportement de la notification de mise a jour.",
    sections: [
      {
        title: "Corrections",
        items: [
          "Le positionnement du halo sur les accessoires de canard a ete ajuste pour un meilleur alignement visuel.",
          "La dialog de mise a jour n'apparait plus avant que l'application soit completement chargee.",
        ],
      },
    ],
  },
  {
    version: "1.1.3",
    date: "23 juin 2026",
    intro: "Version de test du systeme de mise a jour automatique sur Windows.",
    sections: [
      {
        title: "Test mise a jour automatique",
        items: [
          "Verification que l'installation via le systeme integre fonctionne correctement sans passer par le .exe.",
        ],
      },
    ],
  },
  {
    version: "1.1.2",
    date: "23 juin 2026",
    intro:
      "Correction d'un bug ou la mise a jour se telechargait mais l'application ne redemarrait pas sur Windows.",
    sections: [
      {
        title: "Correction de la mise a jour automatique (Windows)",
        items: [
          "L'installeur de mise a jour tournait sans les droits necessaires sur certaines configurations Windows, causant un echec silencieux apres le telechargement.",
          "L'application se fermait correctement mais ne redemarrait jamais. Le probleme est desormais resolu.",
        ],
      },
    ],
  },
  {
    version: "1.1.1",
    date: "23 juin 2026",
    intro:
      "Cette mise à jour introduit le systeme de mise a jour automatique et apporte de nouvelles peaux de canard ainsi que des ameliorations de la physique dans la piscine.",
    sections: [
      {
        title: "Mises a jour automatiques",
        items: [
          "L'application verifie desormais automatiquement si une nouvelle version est disponible a chaque demarrage.",
          "Une notification discrete apparait en haut de l'interface lorsqu'une mise a jour est prete a etre installee - rien de force, vous choisissez quand installer.",
          "Le telechargement et l'installation se font en arriere-plan. Une fois termine, l'application vous propose de redemarrer pour appliquer la mise a jour.",
          "Plus besoin de telecharger manuellement le programme d'installation : tout se passe depuis l'interieur de l'application.",
        ],
      },
      {
        title: "Nouvelles peaux de canard",
        items: [
          "Quatre nouveaux canards font leur apparition dans la piscine : le canard pirate, le canard astronaute, le canard chef cuisinier et le canard detective.",
          "Les peaux sont selectionnees aleatoirement a chaque lancement de la piscine, pour ne jamais avoir deux fois la meme ambiance.",
        ],
      },
      {
        title: "Physique de la piscine amelioree",
        items: [
          "Les canards peuvent maintenant etre lances avec de l'elan : maintenez le clic et relacher pour propulser le canard dans la direction choisie.",
          "Les canards rebondissent desormais les uns contre les autres lors des collisions, au lieu de se traverser.",
          "De petites eclaboussures apparaissent a chaque impact contre les bords ou lors des collisions entre canards.",
          "La physique de flottaison a ete revue : les canards se balancent plus naturellement sur l'eau.",
        ],
      },
    ],
  },
  {
    version: "1.1",
    date: "23 juin 2026",
    intro:
      "La version 1.1 arrive avec une grosse mise à jour des performances : l'application démarre plus vite, consomme moins de ressources, et s'enrichit d'un nouveau paramètre inattendu — la piscine à canard. 🦆",
    introImage: {
      src: mainPageImg,
      caption: "L'interface revue en v1.1 — plus rapide, plus fluide",
    },
    sections: [
      {
        title: "Nouveau paramètre : Summer 🦆",
        items: [
          "Un nouveau paramètre \"Summer\" fait son apparition dans les Préférences. En l'activant, vous débloquez la superbe piscine à canard — une ambiance estivale unique intégrée directement dans l'interface.",
          "La piscine peut tourner à 30 FPS pour économiser les ressources, ou à 60 FPS pour une fluidité maximale. À vous de choisir selon votre machine.",
          "Cette option est bien sûr entièrement facultative et n'impacte pas les autres fonctionnalités de l'application.",
        ],
      },
      {
        title: "Loading screen & mise en cache",
        items: [
          "Un écran de chargement apparaît désormais au lancement de l'application. Ce n'est pas du remplissage : il sert à charger en avance les données les plus utilisées (catalogue, préférences, clés, magnets en cours) pour que tout soit instantané une fois arrivé sur l'accueil.",
          "Les images de la page Découvrir sont pré-chargées dès le démarrage, ce qui réduit considérablement les temps d'attente lors de la navigation.",
          "Le cache est géré intelligemment : il se renouvelle automatiquement en arrière-plan sans jamais bloquer l'interface.",
        ],
      },
      {
        title: "Optimisations de performance",
        items: [
          "L'application a été revue en profondeur pour consommer moins de mémoire et répondre plus rapidement, en particulier sur les pages avec beaucoup de résultats.",
          "Les listes de magnets et de résultats de recherche sont maintenant rendues de façon optimisée : seuls les éléments visibles à l'écran sont calculés.",
          "Les animations et transitions ont été légèrement allégées pour rester fluides même sur des configurations modestes.",
          "Plusieurs opérations qui se faisaient les unes après les autres sont maintenant exécutées en parallèle, ce qui accélère le chargement global.",
        ],
      },
      {
        title: "Corrections et stabilité",
        items: [
          "Correction d'un problème où l'application pouvait parfois se figer lors d'une perte de connexion réseau temporaire.",
          "Les messages d'erreur sont désormais plus clairs et explicatifs, surtout en cas de problème avec vos clés API.",
          "Diverses micro-corrections sur l'affichage des badges de qualité et des titres tronqués dans les listes.",
        ],
      },
    ],
  },
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
          "Une clé TMDB (gratuite et optionnelle) ajoutée lors de la configuration active cette page.",
        ],
        images: [
          {
            src: discoverImg,
            caption:
              "Le catalogue TMDB : films, séries et animations les mieux notés, avec leur note",
          },
        ],
      },
      {
        title: "Ma liste",
        items: [
          "Ajoutez vos films et séries en favoris d'un simple clic sur le cœur.",
          'Retrouvez-les à tout moment dans l\'onglet "Ma liste" de la page Découvrir, avec leur résumé.',
        ],
      },
      {
        title: "Mode sombre",
        items: [
          "Passez du mode clair au mode sombre depuis le menu, sur toutes les pages de l'application.",
          "L'ensemble de l'interface a été harmonisé pour être agréable dans les deux modes.",
        ],
        images: [{ src: themeImg, caption: "Le changement de thème, accessible depuis le menu" }],
      },
      {
        title: "Recherche plus lisible",
        items: [
          "Les résultats affichent des badges de qualité (2160P, 1080P) et de format (X265, X264, HEVC) en un coup d'oeil.",
          "Les filtres par catégorie, qualité et format se combinent avec le tri par pertinence, taille ou date.",
        ],
        images: [
          {
            src: torrentFilterImg,
            caption: "Les résultats de recherche avec leurs filtres de qualité et de format",
          },
        ],
      },
      {
        title: "Paramètres plus complets",
        items: [
          "Choisissez un affichage simplifié ou détaillé, séparément pour la recherche et pour vos magnets.",
          "Deux nouvelles options pour les fichiers .nfo : les masquer dans les listes et ne pas les télécharger. Les deux sont activées par défaut.",
          "Un sommaire suit votre lecture pour naviguer entre les sections.",
        ],
        images: [
          {
            src: paramsImg,
            caption: "La page Paramètres : affichage des résultats et gestion des fichiers .nfo",
          },
        ],
      },
      {
        title: "Interface et confort",
        items: [
          "La page de bienvenue a été entièrement revue, avec des animations et des explications pas à pas pour chaque clé.",
          "Animations et transitions plus fluides sur toutes les pages.",
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
          'La recherche affiche désormais tous les résultats disponibles, pas seulement les premiers : un bouton "Charger plus" permet de voir la suite, avec un compteur pour savoir où vous en êtes (ex. 50 résultats affichés sur 230).',
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
          'Un bouton "Tout télécharger" permet de récupérer une série entière en un seul clic.',
          'Le bouton "Lire avec VLC" n\'apparaît plus que pour les vidéos.',
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
