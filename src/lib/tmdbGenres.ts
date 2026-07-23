// Table des genres TMDB (films + series confondus : les ids partages sont
// identiques des deux cotes). Statique pour eviter un appel /genre/list.
const GENRE_NAMES: Record<number, string> = {
  12: "Aventure",
  14: "Fantastique",
  16: "Animation",
  18: "Drame",
  27: "Horreur",
  28: "Action",
  35: "Comédie",
  36: "Histoire",
  37: "Western",
  53: "Thriller",
  80: "Crime",
  99: "Documentaire",
  878: "Science-fiction",
  9648: "Mystère",
  10402: "Musique",
  10749: "Romance",
  10751: "Familial",
  10752: "Guerre",
  10759: "Action & Aventure",
  10762: "Enfants",
  10763: "Actualités",
  10764: "Téléréalité",
  10765: "SF & Fantastique",
  10766: "Feuilleton",
  10767: "Talk-show",
  10768: "Guerre & Politique",
  10770: "Téléfilm",
};

export function genreNames(ids: number[] | undefined): string[] {
  return (ids ?? []).map((id) => GENRE_NAMES[id]).filter((n): n is string => !!n);
}
