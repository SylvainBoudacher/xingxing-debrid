// Raretes du ruban. Deux echelles, selon ce que le vivier contient.
export type Rarity = "common" | "uncommon" | "rare" | "veryRare" | "exceptional";
export type RarityScale = "rating" | "worst";

export interface RarityTier {
  rarity: Rarity;
  /** Intervalle de notes couvert, borne haute exclue. */
  min: number;
  max: number;
  label: string;
  /** Borne telle qu'affichee par la legende. */
  bound: string;
  color: string;
}

const COLOR: Record<Rarity, string> = {
  common: "#4b69ff",
  uncommon: "#8847ff",
  rare: "#d32ce6",
  veryRare: "#eb4b4b",
  exceptional: "#ffd700",
};

// Echelle par defaut : plus la note monte, plus la case est rare. Les seuils
// CS:GO litteraux (9+ pour l'or) sont inatteignables avec vote_count.gte=200,
// ils sont recalibres sur la distribution reelle.
const RATING: RarityTier[] = [
  { rarity: "common", min: 0, max: 6, label: "Commun", bound: "< 6", color: COLOR.common },
  { rarity: "uncommon", min: 6, max: 7, label: "Peu commun", bound: "6,0+", color: COLOR.uncommon },
  { rarity: "rare", min: 7, max: 7.7, label: "Rare", bound: "7,0+", color: COLOR.rare },
  {
    rarity: "veryRare",
    min: 7.7,
    max: 8.4,
    label: "Très rare",
    bound: "7,7+",
    color: COLOR.veryRare,
  },
  {
    rarity: "exceptional",
    min: 8.4,
    max: Infinity,
    label: "Exceptionnel",
    bound: "8,4+",
    color: COLOR.exceptional,
  },
];

// Echelle du vivier des pires films : c'est la note la plus basse qui vaut le
// jackpot. Les seuils sont cales sur les 200 films du classement (2,2 a 4,6) et
// donnent 54 / 80 / 44 / 15 / 7 cases, soit une vraie pyramide.
const WORST: RarityTier[] = [
  {
    rarity: "common",
    min: 4.5,
    max: Infinity,
    label: "Médiocre",
    bound: "4,5+",
    color: COLOR.common,
  },
  {
    rarity: "uncommon",
    min: 4.2,
    max: 4.5,
    label: "Raté",
    bound: "4,2 - 4,5",
    color: COLOR.uncommon,
  },
  { rarity: "rare", min: 3.8, max: 4.2, label: "Navet", bound: "3,8 - 4,2", color: COLOR.rare },
  {
    rarity: "veryRare",
    min: 3.2,
    max: 3.8,
    label: "Nanar",
    bound: "3,2 - 3,8",
    color: COLOR.veryRare,
  },
  {
    rarity: "exceptional",
    min: 0,
    max: 3.2,
    label: "Culte",
    bound: "< 3,2",
    color: COLOR.exceptional,
  },
];

// Les tables sont ecrites dans l'ordre de la legende, du plus commun au plus
// rare : sur l'echelle inversee cet ordre descend en note au lieu de monter.
export function rarityTiers(scale: RarityScale): RarityTier[] {
  return scale === "worst" ? WORST : RATING;
}

// Classe sur la note arrondie au dixieme, celle que la pastille affiche : sans
// cet arrondi deux cases marquees 3,2 pourraient sortir de deux couleurs.
export function rarityOf(voteAverage: number, scale: RarityScale = "rating"): RarityTier {
  const note = Math.round(voteAverage * 10) / 10;
  const tiers = rarityTiers(scale);
  return tiers.find((t) => note >= t.min && note < t.max) ?? tiers[0];
}
