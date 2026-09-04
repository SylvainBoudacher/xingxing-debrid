import c411Logo from "@/assets/sources/C411.webp";
import allDebridLogo from "@/assets/sources/alldebrid.webp";
import tmdbLogo from "@/assets/sources/tmdb.svg";
import vlcLogo from "@/assets/vlc.png";

export type ServiceCardData = {
  logo: string;
  title: string;
  badge: { label: string; tone: "free" | "paid" };
  description: string;
  /** Teinte de l'icone, du halo et du liseré haut. */
  accent: "indigo" | "amber" | "emerald" | "orange";
};

export const ACCENTS = {
  indigo: {
    icon: "bg-indigo-500/12 ring-indigo-500/20 text-indigo-600 dark:text-indigo-400",
    bar: "from-indigo-500/60",
    glow: "group-hover:ring-indigo-500/30",
  },
  amber: {
    icon: "bg-amber-500/12 ring-amber-500/20 text-amber-600 dark:text-amber-400",
    bar: "from-amber-500/60",
    glow: "group-hover:ring-amber-500/30",
  },
  emerald: {
    icon: "bg-emerald-500/12 ring-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    bar: "from-emerald-500/60",
    glow: "group-hover:ring-emerald-500/30",
  },
  orange: {
    icon: "bg-orange-500/12 ring-orange-500/20 text-orange-600 dark:text-orange-400",
    bar: "from-orange-500/60",
    glow: "group-hover:ring-orange-500/30",
  },
} as const;

export const TONES = {
  free: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  paid: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
} as const;

export const SERVICE_CARDS: ServiceCardData[] = [
  {
    logo: c411Logo,
    title: "C411",
    badge: { label: "Gratuit", tone: "free" },
    accent: "indigo",
    description:
      "Un site de torrents français, utilise ici comme source principale. XingXing y cherche films, séries et musiques et récupère le lien vers le fichier. L'inscription gratuite suffit.",
  },
  {
    logo: allDebridLogo,
    title: "AllDebrid",
    badge: { label: "Payant", tone: "paid" },
    accent: "amber",
    description:
      "Le débrideur. Il transforme le résultat trouvé sur C411 en téléchargement direct à haute vitesse, lisible immédiatement. Un abonnement est requis.",
  },
  {
    logo: tmdbLogo,
    title: "TMDB",
    badge: { label: "Gratuit", tone: "free" },
    accent: "emerald",
    description:
      "La base de données de films et séries. Elle alimente la page Découverte et affiche jaquettes, résumés et notes dans votre bibliothèque. Sa clé est gratuite et requise, comme les deux autres.",
  },
  {
    logo: vlcLogo,
    title: "Et un lecteur : VLC",
    badge: { label: "Gratuit", tone: "free" },
    accent: "orange",
    description:
      "Ce n'est pas un compte, juste un logiciel à installer sur votre machine. XingXing s'en sert pour lancer la lecture sans attendre la fin du téléchargement.",
  },
];
