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
      "La 1.5.4 enrichit la collection de canards avec de nouvelles recompenses, des drops plus justes, et corrige plusieurs points de confusion dans l'app.",
    sections: [
      {
        title: "Collection : nouvelles recompenses",
        items: [
          "Trois nouveaux canards a debloquer en completant la collection de couleurs.",
          "Les canards identiques se cumulent desormais sur une seule carte, avec le nombre d'exemplaires possedes.",
        ],
      },
      {
        title: "Drops : pity progressif",
        items: [
          "Plus vous obtenez de doublons, plus vos chances de tomber sur un canard que vous n'avez pas augmentent.",
          "Cela s'applique aux familles comme aux shiny : chaque shiny deja possede rend les shiny manquants plus probables.",
        ],
      },
      {
        title: "Reglages",
        items: [
          "Choisissez la page sur laquelle l'application s'ouvre au demarrage.",
          "Nouveau reglage pour indiquer manuellement l'emplacement de VLC sous Windows, si l'application ne le trouve pas toute seule.",
        ],
      },
      {
        title: "Corrections",
        items: [
          "Le bouton de telechargement a ete retire de la page Decouverte pour eviter la confusion.",
          "La notification d'ajout a la bibliotheque ouvre maintenant la fiche du film ou de la serie concernee, et plus seulement la page Bibliotheque.",
          "Corrections mineures dans la Bibliotheque.",
        ],
      },
    ],
  },
  {
    version: "1.5.3",
    date: "23 juillet 2026",
    intro:
      "La 1.5.3 renforce la page de bienvenue avec une protection contre les problemes de connexion a C411, et enrichit la Bibliotheque avec des genres automatiques issus de TMDB, un systeme de tri et de filtrage par genre, ainsi qu'une vue personnalisee pour creer ses propres categories.",
    sections: [
      {
        title: "Page de bienvenue : protection connexion C411",
        items: [
          "Les utilisateurs qui n'ont pas acces a C411 sont desormais bloques sur la page de verification de connexion, avec un message clair expliquant la situation.",
          "Un guide integre explique les causes possibles : probleme DNS, IPv6 actif sur le reseau, ou autre complexite reseau pouvant empecher l'acces au site.",
          "Des solutions sont proposees directement dans l'interface pour aider a resoudre ces problemes sans quitter l'application.",
        ],
      },
      {
        title: "Bibliotheque : genres automatiques depuis TMDB",
        items: [
          "Chaque titre de votre bibliotheque affiche maintenant ses genres (Action, Horreur, Comedie, etc.) recuperes automatiquement depuis TMDB.",
          "Les genres apparaissent directement sur les cartes pour identifier le type de contenu en un coup d'oeil.",
        ],
      },
      {
        title: "Bibliotheque : tri et filtrage par genre",
        items: [
          "Triez votre bibliotheque par genre pour regrouper automatiquement les contenus de meme type.",
          "Filtrez l'integralite de votre bibliotheque par genre pour n'afficher que les titres correspondant a la categorie choisie.",
        ],
      },
      {
        title: "Bibliotheque : vue personnalisee",
        items: [
          "Une nouvelle vue de tri « Personnalise » est disponible pour ceux qui souhaitent organiser leur bibliotheque a leur facon.",
          "Creez vos propres categories, donnez-leur le nom que vous voulez, et classez vos titres selon votre propre logique.",
          "Cette vue coexiste avec les tris automatiques existants et se sauvegarde entre les sessions.",
        ],
      },
    ],
  },
  {
    version: "1.5.2",
    date: "11 juillet 2026",
    intro:
      "La 1.5.2 enrichit la gestion des dossiers de serie dans la bibliotheque, ajoute des raccourcis clavier pour le Coin des Canards, corrige un bug sur les cles API, et equilibre les taux de drop des canards rares.",
    sections: [
      {
        title: "Bibliotheque : gestion avancee des dossiers de serie",
        items: [
          "Ajoutez un seul episode d'une saison dans la bibliotheque : l'application cree automatiquement le bon dossier de saison et y place l'episode.",
          "Ajoutez une autre saison de la meme serie : les deux saisons se regroupent automatiquement sous une seule oeuvre, sans intervention.",
          "Personnalisez entierement la structure de vos dossiers : ajout, suppression et renommage de saisons directement depuis la bibliotheque.",
        ],
      },
      {
        title: "Bibliotheque : debridage et selection avancee",
        items: [
          "Les films et series en cours de debridage sont desormais visibles et gerable directement depuis la bibliotheque.",
          "Les saisons et episodes d'une serie peuvent etre selectionnes et supprimes depuis la bibliotheque.",
        ],
      },
      {
        title: "Coin des Canards : raccourcis clavier",
        items: [
          "Un raccourci clavier permet desormais de capturer un canard directement au clavier. Par defaut : C.",
          "Un deuxieme raccourci permet d'activer l'aspirateur sans passer par la souris. Par defaut : V.",
          "Les deux raccourcis sont entierement configurables depuis la page Parametres.",
        ],
      },
      {
        title: "Corrections",
        items: [
          "Correction d'un bug ou les canards pouvaient ne pas apparaitre si des appels API etaient encore en cours ou bloques au demarrage. Le spawn des canards se base desormais uniquement sur le lancement de l'application.",
          "Correction d'un bug ou certaines cles API pouvaient etre mal enregistrees au lancement de l'application et depuis la page Reglages.",
        ],
      },
      {
        title: "Equilibrage : canards rares",
        items: [
          "Le Roi des Canards et les versions shiny etaient apparus un peu trop souvent. Leurs taux de drop ont ete divises par deux pour retrouver leur caractere exceptionnel.",
        ],
      },
    ],
  },
  {
    version: "1.5.1",
    date: "8 juillet 2026",
    intro:
      "La 1.5.1 corrige un bug graphique mineur, ajoute le support natif Apple Silicon pour Mac, et ameliore la lisibilite des resultats de series.",
    sections: [
      {
        title: "Corrections graphiques",
        items: ["Resolution d'un bug graphique mineur affectant l'affichage de l'interface."],
      },
      {
        title: "Support Apple Silicon",
        items: [
          "Les Mac equipes d'une puce Apple Silicon (M1, M2, M3...) disposent desormais de leur propre build natif.",
          "L'application tourne nativement sur ARM, sans emulation Rosetta, pour de meilleures performances et une consommation reduite.",
        ],
      },
      {
        title: "Resultats de series : labels saison ou episode",
        items: [
          "Dans les resultats de recherche pour les series, un label indique desormais en un coup d'oeil si le fichier correspond a une saison complete ou a un episode unique.",
          "Plus besoin de lire le nom de fichier en entier pour savoir ce que vous allez telecharger.",
        ],
      },
    ],
  },
  {
    version: "1.5.0",
    date: "7 juillet 2026",
    intro:
      "La 1.5.0 recentre l'application autour de la barre de recherche principale, integre l'import/export de profil pour faciliter le multi-device, et renforce TMDB comme element clé de l'experience.",
    sections: [
      {
        title: "La barre de recherche redevient principale",
        items: [
          "La barre de recherche sur la page d'accueil devient l'element principal de l'application pour faire vos recherches.",
          "Avec l'auto-completion des noms de series et films, retrouver vos contenus est plus rapide et plus fluide.",
          "L'application tourne desormais bien autour de la page Decouvrir et de son mode de fonctionnement, ce qui simplifie l'utilisation globalement.",
          "Rien n'empeche d'utiliser la recherche brute sur C411 ou Nyaa pour autant - les deux approches coexistent.",
        ],
        images: [
          {
            src: newsPrincipalesV150Img,
            caption: "La barre de recherche principale avec auto-completion",
          },
        ],
      },
      {
        title: "Decouvrir : auto-completion globale",
        items: [
          "La page Decouvrir obtient aussi un systeme d'auto-completion des recherches.",
          "Les recherches sont maintenant globales et ne ciblent plus uniquement films, series ou animation - trouvez ce que vous cherchez quel que soit le type de contenu.",
        ],
      },
      {
        title: "Import/Export de profil pour multi-device",
        items: [
          "Exportez votre profil complet dans un fichier encrypte par un mot de passe : reglages, informations, cles API, canards, bibliotheque, et tout le reste.",
          "Importez ce fichier sur une autre installation de Xingxing pour retrouver l'integralite de votre configuration.",
          "Attention : ne partagez votre profil avec n'importe qui, car il contient vos cles API et donnees personnelles.",
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
          "La cle API du service TMDB est maintenant obligatoire pour le bon fonctionnement de l'application et du user flow global.",
          "TMDB est essential pour enrichir votre experience de recherche et de decouverte.",
        ],
      },
      {
        title: "Coin des Canards : canards nommes par defaut",
        items: [
          "Les canards ne sont plus des « sans nom » : ils portent desormais par defaut le nom de leur famille, comme « Canard moustachu ».",
          "Vous pouvez toujours les renommer comme bon vous semble, mais cette amelioration rend votre collection plus vivante.",
        ],
      },
      {
        title: "Coin des Canards : bateau securise",
        items: [
          "Le bateau de XingXing ne peut plus lancer le jeu tout seul sans une action du joueur avec le typhon.",
          "Cela evite les interactions involontaires et rend le jeu plus intentionnel.",
        ],
        images: [
          {
            src: canardsNomesV150Img,
            caption: "Les canards nommes et le bateau de XingXing securise",
          },
        ],
      },
    ],
  },
  {
    version: "1.4.3",
    date: "6 juillet 2026",
    intro:
      "La 1.4.3 ajoute des raccourcis clavier pour naviguer entre les pages et un label sur la page Decouvrir pour reperer les titres deja dans votre bibliotheque.",
    sections: [
      {
        title: "Raccourcis clavier",
        items: [
          "Naviguez entre les pages de l'application directement au clavier, sans passer par le menu.",
          "Les raccourcis sont entierement configurables depuis la page Parametres.",
        ],
        images: [
          {
            src: raccourcisV143Img,
            caption: "Les raccourcis clavier configurables dans les Parametres",
          },
        ],
      },
      {
        title: "Decouvrir : label bibliotheque",
        items: [
          "Les films et series deja presents dans votre bibliotheque affichent desormais un petit label directement sur leur carte dans la page Decouvrir.",
          "Plus besoin de cliquer pour savoir si vous l'avez deja : c'est visible en un coup d'oeil.",
        ],
      },
    ],
  },
  {
    version: "1.4.2",
    date: "3 juillet 2026",
    intro:
      "La 1.4.2 corrige plusieurs bugs signales apres la 1.4.0 : direction du bateau de XingXing, hitbox de Frisson, effet retro de l'easter egg, et quelques skins de canards.",
    sections: [
      {
        title: "Piscine",
        items: [
          "Le bateau de XingXing retrouve la bonne direction : il se deplace desormais comme dans le jeu, et non plus a l'envers.",
        ],
      },
      {
        title: "Jeux",
        items: [
          "L'effet retro de l'easter egg beneficie d'une resolution plus elevee - le rendu pixelise etait trop grossier.",
          "Correction de la hitbox de Frisson : la detection de collision etait trop grande par rapport a son sprite.",
        ],
      },
      {
        title: "Coin des Canards",
        items: [
          "Des tooltips sont maintenant affichés sur les boutons d'action du stand pour mieux comprendre leur role.",
          "Le bouton « Supprimer de la liste » a ete renomme en « Relacher le canard ».",
          "Une confirmation s'affiche avant de relacher un canard, pour eviter les accidents.",
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
      "La 1.4.0 introduit le Pokedex des canards : une collection a completer, 9 nouvelles especes, des versions shiny pour chaque famille, et des recompenses pour les plus achernes.",
    sections: [
      {
        title: "Le Pokedex des canards",
        items: [
          "Un Pokedex fait son apparition dans le Coin des Canards. Retrouvez-y toutes les especes de canards a debloquer et suivez votre progression.",
          "9 nouvelles especes de canards viennent agrandir la famille : partez a la chasse pour les decouvrir.",
          "Chaque famille dispose desormais d'une version shiny, plus rare et reconnaissable entre mille.",
        ],
        images: [
          {
            src: pokedexV140Img,
            caption: "Le Pokedex des canards - toutes les especes a debloquer",
          },
        ],
      },
      {
        title: "Recompenses",
        items: [
          "Remplir votre Pokedex completement debloque une nouvelle recompense.",
          "Posseder toutes les familles ET toutes leurs versions shiny offre une recompense exceptionnelle.",
        ],
      },
      {
        title: "Un visiteur mysterieux",
        items: [
          "Un mysterieux XingXing se balade dans la piscine... il y a peut-etre quelque chose a faire avec. Je vous laisse trouver !",
        ],
        images: [
          {
            src: xingxingV140Img,
            caption: "XingXing dans la piscine - a vous de decouvrir son secret",
          },
        ],
      },
    ],
  },
  {
    version: "1.3.6",
    date: "1 juillet 2026",
    intro:
      "La 1.3.6 apporte des ameliorations au Coin des Canards avec un tri par rarete, un aspirateur pour la collection, un idle timer pour economiser vos ressources, et une meilleure experience dans la Bibliotheque avec la selection multiple et la suppression directe.",
    sections: [
      {
        title: "Parametres : validation du nombre de canards",
        items: [
          "La modification du nombre de canards dans les Parametres est maintenant validee avant d'etre appliquee.",
          "Cela evite d'effacer accidentellement tout votre board en cas de clic involontaire.",
        ],
      },
      {
        title: "Coin des Canards : tri par rarete",
        items: [
          "Une nouvelle option de tri permet de classer vos canards par niveau de rarete.",
          "Identifiez rapidement vos canards les plus precieux ou ceux qui vous manquent encore.",
        ],
      },
      {
        title: "Coin des Canards : idle timer",
        items: [
          "Un nouveau parametre permet de masquer automatiquement l'interface de la piscine apres 30 secondes d'inactivite.",
          "Utile pour economiser des ressources lorsque vous n'interagissez pas avec les canards.",
          "Configurez cette duree dans les Parametres selon votre preference.",
        ],
      },
      {
        title: "Coin des Canards : aspirateur",
        items: [
          "Un nouvel item special fait son apparition dans la piscine : un aspirateur capable de collecter les canards.",
          "Utilisez-le pour capturer automatiquement vos canards.",
        ],
      },
      {
        title: "Bibliotheque : selection multiple et suppression directe",
        items: [
          "Selectionnez plusieurs titres a la fois pour les valider, les dé-valider ou les supprimer d'un seul geste.",
          "Un bouton de suppression sur chaque vignette permet egalement de supprimer un titre directement sans passer par la selection multiple.",
        ],
      },
      {
        title: "Corrections",
        items: ["Resolution de quelques bugs mineurs et ameliorations mineures."],
      },
    ],
  },
  {
    version: "1.3.5",
    date: "1 juillet 2026",
    intro:
      "La 1.3.5 introduit un nouveau canard ultra legendaire, un parametre d'affichage personnalise au lancement, et une section « Pour vous » dans la page Decouvrir.",
    sections: [
      {
        title: "Nouveau canard : Roi des Canards",
        items: [
          "Le Roi des Canards fait son entree dans la piscine. Ultra legendaire, il n'apparait qu'avec 1% de chance.",
          "Bonne chance.",
        ],
        images: [
          {
            src: roiDesCanardsV135Img,
            caption: "Le Roi des Canards - ultra legendaire, drop 1%",
          },
        ],
      },
      {
        title: "Parametre d'affichage au lancement « personnalise »",
        items: [
          "Une nouvelle option « Personnalise » est disponible dans le parametre de taille au lancement.",
          "L'application memorise la derniere taille et position de la fenetre et les restaure exactement au prochain demarrage.",
        ],
      },
      {
        title: "Section « Pour vous » dans la page Decouvrir",
        items: [
          "Une nouvelle section « Pour vous » apparait dans la page Decouvrir.",
          "Elle analyse vos likes et votre bibliotheque pour identifier vos gouts et vous proposer des titres qui correspondent vraiment a ce que vous aimez.",
        ],
      },
      {
        title: "Corrections",
        items: ["Resolution de quelques bugs mineurs."],
      },
    ],
  },
  {
    version: "1.3.4",
    date: "27 juin 2026",
    intro:
      "La 1.3.4 apporte le telechargement natif directement dans l'application, une selection multiple revue, des modales plus lisibles et une page Parametres entierement reorganisee.",
    sections: [
      {
        title: "Page Parametres reorganisee",
        items: [
          "La page Parametres a ete revisee pour accueillir toutes les nouvelles options : les sections sont mieux decoupees et plus faciles a parcourir.",
        ],
        images: [
          {
            src: parametresV134Img,
            caption: "La page Parametres reorganisee avec les nouvelles sections",
          },
        ],
      },
      {
        title: "Telechargement depuis l'application",
        items: [
          "Il est desormais possible de telecharger vos fichiers directement depuis l'application, sans passer par un navigateur ou un gestionnaire externe.",
          "Un dossier de destination peut etre configure dans les Parametres pour choisir ou vos telechargements atterrissent.",
          "Un parametre permet egalement de definir combien de fichiers sont telecharges en parallele lors d'une selection multiple.",
        ],
        images: [
          {
            src: modaleV134Img,
            caption: "Le telechargement natif depuis l'application",
          },
        ],
      },
      {
        title: "Selection multiple",
        items: [
          "La selection de plusieurs fichiers est desormais disponible sur la page Magnets et dans la Bibliotheque.",
          "Selectionnez plusieurs elements d'un coup pour les telecharger ou les supprimer en une seule action.",
        ],
        images: [
          {
            src: multiSelectionV134Img,
            caption: "La selection multiple sur la page Magnets et dans la Bibliotheque",
          },
        ],
      },
      {
        title: "Modales de fichier revisitees",
        items: [
          "Les modales de detail de fichier sur la page Magnets ont ete entierement refaites pour etre plus claires et plus lisibles.",
        ],
      },
    ],
  },
  {
    version: "1.3.3",
    date: "27 juin 2026",
    intro:
      "La piscine s'enrichit d'un canon a balles de tennis, d'un drapeau de parade et d'une belle refonte de l'affichage des raretes.",
    sections: [
      {
        title: "Rarete visible avec des etoiles",
        items: [
          "La rarete de chaque canard s'affiche desormais sous forme d'etoiles directement dans le stand, pour identifier d'un coup d'oeil vos canards les plus rares.",
          "Les effets visuels des canards legendaires ont ete ameliores : les animations sont plus intenses et plus fideles a leur statut exceptionnel.",
        ],
      },
      {
        title: "Canon a balles de tennis",
        items: [
          "Un canon a balles de tennis fait son apparition dans la piscine. Ajustez la trajectoire et faites-en partir pour perturber (gentiment) vos canards.",
          "Les canards reagissent aux impacts et sont propulses dans la direction du tir. La chasse est ouverte.",
          "Des nenuphars flottent egalement sur l'eau : les canards peuvent y prendre appui et les balles ricochent dessus.",
        ],
      },
      {
        title: "Mode parade",
        items: [
          "Un drapeau de parade est disponible dans la piscine. Il ne sert a rien. Mais il est la.",
        ],
      },
      {
        title: "Corrections",
        items: [
          "Correction d'un bug qui empechait de relacher un canard depuis le stand - le bouton fonctionne correctement desormais.",
        ],
      },
    ],
  },
  {
    version: "1.3.2",
    date: "27 juin 2026",
    intro: "Ameliorations de performances sur la page Ma bibliotheque.",
    sections: [
      {
        title: "Performances de la bibliotheque",
        items: [
          "La page Ma bibliotheque a ete optimisee pour rester fluide meme avec un grand nombre d'elements.",
          "Des tests de scalabilite ont ete realises pour valider le comportement avec des collections importantes.",
        ],
      },
    ],
  },
  {
    version: "1.3.1",
    date: "26 juin 2026",
    intro:
      "La page Ma bibliotheque est entierement revue : nouvelle vue en jaquettes, enrichissement TMDB, tri par type de contenu, et regroupement automatique des saisons.",
    introImage: {
      src: bibliothequeV131Img,
      caption: "La page Ma bibliotheque revisitee - jaquettes, TMDB et tri par type",
    },
    sections: [
      {
        title: "Nouvelle interface : vue en jaquettes",
        items: [
          "La bibliotheque affiche desormais les jaquettes de vos films et series, pour une navigation plus visuelle et agreable.",
          "De nouveaux boutons permettent d'agir rapidement sur chaque element sans avoir a ouvrir sa fiche.",
          "L'avancement est visible en un coup d'oeil directement sur chaque carte.",
        ],
      },
      {
        title: "Enrichissement TMDB",
        items: [
          "Chaque element de la bibliotheque peut etre relie aux donnees TMDB : affiche officielle, titre, synopsis, note.",
          "Le lien se fait automatiquement lors de l'ajout, ou manuellement depuis la fiche de l'element.",
        ],
      },
      {
        title: "Tri par films et series",
        items: [
          "Un nouveau filtre permet d'afficher uniquement les films, uniquement les series, ou tout le contenu en une seule vue.",
        ],
      },
      {
        title: "Regroupement automatique des saisons",
        items: [
          "Si deux saisons d'une meme serie sont detectees dans votre bibliotheque, elles sont automatiquement regroupees en une seule carte.",
          "Toutes les saisons restent accessibles depuis cette carte unifiee, sans encombrer la vue principale.",
        ],
      },
    ],
  },
  {
    version: "1.3.0",
    date: "26 juin 2026",
    intro:
      "La version 1.3 apporte la page Bibliotheque : votre hub personnel pour suivre ce que vous avez vu, episode par episode, et reprendre exactement ou vous en etiez.",
    sections: [
      {
        title: "Nouvelle page : Bibliotheque",
        items: [
          "Un hub personnel centralise tout ce que vous avez ajoute : films et series, avec leur statut de visionnage.",
          "Pour les series, le suivi se fait episode par episode - cochez chaque episode vu au fur et a mesure.",
          "Vous pouvez ajouter une serie entiere dans VLC en un seul clic pour l'ouvrir directement.",
        ],
        images: [
          {
            src: bibliothequeImg,
            caption: "La page Bibliotheque - votre suivi personnel episode par episode",
          },
        ],
      },
      {
        title: "Bouton Reprendre",
        items: [
          'Un nouveau bouton "Reprendre" detecte automatiquement le prochain episode non coche et le lance dans l\'application.',
          "Plus besoin de se souvenir ou vous en etiez : un seul clic et vous continuez exactement la ou vous vous etes arrete.",
        ],
        images: [
          {
            src: reprendreImg,
            caption: "Le bouton Reprendre - lance le prochain episode non vu automatiquement",
          },
        ],
      },
      {
        title: "Nouveau parametre : marquage automatique a la lecture",
        items: [
          "Un nouveau parametre dans la section Bibliotheque des Preferences permet de choisir si un film ou un episode est automatiquement coche comme visionne lorsque vous cliquez sur le bouton VLC.",
          "Par defaut, le marquage est actif : jouer un contenu le coche immediatement. Desactivez l'option si vous preferez cocher manuellement apres avoir regarde.",
        ],
        images: [
          {
            src: marquageAutoImg,
            caption: "Le parametre de marquage automatique dans les preferences de la Bibliotheque",
          },
        ],
      },
      {
        title: "Nouveau parametre : taille au lancement",
        items: [
          "Un nouveau parametre general permet de choisir la taille de la fenetre au demarrage de l'application : compacte, normale ou maximisee.",
          "Le reglage est sauvegarde et applique automatiquement a chaque lancement.",
        ],
        images: [
          {
            src: tailleLancementImg,
            caption: "Le parametre de taille au lancement dans les preferences generales",
          },
        ],
      },
    ],
  },
  {
    version: "1.2.2",
    date: "25 juin 2026",
    intro: "Mise a jour de la page de configuration pour les nouveaux utilisateurs.",
    sections: [
      {
        title: "Page de configuration revisitee",
        items: [
          "La page d'accueil pour les nouveaux utilisateurs a ete entierement mise a jour : les etapes sont plus claires, mieux organisees et plus faciles a suivre.",
          "Une etape de verification des prerequis permet de s'assurer que tout est en ordre avant de commencer la configuration.",
          "Une etape de personnalisation du theme a ete ajoutee pour choisir l'apparence de l'application des la premiere utilisation.",
        ],
      },
    ],
  },
  {
    version: "1.2.1",
    date: "24 juin 2026",
    intro:
      "Le Coin des Canards passe au niveau superieur : mettez vos canards en reserve, retrouvez-les grace a la recherche et aux filtres, et gardez une piscine toujours a la bonne taille.",
    sections: [
      {
        title: "Mettre un canard en reserve",
        items: [
          "Chaque canard enregistre peut desormais etre mis a l'eau ou range en reserve directement depuis le stand, d'un seul clic.",
          "Un canard mis en reserve quitte la piscine avec une petite animation de rangement vers le stand, et reste conserve entre les sessions.",
          "Le compteur du stand indique en permanence combien de canards sont a l'eau.",
        ],
      },
      {
        title: "Recherche et filtres dans la collection",
        items: [
          "Une barre de recherche permet de retrouver un canard par son nom.",
          "Un filtre dedie affiche tous les canards, uniquement ceux a l'eau, ou uniquement ceux en reserve.",
        ],
      },
      {
        title: "La piscine reste a la bonne taille",
        items: [
          "Au demarrage, si vous avez plus de canards a l'eau que la limite d'affichage, le surplus est automatiquement mis en reserve et vous etes prevenu.",
          "Impossible de remettre un canard a l'eau quand la piscine est pleine : un message vous invite a en retirer un, ou a augmenter la limite dans les parametres.",
          "Si vous baissez la limite d'affichage, les canards non enregistres disparaissent en premier, puis juste assez de canards enregistres passent en reserve pour respecter la nouvelle limite.",
        ],
      },
      {
        title: "Confort du stand",
        items: [
          "Le panneau du stand s'ouvre desormais au-dessus de son icone pour ne plus la masquer.",
          "Cliquer en dehors du panneau le ferme automatiquement.",
          "La liste de la collection est limitee en hauteur et devient defilante, avec un indice visuel clair lorsqu'il reste des canards a voir.",
        ],
      },
    ],
  },
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

export const LATEST_VERSION = "1.6.0";
