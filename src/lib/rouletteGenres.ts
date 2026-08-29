import {
  Baby,
  Bomb,
  Camera,
  Castle,
  Compass,
  Drama,
  Fingerprint,
  Ghost,
  Heart,
  Landmark,
  Laugh,
  Music,
  Mountain,
  Rocket,
  Search,
  Sparkles,
  Swords,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface RouletteGenre {
  id: number;
  name: string;
  Icon: LucideIcon;
}

// Genres proposes par la roulette : le sous-ensemble film de la table TMDB
// (voir src/lib/tmdbGenres.ts), dans l'ordre d'affichage des puces.
export const ROULETTE_GENRES: RouletteGenre[] = [
  { id: 28, name: "Action", Icon: Zap },
  { id: 12, name: "Aventure", Icon: Compass },
  { id: 16, name: "Animation", Icon: Sparkles },
  { id: 35, name: "Comédie", Icon: Laugh },
  { id: 80, name: "Crime", Icon: Fingerprint },
  { id: 99, name: "Documentaire", Icon: Camera },
  { id: 18, name: "Drame", Icon: Drama },
  { id: 10751, name: "Familial", Icon: Baby },
  { id: 14, name: "Fantastique", Icon: Castle },
  { id: 36, name: "Histoire", Icon: Landmark },
  { id: 27, name: "Horreur", Icon: Ghost },
  { id: 10402, name: "Musique", Icon: Music },
  { id: 9648, name: "Mystère", Icon: Search },
  { id: 10749, name: "Romance", Icon: Heart },
  { id: 878, name: "Science-fiction", Icon: Rocket },
  { id: 53, name: "Thriller", Icon: Swords },
  { id: 10752, name: "Guerre", Icon: Bomb },
  { id: 37, name: "Western", Icon: Mountain },
];
