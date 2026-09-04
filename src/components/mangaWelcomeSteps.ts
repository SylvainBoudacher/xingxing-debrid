import discoverImg from "@/assets/patchnote/v1.6.0/discover-manga.webp";
import bibliothequeImg from "@/assets/patchnote/v1.6.0/bibliotheque-manga.webp";
import lectureImg from "@/assets/patchnote/v1.6.0/berserk.webp";

export interface MangaWelcomeStep {
  /** Etape d'accueil : illustration XingXing sur paysage, pas une capture d'ecran. */
  hero?: boolean;
  image?: string;
  title: string;
  body: string;
  /** Paragraphe secondaire, uniquement sur l'étape d'accueil. */
  extra?: string;
  /** Resume des trois etapes suivantes, affiche en pastilles. */
  highlights?: string[];
}

export const MANGA_WELCOME_STEPS: MangaWelcomeStep[] = [
  {
    hero: true,
    title: "Bienvenue fils et filles du soleil levant",
    body: "XingXing a appris à lire dans cette nouvelle mise à jour !",
    extra:
      "La 1.6.0 ouvre un nouveau chapitre : des milliers de mangas à chercher, à collectionner et à lire, sans jamais quitter l'application. Les trois écrans suivants font le tour du voyage.",
    highlights: ["Decouvrir", "Collectionner", "Lire"],
  },
  {
    image: discoverImg,
    title: "Découvrez des mangas",
    body: "Un nouvel onglet Mangas s'ajoute à la page Découverte : populaires, mieux notes, nouveautés, ou recherche directe par titre. Chaque fiche affiche ses tomes disponibles et s'ajoute à votre bibliothèque en un clic.",
  },
  {
    image: bibliothequeImg,
    title: "Retrouvez-les dans votre bibliothèque",
    body: "Les œuvres ajoutées se rangent dans une nouvelle section Mangas, à côté de vos films et séries. Filtres à lire / lu, listes personnalisées, recherche et tri : la même organisation que le reste de votre bibliothèque.",
  },
  {
    image: lectureImg,
    title: "Lisez-les directement dans l'application",
    body: "Plus besoin de logiciel externe. Le lecteur integre ouvre vos tomes en simple ou double page, gère le sens de lecture japonais, et retient ou vous vous êtes arrête.",
  },
];
