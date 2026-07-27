import discoverImg from "@/assets/patchnote/v1.6.0/discover-manga.webp";
import bibliothequeImg from "@/assets/patchnote/v1.6.0/bibliotheque-manga.webp";
import lectureImg from "@/assets/patchnote/v1.6.0/berserk.webp";

export interface MangaWelcomeStep {
  /** Etape d'accueil : illustration XingXing sur paysage, pas une capture d'ecran. */
  hero?: boolean;
  image?: string;
  title: string;
  body: string;
  /** Paragraphe secondaire, uniquement sur l'etape d'accueil. */
  extra?: string;
  /** Resume des trois etapes suivantes, affiche en pastilles. */
  highlights?: string[];
}

export const MANGA_WELCOME_STEPS: MangaWelcomeStep[] = [
  {
    hero: true,
    title: "Bienvenue fils et filles du soleil levant",
    body: "XingXing a appris a lire dans cette nouvelle mise a jour !",
    extra:
      "La 1.6.0 ouvre un nouveau chapitre : des milliers de mangas a chercher, a collectionner et a lire, sans jamais quitter l'application. Les trois ecrans suivants font le tour du voyage.",
    highlights: ["Decouvrir", "Collectionner", "Lire"],
  },
  {
    image: discoverImg,
    title: "Decouvrez des mangas",
    body: "Un nouvel onglet Mangas s'ajoute a la page Decouverte : populaires, mieux notes, nouveautes, ou recherche directe par titre. Chaque fiche affiche ses tomes disponibles et s'ajoute a votre bibliotheque en un clic.",
  },
  {
    image: bibliothequeImg,
    title: "Retrouvez-les dans votre bibliotheque",
    body: "Les oeuvres ajoutees se rangent dans une nouvelle section Mangas, a cote de vos films et series. Filtres a lire / lu, listes personnalisees, recherche et tri : la meme organisation que le reste de votre bibliotheque.",
  },
  {
    image: lectureImg,
    title: "Lisez-les directement dans l'application",
    body: "Plus besoin de logiciel externe. Le lecteur integre ouvre vos tomes en simple ou double page, gere le sens de lecture japonais, et retient ou vous vous etes arrete.",
  },
];
