import rouletteV164Img from "@/assets/patchnote/v1.6.4/roulette.webp";
import discoverMangaV160Img from "@/assets/patchnote/v1.6.0/discover-manga.webp";
import slotMachineV160Img from "@/assets/patchnote/v1.6.0/slot-machine.png";
import bibliothequesMangaV160Img from "@/assets/patchnote/v1.6.0/bibliotheque-manga.webp";
import newsPrincipalesV150Img from "@/assets/patchnote/v1.5.0/news-principales.webp";
import importExportV150Img from "@/assets/patchnote/v1.5.0/import-export.webp";
import canardsNomesV150Img from "@/assets/patchnote/v1.5.0/canards-nomes.webp";
import raccourcisV143Img from "@/assets/patchnote/v1.4.3/raccourcis.webp";
import pokedexV140Img from "@/assets/patchnote/v1.4.0/pokedex.webp";
import xingxingV140Img from "@/assets/patchnote/v1.4.0/xingxing.webp";
import roiDesCanardsV135Img from "@/assets/patchnote/v1.3.5/roi-des-canards.webp";
import parametresV134Img from "@/assets/patchnote/v1.3.4/parametres.webp";
import multiSelectionV134Img from "@/assets/patchnote/v1.3.4/multi-selection.webp";
import modaleV134Img from "@/assets/patchnote/v1.3.4/modale-magnet.webp";
import bibliothequeV131Img from "@/assets/patchnote/v1.3.1/bibliotheque.webp";
import bibliothequeImg from "@/assets/patchnote/v1.3/bibliotheque.webp";
import reprendreImg from "@/assets/patchnote/v1.3/reprendre.webp";
import tailleLancementImg from "@/assets/patchnote/v1.3/taille-lancement.webp";
import marquageAutoImg from "@/assets/patchnote/v1.3/marquage-auto.webp";
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
    version: "1.6.6",
    date: "4 septembre 2026",
    intro:
      "La 1.6.6 se concentre sur la page Découverte : tri des saisons par épisode, intégrales de séries dans leur propre section, boutons modernisés et roulette plus agréable. La page de bienvenue reçoit aussi une refonte graphique et logique.",
    sections: [
      {
        title: "Découverte : saisons triées par épisode",
        items: [
          "Les saisons des séries sont désormais triées par ordre d'épisode par défaut, et non plus par nombre de seeds.",
          "Vous suivez la saison dans l'ordre, sans avoir à reconstituer la liste vous-même.",
        ],
      },
      {
        title: "Découverte : intégrales séparées",
        items: [
          "Les intégrales de séries sont maintenant regroupées dans une section dédiée, distincte des épisodes.",
          "Quand une intégrale est disponible, elle est proposée en premier choix.",
        ],
      },
      {
        title: "Découverte : boutons modernisés",
        items: ["Légère modernisation des boutons sur les fiches d'œuvres de la page Découverte."],
      },
      {
        title: "Découverte : roulette améliorée",
        items: [
          "Les interactions avec la roulette ont été améliorées : animations de résultat plus nettes et comportement plus stable.",
        ],
      },
      {
        title: "Page de bienvenue modernisée",
        items: [
          "Upgrade graphique et logique de la page de bienvenue pour que tout soit plus simple à comprendre et à suivre.",
        ],
      },
    ],
  },
  {
    version: "1.6.5",
    date: "3 septembre 2026",
    intro:
      "La 1.6.5 corrige de nombreux bugs de la page Ma bibliothèque, ajoute une pastille dans la barre de recherche principale pour le contenu déjà possédé, redesigné les toasts d'ajout à la bibliothèque et repense entièrement la page de bienvenue.",
    sections: [
      {
        title: "Ma bibliothèque : corrections",
        items: [
          "Plusieurs bugs corrigés lors du passage entre les films, les séries et les mangas.",
          "L'affichage restait incohérent quand on basculait d'un type de contenu à l'autre : c'est désormais stable.",
        ],
      },
      {
        title: "Barre de recherche principale : pastille bibliothèque",
        items: [
          "Une pastille apparaît maintenant dans la barre de recherche principale quand le contenu est déjà dans votre bibliothèque.",
          "Plus besoin d'ouvrir la fiche pour savoir si vous l'avez déjà ajouté.",
        ],
      },
      {
        title: "Toasts d'ajout à la bibliothèque redesignés",
        items: [
          "Les notifications affichées lors de l'ajout d'un film, d'une série ou d'un manga à votre bibliothèque ont été entièrement redesignées.",
        ],
      },
      {
        title: "Page de bienvenue repensée",
        items: [
          "La page de bienvenue des nouveaux utilisateurs est totalement revue pour être compréhensible par tout le monde.",
          "Nouvelles animations et découpage plus simple pour suivre chaque étape sans se perdre.",
        ],
      },
    ],
  },
  {
    version: "1.6.4",
    date: "29 août 2026",
    intro:
      "La 1.6.4 apporte une grosse mise à jour de la roulette dans la page Découverte : nouveau design, corrections de bugs et deux nouvelles catégories de tirage.",
    sections: [
      {
        title: "Découverte",
        items: [
          "Grosse refonte de la roulette : design revu et plusieurs corrections de bugs.",
          "Nouvelle catégorie de tirage : Top 200 Letterboxd, le haut du classement sans filtre.",
          "Nouvelle catégorie de tirage : Top 200 des pires, les films les plus mal notes de TMDB.",
        ],
        images: [{ src: rouletteV164Img, caption: "La roulette repensée" }],
      },
      {
        title: "Bibliothèque",
        items: ["Correction d'un bug d'affichage dans la Bibliothèque."],
      },
    ],
  },
  {
    version: "1.6.3",
    date: "9 août 2026",
    intro:
      "La 1.6.3 ajoute la roulette de film aléatoire et le Top 200 manga dans la page Découverte, un accès rapide à la Bibliothèque depuis toutes les pages, et plusieurs améliorations pour les mangas et la Bibliothèque.",
    sections: [
      {
        title: "Découverte",
        items: [
          "Nouvelle roulette de film aléatoire : choisissez un genre ou laissez-la piocher parmi tout le catalogue.",
          "Nouvelle section Top 200 manga.",
        ],
      },
      {
        title: "Navigation",
        items: [
          "Un bouton Bibliothèque apparaît à côté du menu sur toutes les pages, sauf la page principale.",
        ],
      },
      {
        title: "Mangas",
        items: ["Les fichiers non lisibles ne s'affichent plus dans les listes de torrents."],
      },
      {
        title: "Bibliothèque",
        items: [
          "Correction de l'animation des listes : elle ne se joue plus à l'ouverture, seulement à la fermeture.",
          "Ajout d'un bouton de recherche d'autres épisodes ou saisons pour les films et séries, comme déjà disponible pour les mangas.",
          "La description des films et séries peut désormais être dépliée au lieu d'être simplement tronquée.",
        ],
      },
      {
        title: "Mac",
        items: [
          "L'application vérifie maintenant si VLC est installe et affiche un message d'erreur clair si ce n'est pas le cas.",
        ],
      },
      {
        title: "Performances",
        items: ["Les images sont désormais pre-chargees des le lancement de l'application."],
      },
      {
        title: "Coin des Canards",
        items: [
          "Nouvelle case à cocher lors de l'enregistrement d'un canard : choisissez s'il retourne directement à l'eau ou s'il rejoint votre inventaire.",
          "Un canard cadeau vous attend. Amusez-vous bien.",
        ],
      },
    ],
  },
  {
    version: "1.6.2",
    date: "1 août 2026",
    intro:
      "La 1.6.2 enrichit la page Découverte avec le Top 500 Letterboxd, améliore la lecture et la recherche dans la bibliothèque, et rééquilibre le Coin des Canards.",
    sections: [
      {
        title: "Découverte",
        items: [
          "Nouvelle section Top 500 Letterboxd.",
          "Scroll infini sur la section manga, à la place du bouton Charger plus.",
          "Suppression de la sous-section Populaire, qui faisait doublon avec Tendance.",
        ],
      },
      {
        title: "Bibliothèque et lecture",
        items: [
          "Bloc de recherche de la page Bibliothèque refondu.",
          "Bouton plein écran pour la lecture de livres.",
        ],
      },
      {
        title: "Coin des Canards",
        items: [
          "Le drapeau reste affiche plus longtemps.",
          "Pity nerfe : il était trop généreux et la completion trop rapide.",
        ],
      },
      {
        title: "Divers",
        items: ["Build Xingxing disponible pour les Mac Apple Intel."],
      },
    ],
  },
  {
    version: "1.6.1",
    date: "29 juillet 2026",
    intro:
      "La 1.6.1 corrige plusieurs bugs de la 1.6.0 liés aux mangas et améliore la possibilité d'enrichir sa bibliothèque avec des œuvres externes.",
    sections: [
      {
        title: "Mangas : import et bibliothèque",
        items: [
          "Ajout d'œuvres à la bibliothèque manga depuis l'extérieur de l'application désormais possible.",
        ],
      },
      {
        title: "Corrections",
        items: [
          "Correction d'un problème avec certains dossiers torrent lors de l'import dans la bibliothèque de manga.",
          "Correction du dossier manga par défaut sous Windows.",
          "Correction d'un problème lors de la recherche de certaines œuvres.",
        ],
      },
    ],
  },
  {
    version: "1.6.0",
    date: "27 juillet 2026",
    intro:
      "La 1.6.0 est une version majeure : les mangas font leur entrée dans l'application, une machine à sous exclusive arrive dans le Coin des Canards, et l'export de bibliothèque facilite le passage d'un PC à l'autre.",
    introImage: {
      src: discoverMangaV160Img,
      caption: "Recherche de mangas dans la page Découverte, propulsée par MangaDex",
    },
    sections: [
      {
        title: "Nouveauté principale : les Mangas",
        items: [
          "La page Découverte intègre désormais une recherche de mangas, alimentée par la base de données MangaDex.",
          "L'application cherche automatiquement les fichiers correspondants sur T411 et vous permet de les ajouter directement à votre bibliothèque.",
          "La barre de recherche principale supporte elle aussi la recherche de mangas.",
          "Pas besoin de logiciel tiers pour lire vos fichiers .CBZ : Xingxing s'en charge nativement, tout-en-un.",
        ],
        images: [
          {
            src: bibliothequesMangaV160Img,
            caption: "Vos mangas dans la bibliothèque, lisibles directement depuis l'application",
          },
        ],
      },
      {
        title: "Coin des Canards : machine à sous",
        items: [
          "Une machine à sous fait son apparition dans le Coin des Canards, avec une récompense exclusive accessible uniquement via cette machine.",
          "Un tirage est disponible toutes les 4 heures. Bonne chance à tous.",
        ],
        images: [
          {
            src: slotMachineV160Img,
            caption: "La machine à sous — un tirage toutes les 4h pour une récompense exclusive",
          },
        ],
      },
      {
        title: "Canardex : notification de récompense",
        items: [
          "Une notification apparaît désormais sur le Canardex pour vous alerter dès qu'une récompense est disponible à récupérer.",
        ],
      },
      {
        title: "Bibliothèque : export multi-PC",
        items: [
          "Il est maintenant possible d'exporter votre bibliothèque de films et séries pour la retrouver sur un autre PC.",
          "L'export est conçu pour fonctionner de façon optimale entre machines partageant la même configuration de compte.",
        ],
      },
      {
        title: "Corrections",
        items: [
          "Correction du pity progressif pour l'apparition des canards : le pity n'était pris en compte que pour le jeu du typhon, et non lors de l'arrivée naturelle des canards dans la piscine.",
          "Correction des animations entre les transitions de recherche.",
        ],
      },
    ],
  },
  {
    version: "1.5.4",
    date: "24 juillet 2026",
    intro:
      "La 1.5.4 enrichit la collection de canards avec de nouvelles récompenses, des drops plus justes, et corrige plusieurs points de confusion dans l'app.",
    sections: [
      {
        title: "Collection : nouvelles récompenses",
        items: [
          "Trois nouveaux canards à débloquer en complétant la collection de couleurs.",
          "Les canards identiques se cumulent désormais sur une seule carte, avec le nombre d'exemplaires possedes.",
        ],
      },
      {
        title: "Drops : pity progressif",
        items: [
          "Plus vous obtenez de doublons, plus vos chances de tomber sur un canard que vous n'avez pas augmentent.",
          "Cela s'applique aux familles comme aux shiny : chaque shiny déjà possédé rend les shiny manquants plus probables.",
        ],
      },
      {
        title: "Réglages",
        items: [
          "Choisissez la page sur laquelle l'application s'ouvre au démarrage.",
          "Nouveau réglage pour indiquer manuellement l'emplacement de VLC sous Windows, si l'application ne le trouve pas toute seule.",
        ],
      },
      {
        title: "Corrections",
        items: [
          "Le bouton de téléchargement a été retiré de la page Découverte pour éviter la confusion.",
          "La notification d'ajout à la bibliothèque ouvre maintenant la fiche du film ou de la série concernée, et plus seulement la page Bibliothèque.",
          "Corrections mineures dans la Bibliothèque.",
        ],
      },
    ],
  },
  {
    version: "1.5.3",
    date: "23 juillet 2026",
    intro:
      "La 1.5.3 renforce la page de bienvenue avec une protection contre les problèmes de connexion à C411, et enrichit la Bibliothèque avec des genres automatiques issus de TMDB, un système de tri et de filtrage par genre, ainsi qu'une vue personnalisée pour créer ses propres catégories.",
    sections: [
      {
        title: "Page de bienvenue : protection connexion C411",
        items: [
          "Les utilisateurs qui n'ont pas accès à C411 sont désormais bloqués sur la page de vérification de connexion, avec un message clair expliquant la situation.",
          "Un guide integre explique les causes possibles : problème DNS, IPv6 actif sur le réseau, ou autre complexité réseau pouvant empêcher l'accès au site.",
          "Des solutions sont proposées directement dans l'interface pour aider à résoudre ces problèmes sans quitter l'application.",
        ],
      },
      {
        title: "Bibliothèque : genres automatiques depuis TMDB",
        items: [
          "Chaque titre de votre bibliothèque affiche maintenant ses genres (Action, Horreur, Comédie, etc.) récupérés automatiquement depuis TMDB.",
          "Les genres apparaissent directement sur les cartes pour identifier le type de contenu en un coup d'œil.",
        ],
      },
      {
        title: "Bibliothèque : tri et filtrage par genre",
        items: [
          "Triez votre bibliothèque par genre pour regrouper automatiquement les contenus de même type.",
          "Filtrez l'intégralité de votre bibliothèque par genre pour n'afficher que les titres correspondant à la catégorie choisie.",
        ],
      },
      {
        title: "Bibliothèque : vue personnalisée",
        items: [
          "Une nouvelle vue de tri « Personnalisé » est disponible pour ceux qui souhaitent organiser leur bibliothèque à leur façon.",
          "Créez vos propres catégories, donnez-leur le nom que vous voulez, et classez vos titres selon votre propre logique.",
          "Cette vue coexiste avec les tris automatiques existants et se sauvegarde entre les sessions.",
        ],
      },
    ],
  },
  {
    version: "1.5.2",
    date: "11 juillet 2026",
    intro:
      "La 1.5.2 enrichit la gestion des dossiers de série dans la bibliothèque, ajoute des raccourcis clavier pour le Coin des Canards, corrige un bug sur les clés API, et équilibre les taux de drop des canards rares.",
    sections: [
      {
        title: "Bibliothèque : gestion avancée des dossiers de série",
        items: [
          "Ajoutez un seul épisode d'une saison dans la bibliothèque : l'application créé automatiquement le bon dossier de saison et y place l'épisode.",
          "Ajoutez une autre saison de la même série : les deux saisons se regroupent automatiquement sous une seule œuvre, sans intervention.",
          "Personnalisez entièrement la structure de vos dossiers : ajout, suppression et renommage de saisons directement depuis la bibliothèque.",
        ],
      },
      {
        title: "Bibliothèque : débridage et sélection avancée",
        items: [
          "Les films et séries en cours de débridage sont désormais visibles et gérable directement depuis la bibliothèque.",
          "Les saisons et épisodes d'une série peuvent être sélectionnés et supprimés depuis la bibliothèque.",
        ],
      },
      {
        title: "Coin des Canards : raccourcis clavier",
        items: [
          "Un raccourci clavier permet désormais de capturer un canard directement au clavier. Par défaut : C.",
          "Un deuxième raccourci permet d'activer l'aspirateur sans passer par la souris. Par défaut : V.",
          "Les deux raccourcis sont entièrement configurables depuis la page Paramètres.",
        ],
      },
      {
        title: "Corrections",
        items: [
          "Correction d'un bug ou les canards pouvaient ne pas apparaître si des appels API étaient encore en cours ou bloqués au démarrage. Le spawn des canards se base désormais uniquement sur le lancement de l'application.",
          "Correction d'un bug ou certaines clés API pouvaient être mal enregistrées au lancement de l'application et depuis la page Réglages.",
        ],
      },
      {
        title: "Equilibrage : canards rares",
        items: [
          "Le Roi des Canards et les versions shiny étaient apparus un peu trop souvent. Leurs taux de drop ont été divisés par deux pour retrouver leur caractère exceptionnel.",
        ],
      },
    ],
  },
  {
    version: "1.5.1",
    date: "8 juillet 2026",
    intro:
      "La 1.5.1 corrige un bug graphique mineur, ajoute le support natif Apple Silicon pour Mac, et améliore la lisibilité des résultats de séries.",
    sections: [
      {
        title: "Corrections graphiques",
        items: ["Résolution d'un bug graphique mineur affectant l'affichage de l'interface."],
      },
      {
        title: "Support Apple Silicon",
        items: [
          "Les Mac équipes d'une puce Apple Silicon (M1, M2, M3...) disposent désormais de leur propre build natif.",
          "L'application tourne nativement sur ARM, sans émulation Rosetta, pour de meilleures performances et une consommation réduite.",
        ],
      },
      {
        title: "Résultats de séries : labels saison ou épisode",
        items: [
          "Dans les résultats de recherche pour les séries, un label indique désormais en un coup d'œil si le fichier correspond à une saison complète ou à un épisode unique.",
          "Plus besoin de lire le nom de fichier en entier pour savoir ce que vous allez télécharger.",
        ],
      },
    ],
  },
  {
    version: "1.5.0",
    date: "7 juillet 2026",
    intro:
      "La 1.5.0 recentre l'application autour de la barre de recherche principale, integre l'import/export de profil pour faciliter le multi-device, et renforce TMDB comme élément clé de l'expérience.",
    sections: [
      {
        title: "La barre de recherche redevient principale",
        items: [
          "La barre de recherche sur la page d'accueil devient l'élément principal de l'application pour faire vos recherches.",
          "Avec l'auto-completion des noms de séries et films, retrouver vos contenus est plus rapide et plus fluide.",
          "L'application tourne désormais bien autour de la page Découvrir et de son mode de fonctionnement, ce qui simplifie l'utilisation globalement.",
          "Rien n'empêche d'utiliser la recherche brute sur C411 ou Nyaa pour autant - les deux approches coexistent.",
        ],
        images: [
          {
            src: newsPrincipalesV150Img,
            caption: "La barre de recherche principale avec auto-completion",
          },
        ],
      },
      {
        title: "Découvrir : auto-completion globale",
        items: [
          "La page Découvrir obtient aussi un système d'auto-completion des recherches.",
          "Les recherches sont maintenant globales et ne ciblent plus uniquement films, séries ou animation - trouvez ce que vous cherchez quel que soit le type de contenu.",
        ],
      },
      {
        title: "Import/Export de profil pour multi-device",
        items: [
          "Exportez votre profil complet dans un fichier encrypte par un mot de passe : réglages, informations, clés API, canards, bibliothèque, et tout le reste.",
          "Importez ce fichier sur une autre installation de Xingxing pour retrouver l'intégralité de votre configuration.",
          "Attention : ne partagez votre profil avec n'importe qui, car il contient vos clés API et données personnelles.",
        ],
        images: [
          {
            src: importExportV150Img,
            caption: "Import/Export de profil pour transporter votre configuration",
          },
        ],
      },
      {
        title: "TMDB devient obligatoire",
        items: [
          "La clé API du service TMDB est maintenant obligatoire pour le bon fonctionnement de l'application et du user flow global.",
          "TMDB est essential pour enrichir votre expérience de recherche et de découverte.",
        ],
      },
      {
        title: "Coin des Canards : canards nommés par défaut",
        items: [
          "Les canards ne sont plus des « sans nom » : ils portent désormais par défaut le nom de leur famille, comme « Canard moustachu ».",
          "Vous pouvez toujours les renommer comme bon vous semble, mais cette amélioration rend votre collection plus vivante.",
        ],
      },
      {
        title: "Coin des Canards : bateau sécurisé",
        items: [
          "Le bateau de XingXing ne peut plus lancer le jeu tout seul sans une action du joueur avec le typhon.",
          "Cela évite les interactions involontaires et rend le jeu plus intentionnel.",
        ],
        images: [
          {
            src: canardsNomesV150Img,
            caption: "Les canards nommés et le bateau de XingXing sécurisé",
          },
        ],
      },
    ],
  },
  {
    version: "1.4.3",
    date: "6 juillet 2026",
    intro:
      "La 1.4.3 ajoute des raccourcis clavier pour naviguer entre les pages et un label sur la page Découvrir pour repérer les titres déjà dans votre bibliothèque.",
    sections: [
      {
        title: "Raccourcis clavier",
        items: [
          "Naviguez entre les pages de l'application directement au clavier, sans passer par le menu.",
          "Les raccourcis sont entièrement configurables depuis la page Paramètres.",
        ],
        images: [
          {
            src: raccourcisV143Img,
            caption: "Les raccourcis clavier configurables dans les Paramètres",
          },
        ],
      },
      {
        title: "Découvrir : label bibliothèque",
        items: [
          "Les films et séries déjà présents dans votre bibliothèque affichent désormais un petit label directement sur leur carte dans la page Découvrir.",
          "Plus besoin de cliquer pour savoir si vous l'avez déjà : c'est visible en un coup d'œil.",
        ],
      },
    ],
  },
  {
    version: "1.4.2",
    date: "3 juillet 2026",
    intro:
      "La 1.4.2 corrige plusieurs bugs signales après la 1.4.0 : direction du bateau de XingXing, hitbox de Frisson, effet rétro de l'easter egg, et quelques skins de canards.",
    sections: [
      {
        title: "Piscine",
        items: [
          "Le bateau de XingXing retrouve la bonne direction : il se déplace désormais comme dans le jeu, et non plus à l'envers.",
        ],
      },
      {
        title: "Jeux",
        items: [
          "L'effet rétro de l'easter egg bénéficie d'une résolution plus élevée - le rendu pixelise était trop grossier.",
          "Correction de la hitbox de Frisson : la détection de collision était trop grande par rapport à son sprite.",
        ],
      },
      {
        title: "Coin des Canards",
        items: [
          "Des tooltips sont maintenant affichés sur les boutons d'action du stand pour mieux comprendre leur role.",
          "Le bouton « Supprimer de la liste » a été renommé en « Relâcher le canard ».",
          "Une confirmation s'affiche avant de relacher un canard, pour éviter les accidents.",
        ],
      },
      {
        title: "Corrections",
        items: [
          "Correction d'un bug graphique affectant l'affichage de certains skins de canards.",
        ],
      },
    ],
  },
  {
    version: "1.4.0",
    date: "2 juillet 2026",
    intro:
      "La 1.4.0 introduit le Pokedex des canards : une collection à compléter, 9 nouvelles espèces, des versions shiny pour chaque famille, et des récompenses pour les plus achernes.",
    sections: [
      {
        title: "Le Pokedex des canards",
        items: [
          "Un Pokedex fait son apparition dans le Coin des Canards. Retrouvez-y toutes les espèces de canards à débloquer et suivez votre progression.",
          "9 nouvelles espèces de canards viennent agrandir la famille : partez à la chasse pour les découvrir.",
          "Chaque famille dispose désormais d'une version shiny, plus rare et reconnaissable entre mille.",
        ],
        images: [
          {
            src: pokedexV140Img,
            caption: "Le Pokedex des canards - toutes les espèces à débloquer",
          },
        ],
      },
      {
        title: "Récompenses",
        items: [
          "Remplir votre Pokedex complètement débloqué une nouvelle récompense.",
          "Posséder toutes les familles ET toutes leurs versions shiny offre une récompense exceptionnelle.",
        ],
      },
      {
        title: "Un visiteur mystérieux",
        items: [
          "Un mystérieux XingXing se balade dans la piscine... il y a peut-être quelque chose à faire avec. Je vous laisse trouver !",
        ],
        images: [
          {
            src: xingxingV140Img,
            caption: "XingXing dans la piscine - a vous de découvrir son secret",
          },
        ],
      },
    ],
  },
  {
    version: "1.3.6",
    date: "1 juillet 2026",
    intro:
      "La 1.3.6 apporte des améliorations au Coin des Canards avec un tri par rareté, un aspirateur pour la collection, un idle timer pour économiser vos ressources, et une meilleure expérience dans la Bibliothèque avec la sélection multiple et la suppression directe.",
    sections: [
      {
        title: "Paramètres : validation du nombre de canards",
        items: [
          "La modification du nombre de canards dans les Paramètres est maintenant validée avant d'être appliquee.",
          "Cela évite d'effacer accidentellement tout votre board en cas de clic involontaire.",
        ],
      },
      {
        title: "Coin des Canards : tri par rareté",
        items: [
          "Une nouvelle option de tri permet de classer vos canards par niveau de rareté.",
          "Identifiez rapidement vos canards les plus précieux ou ceux qui vous manquent encore.",
        ],
      },
      {
        title: "Coin des Canards : idle timer",
        items: [
          "Un nouveau paramètre permet de masquer automatiquement l'interface de la piscine après 30 secondes d'inactivité.",
          "Utile pour économiser des ressources lorsque vous n'interagissez pas avec les canards.",
          "Configurez cette durée dans les Paramètres selon votre préférence.",
        ],
      },
      {
        title: "Coin des Canards : aspirateur",
        items: [
          "Un nouvel item spécial fait son apparition dans la piscine : un aspirateur capable de collecter les canards.",
          "Utilisez-le pour capturer automatiquement vos canards.",
        ],
      },
      {
        title: "Bibliothèque : sélection multiple et suppression directe",
        items: [
          "Sélectionnez plusieurs titres à la fois pour les valider, les dé-valider ou les supprimer d'un seul geste.",
          "Un bouton de suppression sur chaque vignette permet également de supprimer un titre directement sans passer par la sélection multiple.",
        ],
      },
      {
        title: "Corrections",
        items: ["Résolution de quelques bugs mineurs et améliorations mineures."],
      },
    ],
  },
  {
    version: "1.3.5",
    date: "1 juillet 2026",
    intro:
      "La 1.3.5 introduit un nouveau canard ultra légendaire, un paramètre d'affichage personnalise au lancement, et une section « Pour vous » dans la page Découvrir.",
    sections: [
      {
        title: "Nouveau canard : Roi des Canards",
        items: [
          "Le Roi des Canards fait son entrée dans la piscine. Ultra légendaire, il n'apparaît qu'avec 1% de chance.",
          "Bonne chance.",
        ],
        images: [
          {
            src: roiDesCanardsV135Img,
            caption: "Le Roi des Canards - ultra légendaire, drop 1%",
          },
        ],
      },
      {
        title: "Paramètre d'affichage au lancement « personnalise »",
        items: [
          "Une nouvelle option « Personnalise » est disponible dans le paramètre de taille au lancement.",
          "L'application mémorise la dernière taille et position de la fenêtre et les restaure exactement au prochain démarrage.",
        ],
      },
      {
        title: "Section « Pour vous » dans la page Découvrir",
        items: [
          "Une nouvelle section « Pour vous » apparaît dans la page Découvrir.",
          "Elle analyse vos likes et votre bibliothèque pour identifier vos gouts et vous proposer des titres qui correspondent vraiment à ce que vous aimez.",
        ],
      },
      {
        title: "Corrections",
        items: ["Résolution de quelques bugs mineurs."],
      },
    ],
  },
  {
    version: "1.3.4",
    date: "27 juin 2026",
    intro:
      "La 1.3.4 apporte le téléchargement natif directement dans l'application, une sélection multiple revue, des modales plus lisibles et une page Paramètres entièrement réorganisée.",
    sections: [
      {
        title: "Page Paramètres réorganisée",
        items: [
          "La page Paramètres a été révisée pour accueillir toutes les nouvelles options : les sections sont mieux découpées et plus faciles à parcourir.",
        ],
        images: [
          {
            src: parametresV134Img,
            caption: "La page Paramètres réorganisée avec les nouvelles sections",
          },
        ],
      },
      {
        title: "Téléchargement depuis l'application",
        items: [
          "Il est désormais possible de télécharger vos fichiers directement depuis l'application, sans passer par un navigateur ou un gestionnaire externe.",
          "Un dossier de destination peut être configure dans les Paramètres pour choisir ou vos téléchargements atterrissent.",
          "Un paramètre permet également de définir combien de fichiers sont téléchargés en parallèle lors d'une sélection multiple.",
        ],
        images: [
          {
            src: modaleV134Img,
            caption: "Le téléchargement natif depuis l'application",
          },
        ],
      },
      {
        title: "Sélection multiple",
        items: [
          "La sélection de plusieurs fichiers est désormais disponible sur la page Magnets et dans la Bibliothèque.",
          "Sélectionnez plusieurs éléments d'un coup pour les télécharger ou les supprimer en une seule action.",
        ],
        images: [
          {
            src: multiSelectionV134Img,
            caption: "La sélection multiple sur la page Magnets et dans la Bibliothèque",
          },
        ],
      },
      {
        title: "Modales de fichier revisitees",
        items: [
          "Les modales de détail de fichier sur la page Magnets ont été entièrement refaites pour être plus claires et plus lisibles.",
        ],
      },
    ],
  },
  {
    version: "1.3.3",
    date: "27 juin 2026",
    intro:
      "La piscine s'enrichit d'un canon à balles de tennis, d'un drapeau de parade et d'une belle refonte de l'affichage des raretés.",
    sections: [
      {
        title: "Rareté visible avec des étoiles",
        items: [
          "La rareté de chaque canard s'affiche désormais sous forme d'étoiles directement dans le stand, pour identifier d'un coup d'œil vos canards les plus rares.",
          "Les effets visuels des canards légendaires ont été améliorés : les animations sont plus intenses et plus fidèles à leur statut exceptionnel.",
        ],
      },
      {
        title: "Canon a balles de tennis",
        items: [
          "Un canon à balles de tennis fait son apparition dans la piscine. Ajustez la trajectoire et faites-en partir pour perturber (gentiment) vos canards.",
          "Les canards réagissent aux impacts et sont propulsés dans la direction du tir. La chasse est ouverte.",
          "Des nénuphars flottent également sur l'eau : les canards peuvent y prendre appui et les balles ricochent dessus.",
        ],
      },
      {
        title: "Mode parade",
        items: [
          "Un drapeau de parade est disponible dans la piscine. Il ne sert à rien. Mais il est là.",
        ],
      },
      {
        title: "Corrections",
        items: [
          "Correction d'un bug qui empêchait de relacher un canard depuis le stand - le bouton fonctionne correctement désormais.",
        ],
      },
    ],
  },
  {
    version: "1.3.2",
    date: "27 juin 2026",
    intro: "Améliorations de performances sur la page Ma bibliothèque.",
    sections: [
      {
        title: "Performances de la bibliothèque",
        items: [
          "La page Ma bibliothèque a été optimisée pour rester fluide même avec un grand nombre d'éléments.",
          "Des tests de scalabilité ont été réalisés pour valider le comportement avec des collections importantes.",
        ],
      },
    ],
  },
  {
    version: "1.3.1",
    date: "26 juin 2026",
    intro:
      "La page Ma bibliothèque est entièrement revue : nouvelle vue en jaquettes, enrichissement TMDB, tri par type de contenu, et regroupement automatique des saisons.",
    introImage: {
      src: bibliothequeV131Img,
      caption: "La page Ma bibliothèque revisitée - jaquettes, TMDB et tri par type",
    },
    sections: [
      {
        title: "Nouvelle interface : vue en jaquettes",
        items: [
          "La bibliothèque affiche désormais les jaquettes de vos films et séries, pour une navigation plus visuelle et agréable.",
          "De nouveaux boutons permettent d'agir rapidement sur chaque élément sans avoir à ouvrir sa fiche.",
          "L'avancement est visible en un coup d'œil directement sur chaque carte.",
        ],
      },
      {
        title: "Enrichissement TMDB",
        items: [
          "Chaque élément de la bibliothèque peut être relié aux données TMDB : affiche officielle, titre, synopsis, note.",
          "Le lien se fait automatiquement lors de l'ajout, ou manuellement depuis la fiche de l'élément.",
        ],
      },
      {
        title: "Tri par films et séries",
        items: [
          "Un nouveau filtre permet d'afficher uniquement les films, uniquement les séries, ou tout le contenu en une seule vue.",
        ],
      },
      {
        title: "Regroupement automatique des saisons",
        items: [
          "Si deux saisons d'une même série sont détectées dans votre bibliothèque, elles sont automatiquement regroupées en une seule carte.",
          "Toutes les saisons restent accessibles depuis cette carte unifiée, sans encombrer la vue principale.",
        ],
      },
    ],
  },
  {
    version: "1.3.0",
    date: "26 juin 2026",
    intro:
      "La version 1.3 apporte la page Bibliothèque : votre hub personnel pour suivre ce que vous avez vu, épisode par épisode, et reprendre exactement ou vous en étiez.",
    sections: [
      {
        title: "Nouvelle page : Bibliothèque",
        items: [
          "Un hub personnel centralise tout ce que vous avez ajouté : films et séries, avec leur statut de visionnage.",
          "Pour les séries, le suivi se fait épisode par épisode - cochez chaque épisode vu au fur et à mesure.",
          "Vous pouvez ajouter une série entière dans VLC en un seul clic pour l'ouvrir directement.",
        ],
        images: [
          {
            src: bibliothequeImg,
            caption: "La page Bibliothèque - votre suivi personnel épisode par épisode",
          },
        ],
      },
      {
        title: "Bouton Reprendre",
        items: [
          'Un nouveau bouton "Reprendre" detecte automatiquement le prochain episode non coche et le lance dans l\'application.',
          "Plus besoin de se souvenir ou vous en étiez : un seul clic et vous continuez exactement la ou vous vous êtes arrête.",
        ],
        images: [
          {
            src: reprendreImg,
            caption: "Le bouton Reprendre - lance le prochain épisode non vu automatiquement",
          },
        ],
      },
      {
        title: "Nouveau paramètre : marquage automatique à la lecture",
        items: [
          "Un nouveau paramètre dans la section Bibliothèque des Préférences permet de choisir si un film ou un épisode est automatiquement coche comme visionne lorsque vous cliquez sur le bouton VLC.",
          "Par défaut, le marquage est actif : jouer un contenu le coche immédiatement. Désactivez l'option si vous préférez cocher manuellement après avoir regarde.",
        ],
        images: [
          {
            src: marquageAutoImg,
            caption: "Le paramètre de marquage automatique dans les préférences de la Bibliothèque",
          },
        ],
      },
      {
        title: "Nouveau paramètre : taille au lancement",
        items: [
          "Un nouveau paramètre général permet de choisir la taille de la fenêtre au démarrage de l'application : compacte, normale ou maximisée.",
          "Le réglage est sauvegarde et applique automatiquement à chaque lancement.",
        ],
        images: [
          {
            src: tailleLancementImg,
            caption: "Le paramètre de taille au lancement dans les préférences générales",
          },
        ],
      },
    ],
  },
  {
    version: "1.2.2",
    date: "25 juin 2026",
    intro: "Mise à jour de la page de configuration pour les nouveaux utilisateurs.",
    sections: [
      {
        title: "Page de configuration revisitée",
        items: [
          "La page d'accueil pour les nouveaux utilisateurs a été entièrement mise à jour : les étapes sont plus claires, mieux organisées et plus faciles à suivre.",
          "Une étape de vérification des prérequis permet de s'assurer que tout est en ordre avant de commencer la configuration.",
          "Une étape de personnalisation du thème a été ajoutée pour choisir l'apparence de l'application dès la première utilisation.",
        ],
      },
    ],
  },
  {
    version: "1.2.1",
    date: "24 juin 2026",
    intro:
      "Le Coin des Canards passe au niveau supérieur : mettez vos canards en réserve, retrouvez-les grâce à la recherche et aux filtres, et gardez une piscine toujours à la bonne taille.",
    sections: [
      {
        title: "Mettre un canard en réserve",
        items: [
          "Chaque canard enregistre peut désormais être mis à l'eau ou range en réserve directement depuis le stand, d'un seul clic.",
          "Un canard mis en réserve quitte la piscine avec une petite animation de rangement vers le stand, et reste conserve entre les sessions.",
          "Le compteur du stand indique en permanence combien de canards sont à l'eau.",
        ],
      },
      {
        title: "Recherche et filtres dans la collection",
        items: [
          "Une barre de recherche permet de retrouver un canard par son nom.",
          "Un filtre dédié affiche tous les canards, uniquement ceux à l'eau, ou uniquement ceux en réserve.",
        ],
      },
      {
        title: "La piscine reste à la bonne taille",
        items: [
          "Au démarrage, si vous avez plus de canards à l'eau que la limite d'affichage, le surplus est automatiquement mis en réserve et vous êtes prévenu.",
          "Impossible de remettre un canard à l'eau quand la piscine est pleine : un message vous invite à en retirer un, ou à augmenter la limite dans les paramètres.",
          "Si vous baissez la limite d'affichage, les canards non enregistrés disparaissent en premier, puis juste assez de canards enregistrés passent en réserve pour respecter la nouvelle limite.",
        ],
      },
      {
        title: "Confort du stand",
        items: [
          "Le panneau du stand s'ouvre désormais au-dessus de son icone pour ne plus la masquer.",
          "Cliquer en dehors du panneau le ferme automatiquement.",
          "La liste de la collection est limitée en hauteur et devient défilante, avec un indice visuel clair lorsqu'il reste des canards à voir.",
        ],
      },
    ],
  },
  {
    version: "1.2.0",
    date: "24 juin 2026",
    intro:
      "Deux grandes nouveautés : une nouvelle source de recherche Nyaa avec ses filtres dédiés, et le Coin des Canards pour adopter, nommer et collectionner vos canards.",
    sections: [
      {
        title: "Nouvelle source de recherche : Nyaa",
        items: [
          "En plus de C411, vous pouvez désormais rechercher directement sur nyaa.si. Une bascule sous la barre de recherche permet de choisir la source.",
          "Des filtres dédiés affinent vos recherches Nyaa : team, qualité (2160p, 1080p, 720p, 480p), codec (x265, x264, hevc, av1) et langue (vostfr, vost, multi, truefrench, french, vf).",
          "Vos filtres Nyaa par défaut sont configurables dans les Préférences pour les retrouver automatiquement à chaque recherche.",
        ],
        images: [{ src: nyaaPatchImg, caption: "La recherche Nyaa et ses filtres dédiés" }],
      },
      {
        title: "Le Coin des Canards",
        items: [
          "Un petit stand est apparu en bas à gauche de la piscine. Attrapez un canard et déposez-le dedans pour lui donner un nom et l'enregistrer.",
          "Vos canards enregistrés reviennent nager automatiquement à chaque ouverture de l'application.",
          "Survolez un canard nomme pour afficher son nom au-dessus de lui.",
          "Gérez votre collection depuis le stand : renommer, relacher dans la piscine, ou supprimer un canard.",
          "Les canards enregistrés sont protégés : impossible de les jeter dans le siphon par accident.",
        ],
        images: [{ src: shopPatchImg, caption: "Le Coin des Canards et votre collection" }],
      },
      {
        title: "Des canards uniques",
        items: [
          "L'apparence des canards est désormais générée aléatoirement à chaque apparition, avec de vraies raretés : couleurs, accessoires, motifs et canards légendaires.",
        ],
      },
      {
        title: "Import / Export",
        items: [
          "Sauvegardez ou restaurez votre collection de canards dans un fichier JSON depuis les paramètres Summer.",
        ],
      },
    ],
  },
  {
    version: "1.1.4",
    date: "23 juin 2026",
    intro:
      "Corrections visuelles et amélioration du comportement de la notification de mise à jour.",
    sections: [
      {
        title: "Corrections",
        items: [
          "Le positionnement du halo sur les accessoires de canard a été ajusté pour un meilleur alignement visuel.",
          "La dialog de mise à jour n'apparaît plus avant que l'application soit complètement chargee.",
        ],
      },
    ],
  },
  {
    version: "1.1.3",
    date: "23 juin 2026",
    intro: "Version de test du système de mise à jour automatique sur Windows.",
    sections: [
      {
        title: "Test mise à jour automatique",
        items: [
          "Vérification que l'installation via le système integre fonctionne correctement sans passer par le .exe.",
        ],
      },
    ],
  },
  {
    version: "1.1.2",
    date: "23 juin 2026",
    intro:
      "Correction d'un bug ou la mise à jour se téléchargeait mais l'application ne redémarrait pas sur Windows.",
    sections: [
      {
        title: "Correction de la mise à jour automatique (Windows)",
        items: [
          "L'installeur de mise à jour tournait sans les droits nécessaires sur certaines configurations Windows, causant un échec silencieux après le téléchargement.",
          "L'application se fermait correctement mais ne redémarrait jamais. Le problème est désormais résolu.",
        ],
      },
    ],
  },
  {
    version: "1.1.1",
    date: "23 juin 2026",
    intro:
      "Cette mise à jour introduit le système de mise à jour automatique et apporte de nouvelles peaux de canard ainsi que des améliorations de la physique dans la piscine.",
    sections: [
      {
        title: "Mises à jour automatiques",
        items: [
          "L'application vérifie désormais automatiquement si une nouvelle version est disponible à chaque démarrage.",
          "Une notification discrète apparaît en haut de l'interface lorsqu'une mise à jour est prête à être installée - rien de forcé, vous choisissez quand installer.",
          "Le téléchargement et l'installation se font en arrière-plan. Une fois termine, l'application vous propose de redémarrer pour appliquer la mise à jour.",
          "Plus besoin de télécharger manuellement le programme d'installation : tout se passe depuis l'intérieur de l'application.",
        ],
      },
      {
        title: "Nouvelles peaux de canard",
        items: [
          "Quatre nouveaux canards font leur apparition dans la piscine : le canard pirate, le canard astronaute, le canard chef cuisinier et le canard detective.",
          "Les peaux sont sélectionnées aléatoirement à chaque lancement de la piscine, pour ne jamais avoir deux fois la même ambiance.",
        ],
      },
      {
        title: "Physique de la piscine améliorée",
        items: [
          "Les canards peuvent maintenant être lances avec de l'élan : maintenez le clic et relacher pour propulser le canard dans la direction choisie.",
          "Les canards rebondissent désormais les uns contre les autres lors des collisions, au lieu de se traverser.",
          "De petites éclaboussures apparaissent à chaque impact contre les bords ou lors des collisions entre canards.",
          "La physique de flottaison a été revue : les canards se balancent plus naturellement sur l'eau.",
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
          "Les résultats affichent des badges de qualité (2160P, 1080P) et de format (X265, X264, HEVC) en un coup d'œil.",
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

export const LATEST_VERSION = "1.6.6";
